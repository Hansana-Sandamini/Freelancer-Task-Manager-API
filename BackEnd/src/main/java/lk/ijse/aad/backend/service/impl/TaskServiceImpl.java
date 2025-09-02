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
import org.springframework.stereotype.Service;

import java.util.List;
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

    private TaskDTO convertToDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus().name());
        dto.setDeadline(task.getDeadline());
        dto.setClientId(task.getClient().getId());
        dto.setTaskCategoryName(task.getTaskCategory().getName());
        return dto;
    }

}
