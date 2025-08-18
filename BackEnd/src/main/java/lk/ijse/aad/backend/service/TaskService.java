package lk.ijse.aad.backend.service;

import lk.ijse.aad.backend.dto.TaskDTO;

import java.util.List;

public interface TaskService {
    void saveTask(TaskDTO taskDTO);
    void updateTask(TaskDTO taskDTO);
    void deleteTask(String taskId);
    List<TaskDTO> getAllTasks();
}
