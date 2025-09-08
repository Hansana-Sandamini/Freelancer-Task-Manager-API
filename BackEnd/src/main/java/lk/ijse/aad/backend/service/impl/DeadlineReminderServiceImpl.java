package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.entity.NotificationType;
import lk.ijse.aad.backend.entity.Task;
import lk.ijse.aad.backend.entity.TaskStatus;
import lk.ijse.aad.backend.repository.TaskRepository;
import lk.ijse.aad.backend.service.DeadlineReminderService;
import lk.ijse.aad.backend.service.EmailService;
import lk.ijse.aad.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeadlineReminderServiceImpl implements DeadlineReminderService {

    private final TaskRepository taskRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Override
    @Scheduled(cron = "0 0 9 * * ?") // Run daily at 9 AM
    public void checkDeadlineReminders() {
        try {
            LocalDateTime now = LocalDateTime.now();

            // Check for tasks due in 1 day
            LocalDateTime oneDayLater = now.plusDays(1);
            List<Task> oneDayDeadlines = taskRepository.findByDeadlineBetweenAndStatus(
                    now.plusHours(23), oneDayLater.plusHours(1), TaskStatus.IN_PROGRESS
            );

            for (Task task : oneDayDeadlines) {
                if (task.getFreelancer() != null) {
                    String message = "⏰ URGENT: Task '" + task.getTitle() + "' deadline is TOMORROW (" +
                            task.getDeadline().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) + ")";

                    sendDeadlineNotification(task, message);
                }
            }

            // Check for tasks due in 3 days
            LocalDateTime threeDaysLater = now.plusDays(3);
            List<Task> threeDayDeadlines = taskRepository.findByDeadlineBetweenAndStatus(
                    now.plusDays(2).plusHours(23), threeDaysLater.plusHours(1), TaskStatus.IN_PROGRESS
            );

            for (Task task : threeDayDeadlines) {
                if (task.getFreelancer() != null) {
                    String message = "📅 Reminder: Task '" + task.getTitle() + "' deadline is in 3 days (" +
                            task.getDeadline().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) + ")";

                    sendDeadlineNotification(task, message);
                }
            }

            // Check for overdue tasks
            List<Task> overdueTasks = taskRepository.findByDeadlineBeforeAndStatus(
                    now, TaskStatus.IN_PROGRESS
            );

            for (Task task : overdueTasks) {
                if (task.getFreelancer() != null) {
                    String message = "🚨 OVERDUE: Task '" + task.getTitle() + "' was due on " +
                            task.getDeadline().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) +
                            ". Please complete it immediately!";

                    sendDeadlineNotification(task, message);

                    // Also notify the client about overdue task
                    String clientMessage = "Task '" + task.getTitle() + "' assigned to " +
                            task.getFreelancer().getName() + " is OVERDUE. Due date: " +
                            task.getDeadline().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"));

                    notificationService.createAndSendNotification(
                            task.getClient().getId(),
                            clientMessage,
                            NotificationType.DEADLINE_REMINDER,
                            task.getId(),
                            task.getTitle()
                    );
                }
            }

        } catch (Exception e) {
            log.error("Error in deadline reminder service", e);
        }
    }

    private void sendDeadlineNotification(Task task, String message) {
        notificationService.createAndSendNotification(
                task.getFreelancer().getId(),
                message,
                NotificationType.DEADLINE_REMINDER,
                task.getId(),
                task.getTitle()
        );

        log.info("Deadline reminder sent for task: {}", task.getTitle());
    }

    @Override
    public void sendManualDeadlineReminder(Long taskId) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found with ID: " + taskId));

            if (task.getFreelancer() != null && task.getStatus() == TaskStatus.IN_PROGRESS) {
                String message = "Manual Reminder: Task '" + task.getTitle() + "' deadline is on " +
                        task.getDeadline().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"));

                sendDeadlineNotification(task, message);
            }
        } catch (Exception e) {
            log.error("Error sending manual deadline reminder for task: {}", taskId, e);
        }
    }

}
