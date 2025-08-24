package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.NotificationDTO;
import lk.ijse.aad.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    @Override
    public void saveNotification(NotificationDTO notificationDTO) {

    }

    @Override
    public void updateNotification(NotificationDTO notificationDTO) {

    }

    @Override
    public void deleteNotification(Long id) {

    }

    @Override
    public NotificationDTO getNotificationById(Long id) {
        return null;
    }

    @Override
    public List<NotificationDTO> getAllNotifications() {
        return List.of();
    }

    @Override
    public List<NotificationDTO> getNotificationsByUserId(Long userId) {
        return List.of();
    }

    @Override
    public List<NotificationDTO> getUnreadNotificationsByUserId(Long userId) {
        return List.of();
    }

    @Override
    public void markAsRead(Long notificationId) {

    }

}
