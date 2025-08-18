package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.TaskDTO;
import lk.ijse.aad.backend.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskServiceImpl implements TaskService {

    @Override
    public void saveTask(TaskDTO taskDTO) {
    }

    @Override
    public void updateTask(TaskDTO taskDTO) {
    }

    @Override
    public void deleteTask(String taskId) {
    }

    @Override
    public List<TaskDTO> getAllTasks() {
        return List.of();
    }

}
