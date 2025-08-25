package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.NotificationDTO;
import lk.ijse.aad.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@CrossOrigin
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> createNotification(@RequestBody NotificationDTO notificationDTO) {
        notificationService.saveNotification(notificationDTO);
        return ResponseEntity.ok(new ApiResponse(
                201,
                "Notification Created Successfully",
                null
        ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> updateNotification(@PathVariable Long id, @RequestBody NotificationDTO notificationDTO) {
        notificationDTO.setId(id);
        notificationService.updateNotification(notificationDTO);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Notification Updated Successfully",
                null
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Notification Deleted Successfully",
                null
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getNotificationById(@PathVariable Long id) {
        NotificationDTO notification = notificationService.getNotificationById(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Notification Retrieved Successfully",
                notification
        ));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getAllNotifications() {
        List<NotificationDTO> notifications = notificationService.getAllNotifications();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Notifications Retrieved Successfully",
                notifications
        ));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getNotificationsByUser(@PathVariable Long userId) {
        List<NotificationDTO> notifications = notificationService.getNotificationsByUserId(userId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "User Notifications Retrieved Successfully",
                notifications
        ));
    }

    @GetMapping("/user/{userId}/unread")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> getUnreadNotificationsByUser(@PathVariable Long userId) {
        List<NotificationDTO> notifications = notificationService.getUnreadNotificationsByUserId(userId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Unread Notifications Retrieved Successfully",
                notifications
        ));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('CLIENT', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<ApiResponse> markNotificationAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Notification Marked as Read Successfully",
                null
        ));
    }

}
