package lk.ijse.aad.backend.service;

import lk.ijse.aad.backend.dto.TaskCategoryDTO;

import java.util.List;

public interface TaskCategoryService {
    void saveTaskCategory(TaskCategoryDTO taskCategoryDTO);
    void updateTaskCategory(TaskCategoryDTO taskCategoryDTO);
    void deleteTaskCategory(String categoryId);
    List<TaskCategoryDTO> getAllTaskCategories();
    TaskCategoryDTO getTaskCategoryById(Long id);
    TaskCategoryDTO getTaskCategoryByName(String name);
    boolean existsByName(String name);
    long getTaskCountByCategory(Long categoryId);
}
