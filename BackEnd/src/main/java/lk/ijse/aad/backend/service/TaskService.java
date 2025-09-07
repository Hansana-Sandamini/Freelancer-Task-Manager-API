package lk.ijse.aad.backend.service;

import lk.ijse.aad.backend.dto.TaskDTO;
import lk.ijse.aad.backend.entity.Task;

import java.util.List;
import java.util.Map;

public interface TaskService {
    void saveTask(TaskDTO taskDTO);
    void updateTask(TaskDTO taskDTO);
    void deleteTask(String taskId);
    List<TaskDTO> getAllTasks();
    List<TaskDTO> getTasksByClientId(String clientId);
    List<String> getAllFreelancerEmails();
    Task getTaskEntityById(Long id);
    void submitWork(Long taskId, String workUrl);
    Map<String, Long> getTaskCounts();
    Map<String, Long> getClientTaskCounts(Long clientId);
    Map<String, Long> getFreelancerTaskCounts(Long freelancerId);
}
