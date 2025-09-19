package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.TaskDTO;
import lk.ijse.aad.backend.entity.*;
import lk.ijse.aad.backend.repository.TaskRepository;
import lk.ijse.aad.backend.repository.UserRepository;
import lk.ijse.aad.backend.service.PaymentService;
import lk.ijse.aad.backend.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@CrossOrigin
public class TaskController {

    private final TaskService taskService;
    private final PaymentService paymentService;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

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

        // Release payment using PaymentService
        paymentService.releasePayment(id);

        return ResponseEntity.ok(new ApiResponse(
                200,
                "Work submitted and payment released successfully",
                null
        ));
    }


    @PutMapping("/{taskId}/complete")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<ApiResponse> completeTask(@PathVariable Long taskId, Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = (User) userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));

            if (!task.getFreelancer().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(new ApiResponse(403, "You are not the assigned freelancer for this task", null));
            }

            // Release payment to freelancer
            paymentService.releasePayment(taskId);

            // Update task status to COMPLETED
            task.setStatus(TaskStatus.COMPLETED);
            taskRepository.save(task);

            return ResponseEntity.ok(new ApiResponse(200, "Task completed and payment released to freelancer", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(500, "Failed to complete task: " + e.getMessage(), null));
        }
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
