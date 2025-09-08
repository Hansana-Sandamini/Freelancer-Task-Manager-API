package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.service.DeadlineReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/deadline-reminders")
@RequiredArgsConstructor
@CrossOrigin
public class DeadlineReminderController {

    private final DeadlineReminderService deadlineReminderService;

    @PostMapping("/task/{taskId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse> sendManualReminder(@PathVariable Long taskId) {
        deadlineReminderService.sendManualDeadlineReminder(taskId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Manual deadline reminder sent successfully",
                null
        ));
    }

    @PostMapping("/run-now")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> runReminderServiceNow() {
        deadlineReminderService.checkDeadlineReminders();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Deadline reminder service executed successfully",
                null
        ));
    }

}
