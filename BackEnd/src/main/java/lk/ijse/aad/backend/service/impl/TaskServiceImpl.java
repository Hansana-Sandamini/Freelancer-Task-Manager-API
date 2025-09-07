package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.TaskDTO;
import lk.ijse.aad.backend.entity.*;
import lk.ijse.aad.backend.repository.TaskCategoryRepository;
import lk.ijse.aad.backend.repository.TaskRepository;
import lk.ijse.aad.backend.repository.AuthRepository;
import lk.ijse.aad.backend.repository.UserRepository;
import lk.ijse.aad.backend.service.EmailService;
import lk.ijse.aad.backend.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final AuthRepository authRepository;
    private final UserRepository userRepository;
    private final TaskCategoryRepository taskCategoryRepository;
    private final ModelMapper modelMapper;
    private final EmailService emailService;

    @Override
    public void saveTask(TaskDTO taskDTO) {
        try {
            User client = authRepository.findById(taskDTO.getClientId())
                    .orElseThrow(() -> new RuntimeException("Client not found with ID: " + taskDTO.getClientId()));

            // Find task category by name
            TaskCategory taskCategory = taskCategoryRepository.findByName(taskDTO.getTaskCategoryName())
                    .orElseThrow(() -> new RuntimeException("Task category not found: " + taskDTO.getTaskCategoryName()));

            Task task = modelMapper.map(taskDTO, Task.class);
            task.setClient(client);
            task.setTaskCategory(taskCategory);
            task.setStatus(TaskStatus.OPEN);

            taskRepository.save(task);

            // Send emails to all freelancers
            sendMailToFreelancers(task);

            log.info("Task saved successfully: {}", taskDTO.getTitle());

        } catch (Exception e) {
            log.error("Error while saving task: {}", taskDTO.getTitle(), e);
            throw new RuntimeException("Failed to save task: " + e.getMessage(), e);
        }
    }

    @Override
    public void updateTask(TaskDTO taskDTO) {
        try {
            Task existingTask = taskRepository.findById(taskDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskDTO.getId()));

            // Update fields
            existingTask.setTitle(taskDTO.getTitle());
            existingTask.setDescription(taskDTO.getDescription());
            existingTask.setDeadline(taskDTO.getDeadline());
            existingTask.setWorkUrl(taskDTO.getWorkUrl());

            // Update task category if provided
            if (taskDTO.getTaskCategoryName() != null) {
                TaskCategory taskCategory = taskCategoryRepository.findByName(taskDTO.getTaskCategoryName())
                        .orElseThrow(() -> new RuntimeException("Task category not found: " + taskDTO.getTaskCategoryName()));
                existingTask.setTaskCategory(taskCategory);
            }

            // Convert string status to enum
            if (taskDTO.getStatus() != null) {
                existingTask.setStatus(TaskStatus.valueOf(taskDTO.getStatus()));
            }

            taskRepository.save(existingTask);
            log.info("Task updated successfully: {}", taskDTO.getId());

        } catch (Exception e) {
            log.error("Error while updating task: {}", taskDTO.getId(), e);
            throw new RuntimeException("Failed to update task: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteTask(String taskId) {
        try {
            Long id = Long.parseLong(taskId);
            if (!taskRepository.existsById(id)) {
                throw new RuntimeException("Task not found with ID: " + taskId);
            }
            taskRepository.deleteById(id);
            log.info("Task deleted successfully: {}", taskId);

        } catch (Exception e) {
            log.error("Error while deleting task: {}", taskId, e);
            throw new RuntimeException("Failed to delete task: " + e.getMessage(), e);
        }
    }

    @Override
    public List<TaskDTO> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<TaskDTO> getTasksByClientId(String clientId) {
        return taskRepository.findByClientId(Long.valueOf(clientId)).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getAllFreelancerEmails() {
        return userRepository.findByRole(Role.valueOf("FREELANCER"))
                .stream()
                .map(User::getEmail)
                .collect(Collectors.toList());
    }

    @Override
    public Task getTaskEntityById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
    }

    @Async
    protected void sendMailToFreelancers(Task task) {
        List<String> freelancerEmails = userRepository.findByRole(Role.FREELANCER)
                .stream()
                .map(User::getEmail)
                .toList();

        String subject = "🆕 New Task Available: " + task.getTitle();
        String message = "<h2>Hello Freelancer!</h2>" +
                "<p>A new task has been posted:</p>" +
                "<ul>" +
                "<li><b>Title:</b> " + task.getTitle() + "</li>" +
                "<li><b>Description:</b> " + task.getDescription() + "</li>" +
                "</ul>" +
                "<p>Visit TaskFlow to apply for this task.</p>" +
                "<p>Best regards,<br>The TaskFlow Team</p>";

        for (String email : freelancerEmails) {
            emailService.sendEmail(email, subject, message);
        }
    }

    @Override
    public void submitWork(Long taskId, String workUrl) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));

            // Get current user
            Long currentUserId = getCurrentUserId();
            User currentUser = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + currentUserId));

            // Debug logging
            log.info("=== SUBMIT WORK DEBUG ===");
            log.info("Task ID: {}", taskId);
            log.info("Current User ID: {}", currentUserId);
            log.info("Current User Role: {}", currentUser.getRole());
            log.info("Task Freelancer ID: {}", task.getFreelancer() != null ? task.getFreelancer().getId() : "NULL");
            log.info("Task Status: {}", task.getStatus());

            // Verify that the current user is the assigned freelancer
            if (task.getFreelancer() == null) {
                throw new RuntimeException("No freelancer is assigned to this task");
            }

            if (!task.getFreelancer().getId().equals(currentUserId)) {
                log.error("User ID mismatch: Current={}, Assigned={}", currentUserId, task.getFreelancer().getId());
                throw new RuntimeException("You are not assigned to this task");
            }

            // Verify task is in progress
            if (task.getStatus() != TaskStatus.IN_PROGRESS) {
                throw new RuntimeException("Task is not in progress. Current status: " + task.getStatus());
            }

            task.setWorkUrl(workUrl);
            task.setStatus(TaskStatus.COMPLETED);
            taskRepository.save(task);

            // Send notification to client
            sendWorkSubmissionEmail(task);

            log.info("Work submitted for task: {}", taskId);

        } catch (Exception e) {
            log.error("Error while submitting work for task: {}", taskId, e);
            throw new RuntimeException("Failed to submit work: " + e.getMessage(), e);
        }
    }

    // Replace placeholder with actual implementation
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("No authenticated user found");
        }
        String email = authentication.getName(); // Assumes email is the username
        User user = (User) userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return user.getId();
    }

    @Async
    protected void sendWorkSubmissionEmail(Task task) {
        if (task.getFreelancer() != null && task.getClient() != null) {
            // Email to client
            String clientSubject = "📬 Work Submitted: " + task.getTitle();
            String clientMessage = "<h2>Work Submitted for Review</h2>" +
                    "<p>The freelancer has submitted work for your task: <b>" + task.getTitle() + "</b></p>" +
                    "<p>Work URL: <a href=\"" + task.getWorkUrl() + "\">" + task.getWorkUrl() + "</a></p>" +
                    "<p>Please review the work and mark it as completed if satisfied.</p>" +
                    "<p>Best regards,<br>The TaskFlow Team</p>";

            emailService.sendEmail(task.getClient().getEmail(), clientSubject, clientMessage);

            // Email to freelancer
            String freelancerSubject = "✅ Work Submitted: " + task.getTitle();
            String freelancerMessage = "<h2>Work Submitted Successfully</h2>" +
                    "<p>You have successfully submitted work for the task: <b>" + task.getTitle() + "</b></p>" +
                    "<p>Work URL: <a href=\"" + task.getWorkUrl() + "\">" + task.getWorkUrl() + "</a></p>" +
                    "<p>The client will review your work and mark it as completed.</p>" +
                    "<p>Best regards,<br>The TaskFlow Team</p>";

            emailService.sendEmail(task.getFreelancer().getEmail(), freelancerSubject, freelancerMessage);
        }
    }

    private TaskDTO convertToDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus().name());
        dto.setDeadline(task.getDeadline());
        dto.setClientId(task.getClient().getId());
        dto.setTaskCategoryName(task.getTaskCategory().getName());
        dto.setWorkUrl(task.getWorkUrl());

        // Add freelancerId if assigned
        if (task.getFreelancer() != null) {
            dto.setFreelancerId(task.getFreelancer().getId());
            log.info("Converting task {} to DTO - Freelancer ID: {}", task.getId(), task.getFreelancer().getId());
        } else {
            dto.setFreelancerId(null);
            log.info("Converting task {} to DTO - No freelancer assigned", task.getId());
        }

        return dto;
    }

    @Override
    public Map<String, Long> getTaskCounts() {
        Map<String, Long> counts = new HashMap<>();
        counts.put("allTasks", (long) taskRepository.findAll().size());
        counts.put("completedTasks", taskRepository.countByStatus(TaskStatus.COMPLETED));
        return counts;
    }

    @Override
    public Map<String, Long> getClientTaskCounts(Long clientId) {
        Map<String, Long> counts = new HashMap<>();
        List<Task> tasks = taskRepository.findByClientId(clientId);
        counts.put("myTasks", (long) tasks.size());
        counts.put("completedTasks", tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count());
        return counts;
    }

    @Override
    public Map<String, Long> getFreelancerTaskCounts(Long freelancerId) {
        Map<String, Long> counts = new HashMap<>();
        List<Task> tasks = taskRepository.findByFreelancerId(freelancerId);
        counts.put("activeTasks", tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count());
        counts.put("completedTasks", tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count());
        return counts;
    }

}
