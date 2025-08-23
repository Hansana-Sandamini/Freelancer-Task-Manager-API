package lk.ijse.aad.backend.service;

import lk.ijse.aad.backend.dto.NotificationDTO;

import java.util.List;

public interface NotificationService {
    void saveNotification(NotificationDTO notificationDTO);
    void updateNotification(NotificationDTO notificationDTO);
    void deleteNotification(Long id);
    NotificationDTO getNotificationById(Long id);
    List<NotificationDTO> getAllNotifications();
    List<NotificationDTO> getNotificationsByUserId(Long userId);
    List<NotificationDTO> getUnreadNotificationsByUserId(Long userId);
    void markAsRead(Long notificationId);
}
