package lk.ijse.aad.backend.service;

public interface DeadlineReminderService {
    void checkDeadlineReminders();
    void sendManualDeadlineReminder(Long taskId);
}
