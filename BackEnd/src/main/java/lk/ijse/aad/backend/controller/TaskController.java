package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.TaskDTO;
import lk.ijse.aad.backend.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse> getTasksByClient(@PathVariable Long clientId) {
        List<TaskDTO> tasks = taskService.getTasksByClientId(String.valueOf(clientId));
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Tasks Retrieved Successfully",
                tasks
        ));
    }

    @PutMapping("/{id}/submit-work")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse> submitWork(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String workUrl = request.get("workUrl");
        taskService.submitWork(id, workUrl);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Work Submitted Successfully",
                null
        ));
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getTaskCounts() {
        Map<String, Long> counts = taskService.getTaskCounts();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Task counts retrieved successfully",
                counts
        ));
    }

    @GetMapping("/count/client/{clientId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse> getClientTaskCounts(@PathVariable Long clientId) {
        Map<String, Long> counts = taskService.getClientTaskCounts(clientId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Client task counts retrieved successfully",
                counts
        ));
    }

    @GetMapping("/count/freelancer/{freelancerId}")
    @PreAuthorize("hasAnyRole('FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getFreelancerTaskCounts(@PathVariable Long freelancerId) {
        Map<String, Long> counts = taskService.getFreelancerTaskCounts(freelancerId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Freelancer task counts retrieved successfully",
                counts
        ));
    }

}
