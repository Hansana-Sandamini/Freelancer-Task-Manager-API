package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.NotificationDTO;
import lk.ijse.aad.backend.entity.Notification;
import lk.ijse.aad.backend.entity.NotificationType;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.repository.NotificationRepository;
import lk.ijse.aad.backend.repository.AuthRepository;
import lk.ijse.aad.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final AuthRepository authRepository;
    private final ModelMapper modelMapper;

    @Override
    public void saveNotification(NotificationDTO notificationDTO) {
        try {
            User user = authRepository.findById(notificationDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + notificationDTO.getUserId()));

            Notification notification = modelMapper.map(notificationDTO, Notification.class);
            notification.setUser(user);
            notification.setCreatedAt(LocalDateTime.now());
            notification.setRead(false);

            notificationRepository.save(notification);
            log.info("Notification saved successfully for user: {}", notificationDTO.getUserId());

        } catch (Exception e) {
            log.error("Error while saving notification for user: {}", notificationDTO.getUserId(), e);
            throw new RuntimeException("Failed to save notification: " + e.getMessage(), e);
        }
    }

    @Override
    public void updateNotification(NotificationDTO notificationDTO) {
        try {
            Notification existingNotification = notificationRepository.findById(notificationDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + notificationDTO.getId()));

            // Update fields
            existingNotification.setMessage(notificationDTO.getMessage());
            existingNotification.setRead(notificationDTO.isRead());
            existingNotification.setType(NotificationType.valueOf(notificationDTO.getNotificationType()));

            notificationRepository.save(existingNotification);
            log.info("Notification updated successfully: {}", notificationDTO.getId());

        } catch (Exception e) {
            log.error("Error while updating notification: {}", notificationDTO.getId(), e);
            throw new RuntimeException("Failed to update notification: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteNotification(Long id) {
        try {
            if (!notificationRepository.existsById(id)) {
                throw new RuntimeException("Notification not found with ID: " + id);
            }
            notificationRepository.deleteById(id);
            log.info("Notification deleted successfully: {}", id);

        } catch (Exception e) {
            log.error("Error while deleting notification: {}", id, e);
            throw new RuntimeException("Failed to delete notification: " + e.getMessage(), e);
        }
    }

    @Override
    public NotificationDTO getNotificationById(Long id) {
        try {
            Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + id));

            return convertToDTO(notification);

        } catch (Exception e) {
            log.error("Error while fetching notification: {}", id, e);
            throw new RuntimeException("Failed to fetch notification: " + e.getMessage(), e);
        }
    }

    @Override
    public List<NotificationDTO> getAllNotifications() {
        try {
            return notificationRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error while fetching all notifications", e);
            throw new RuntimeException("Failed to fetch notifications: " + e.getMessage(), e);
        }
    }

    @Override
    public List<NotificationDTO> getNotificationsByUserId(Long userId) {
        try {
            if (!authRepository.existsById(userId)) {
                throw new RuntimeException("User not found with ID: " + userId);
            }

            return notificationRepository.findByUserId(userId).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error while fetching notifications for user: {}", userId, e);
            throw new RuntimeException("Failed to fetch notifications: " + e.getMessage(), e);
        }
    }

    @Override
    public List<NotificationDTO> getUnreadNotificationsByUserId(Long userId) {
        try {
            if (!authRepository.existsById(userId)) {
                throw new RuntimeException("User not found with ID: " + userId);
            }

            return notificationRepository.findByUserIdAndIsReadFalse(userId).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error while fetching unread notifications for user: {}", userId, e);
            throw new RuntimeException("Failed to fetch unread notifications: " + e.getMessage(), e);
        }
    }

    @Override
    public void markAsRead(Long notificationId) {
        try {
            Notification notification = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + notificationId));

            notification.setRead(true);
            notificationRepository.save(notification);
            log.info("Notification marked as read: {}", notificationId);

        } catch (Exception e) {
            log.error("Error while marking notification as read: {}", notificationId, e);
            throw new RuntimeException("Failed to mark notification as read: " + e.getMessage(), e);
        }
    }

    private NotificationDTO convertToDTO(Notification notification) {
        NotificationDTO dto = modelMapper.map(notification, NotificationDTO.class);
        dto.setUserId(notification.getUser().getId());
        if (notification.getTask() != null) {
            dto.setTaskId(notification.getTask().getId());
        }
        return dto;
    }

}
