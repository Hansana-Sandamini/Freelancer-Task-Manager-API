package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.TaskCategoryDTO;
import lk.ijse.aad.backend.service.TaskCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/task-categories")
@RequiredArgsConstructor
@CrossOrigin
public class TaskCategoryController {

    private final TaskCategoryService taskCategoryService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> createTaskCategory(@RequestBody TaskCategoryDTO taskCategoryDTO) {
        taskCategoryService.saveTaskCategory(taskCategoryDTO);
        return ResponseEntity.ok(new ApiResponse(
                201,
                "Task Category Created Successfully",
                null
        ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> updateTaskCategory(@PathVariable Long id, @RequestBody TaskCategoryDTO taskCategoryDTO) {
        taskCategoryDTO.setId(id);
        taskCategoryService.updateTaskCategory(taskCategoryDTO);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Task Category Updated Successfully",
                null
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteTaskCategory(@PathVariable String id) {
        taskCategoryService.deleteTaskCategory(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Task Category Deleted Successfully",
                null
        ));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CLIENT','FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getAllTaskCategories() {
        List<TaskCategoryDTO> categories = taskCategoryService.getAllTaskCategories();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Task Categories Retrieved Successfully",
                categories
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT','FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getTaskCategoryById(@PathVariable Long id) {
        TaskCategoryDTO category = taskCategoryService.getTaskCategoryById(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Task Category Retrieved Successfully",
                category
        ));
    }

    @GetMapping("/name/{name}")
    @PreAuthorize("hasAnyRole('CLIENT','FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getTaskCategoryByName(@PathVariable String name) {
        TaskCategoryDTO category = taskCategoryService.getTaskCategoryByName(name);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Task Category Retrieved Successfully",
                category
        ));
    }

    @GetMapping("/exists/{name}")
    @PreAuthorize("hasAnyRole('CLIENT','FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> checkCategoryExists(@PathVariable String name) {
        boolean exists = taskCategoryService.existsByName(name);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Category existence checked successfully",
                exists
        ));
    }

    @GetMapping("/{id}/task-count")
    @PreAuthorize("hasAnyRole('CLIENT','FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getTaskCountByCategory(@PathVariable Long id) {
        long taskCount = Long.parseLong(String.valueOf(taskCategoryService.getTaskCountByCategory(id)));
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Task count retrieved successfully",
                taskCount
        ));
    }

}
