package lk.ijse.aad.backend.service;

public interface EmailService {
    void sendEmail(String to, String subject, String text);
    String generateVerificationCode();
    void sendForgotPasswordCode(String email, String code);
}
