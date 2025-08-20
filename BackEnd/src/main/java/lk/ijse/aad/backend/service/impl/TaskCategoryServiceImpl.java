package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.TaskCategoryDTO;
import lk.ijse.aad.backend.entity.TaskCategory;
import lk.ijse.aad.backend.repository.TaskCategoryRepository;
import lk.ijse.aad.backend.repository.TaskRepository;
import lk.ijse.aad.backend.service.TaskCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskCategoryServiceImpl implements TaskCategoryService {

    private final TaskCategoryRepository taskCategoryRepository;
    private final TaskRepository taskRepository;
    private final ModelMapper modelMapper;

    @Override
    public void saveTaskCategory(TaskCategoryDTO taskCategoryDTO) {
        try {
            // Check if category with same name already exists
            if (taskCategoryRepository.existsByName(taskCategoryDTO.getName())) {
                throw new RuntimeException("Task category with name '" + taskCategoryDTO.getName() + "' already exists");
            }

            TaskCategory taskCategory = modelMapper.map(taskCategoryDTO, TaskCategory.class);
            taskCategoryRepository.save(taskCategory);

            log.info("Task category saved successfully: {}", taskCategoryDTO.getName());

        } catch (Exception e) {
            log.error("Error while saving task category: {}", taskCategoryDTO.getName(), e);
            throw new RuntimeException("Failed to save task category: " + e.getMessage(), e);
        }
    }

    @Override
    public void updateTaskCategory(TaskCategoryDTO taskCategoryDTO) {
        try {
            TaskCategory existingCategory = taskCategoryRepository.findById(taskCategoryDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Task category not found with ID: " + taskCategoryDTO.getId()));

            // Check if another category with the same name exists (excluding current category)
            if (taskCategoryRepository.existsByName(taskCategoryDTO.getName()) &&
                    !existingCategory.getName().equals(taskCategoryDTO.getName())) {
                throw new RuntimeException("Task category with name '" + taskCategoryDTO.getName() + "' already exists");
            }

            // Update fields
            existingCategory.setName(taskCategoryDTO.getName());
            existingCategory.setDescription(taskCategoryDTO.getDescription());

            taskCategoryRepository.save(existingCategory);
            log.info("Task category updated successfully: {}", taskCategoryDTO.getId());

        } catch (Exception e) {
            log.error("Error while updating task category: {}", taskCategoryDTO.getId(), e);
            throw new RuntimeException("Failed to update task category: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteTaskCategory(String categoryId) {
        try {
            Long id = Long.parseLong(categoryId);
            if (!taskCategoryRepository.existsById(id)) {
                throw new RuntimeException("Task category not found with ID: " + categoryId);
            }

            // Check if category has associated tasks
            long taskCount = taskRepository.countByTaskCategoryId(id);
            if (taskCount > 0) {
                throw new RuntimeException("Cannot delete category with ID: " + categoryId +
                        ". It has " + taskCount + " associated tasks.");
            }

            taskCategoryRepository.deleteById(id);
            log.info("Task category deleted successfully: {}", categoryId);

        } catch (Exception e) {
            log.error("Error while deleting task category: {}", categoryId, e);
            throw new RuntimeException("Failed to delete task category: " + e.getMessage(), e);
        }
    }

    @Override
    public List<TaskCategoryDTO> getAllTaskCategories() {
        try {
            List<TaskCategory> categories = taskCategoryRepository.findAll();
            return categories.stream()
                    .map(this::convertToDTOWithTaskCount)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error while retrieving all task categories", e);
            throw new RuntimeException("Failed to retrieve task categories: " + e.getMessage(), e);
        }
    }

    @Override
    public TaskCategoryDTO getTaskCategoryById(Long id) {
        try {
            TaskCategory category = taskCategoryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Task category not found with ID: " + id));
            return convertToDTOWithTaskCount(category);
        } catch (Exception e) {
            log.error("Error while retrieving task category: {}", id, e);
            throw new RuntimeException("Failed to retrieve task category: " + e.getMessage(), e);
        }
    }

    @Override
    public TaskCategoryDTO getTaskCategoryByName(String name) {
        try {
            TaskCategory category = taskCategoryRepository.findByName(name)
                    .orElseThrow(() -> new RuntimeException("Task category not found with name: " + name));
            return convertToDTOWithTaskCount(category);
        } catch (Exception e) {
            log.error("Error while retrieving task category by name: {}", name, e);
            throw new RuntimeException("Failed to retrieve task category: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean existsByName(String name) {
        try {
            return taskCategoryRepository.existsByName(name);
        } catch (Exception e) {
            log.error("Error while checking if category exists by name: {}", name, e);
            throw new RuntimeException("Failed to check category existence: " + e.getMessage(), e);
        }
    }

    @Override
    public long getTaskCountByCategory(Long categoryId) {
        try {
            return taskRepository.countByTaskCategoryId(categoryId);
        } catch (Exception e) {
            log.error("Error while getting task count for category: {}", categoryId, e);
            throw new RuntimeException("Failed to get task count: " + e.getMessage(), e);
        }
    }

    private TaskCategoryDTO convertToDTOWithTaskCount(TaskCategory category) {
        TaskCategoryDTO dto = modelMapper.map(category, TaskCategoryDTO.class);
        dto.setTaskCount((int) taskRepository.countByTaskCategoryId(category.getId()));
        return dto;
    }

}
