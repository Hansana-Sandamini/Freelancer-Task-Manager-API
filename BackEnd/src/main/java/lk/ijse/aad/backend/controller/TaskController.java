package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.TaskDTO;
import lk.ijse.aad.backend.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@CrossOrigin
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse> createTask(@RequestBody TaskDTO taskDTO) {
        taskService.saveTask(taskDTO);
        return ResponseEntity.ok(new ApiResponse(
                201,
                "Task Created Successfully",
                null
        ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse> updateTask(@PathVariable Long id, @RequestBody TaskDTO taskDTO) {
        taskDTO.setId(id);
        taskService.updateTask(taskDTO);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Task Updated Successfully",
                null
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse> deleteTask(@PathVariable String id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Task Deleted Successfully",
                null
        ));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CLIENT','FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getAllTasks() {
        List<TaskDTO> tasks = taskService.getAllTasks();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Tasks Retrieved Successfully",
                tasks
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT','FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getTaskById(@PathVariable Long id) {
        List<TaskDTO> tasks = taskService.getAllTasks();
        TaskDTO task = tasks.stream()
                .filter(t -> t.getId().equals(id))
                .findFirst()
                .orElse(null);

        return ResponseEntity.ok(new ApiResponse(
                200,
                task != null ? "Task Retrieved Successfully" : "Task Not Found",
                task
        ));
    }

}
