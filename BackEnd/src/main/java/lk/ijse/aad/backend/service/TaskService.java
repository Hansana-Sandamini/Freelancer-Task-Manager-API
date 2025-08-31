package lk.ijse.aad.backend.service;

import lk.ijse.aad.backend.dto.TaskDTO;
import lk.ijse.aad.backend.entity.Task;

import java.util.List;

public interface TaskService {
    void saveTask(TaskDTO taskDTO);
    void updateTask(TaskDTO taskDTO);
    void deleteTask(String taskId);
    List<TaskDTO> getAllTasks();
    List<TaskDTO> getTasksByClientId(String clientId);
    List<String> getAllFreelancerEmails();
    Task getTaskEntityById(Long id);
}
