package lk.ijse.aad.backend.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lk.ijse.aad.backend.dto.UserDTO;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.service.EmailService;
import lk.ijse.aad.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final UserService userService;
    private final ModelMapper modelMapper;
    private final Random random = new SecureRandom();

    @Override
    public String generateVerificationCode() {
        return String.format("%06d", random.nextInt(1000000));
    }

    @Override
    public void sendForgotPasswordCode(String email, String code) {
        User user = userService.findByEmail(email);
        user.setVerificationCode(code);
        user.setCodeExpiresAt(LocalDateTime.now().plusMinutes(10));
        userService.updateUser(modelMapper.map(user, UserDTO.class));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("TaskFlow - Password Reset Verification");
        message.setText("Your 6-digit verification code is: " + code + "\n\nThis code expires in 10 minutes. Use it to reset your password.");

        mailSender.send(message);
    }

    @Async
    @Override
    public void sendEmail(String to, String subject, String text) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, true);  // true = HTML content

            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

}
