package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.TaskDTO;
import lk.ijse.aad.backend.entity.Task;
import lk.ijse.aad.backend.entity.TaskStatus;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.repository.TaskRepository;
import lk.ijse.aad.backend.repository.UserRepository;
import lk.ijse.aad.backend.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public void saveTask(TaskDTO taskDTO) {
        User client = userRepository.findByEmail(taskDTO.getClient().getEmail())
                .orElseThrow(() -> new RuntimeException("Client not found"));

        Task task = modelMapper.map(taskDTO, Task.class);
        task.setClient(client);
        task.setStatus(TaskStatus.OPEN);

        taskRepository.save(task);
        log.info("Task saved successfully: {}", taskDTO.getTitle());
    }

    @Override
    public void updateTask(TaskDTO taskDTO) {
        Task existingTask = taskRepository.findById(taskDTO.getId())
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Update fields
        existingTask.setTitle(taskDTO.getTitle());
        existingTask.setDescription(taskDTO.getDescription());
        existingTask.setDeadline(taskDTO.getDeadline());
        existingTask.setStatus(TaskStatus.valueOf(taskDTO.getStatus()));

        // Convert string status to enum
        if (taskDTO.getStatus() != null) {
            existingTask.setStatus(TaskStatus.valueOf(taskDTO.getStatus()));
        }

        taskRepository.save(existingTask);
        log.info("Task updated successfully: {}", taskDTO.getId());
    }

    @Override
    public void deleteTask(String taskId) {
        Long id = Long.parseLong(taskId);
        if (!taskRepository.existsById(id)) {
            throw new RuntimeException("Task not found");
        }
        taskRepository.deleteById(id);
        log.info("Task deleted successfully: {}", taskId);
    }

    @Override
    public List<TaskDTO> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(task -> modelMapper.map(task, TaskDTO.class))
                .collect(Collectors.toList());
    }

}
