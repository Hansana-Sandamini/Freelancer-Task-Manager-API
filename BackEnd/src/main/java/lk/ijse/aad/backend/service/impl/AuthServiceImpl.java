package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.AuthDTO;
import lk.ijse.aad.backend.dto.AuthResponseDTO;
import lk.ijse.aad.backend.dto.RegisterDTO;
import lk.ijse.aad.backend.entity.NotificationType;
import lk.ijse.aad.backend.entity.Role;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.repository.AuthRepository;
import lk.ijse.aad.backend.repository.UserRepository;
import lk.ijse.aad.backend.service.EmailService;
import lk.ijse.aad.backend.service.AuthService;
import lk.ijse.aad.backend.service.NotificationService;
import lk.ijse.aad.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthRepository authRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Override
    public AuthResponseDTO authenticate(AuthDTO authDTO) {

        // Let Spring Security handle authentication
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authDTO.getEmail(),
                        authDTO.getPassword()
                )
        );

        if (authentication.isAuthenticated()) {
            // Get User from DB
            User user = authRepository.findByEmail(authDTO.getEmail())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            // Generate tokens
            String accessToken = jwtUtil.generateToken(user.getEmail());

            return new AuthResponseDTO(
                    accessToken,
                    null,
                    user.getId(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getName()
            );
        } else {
            throw new BadCredentialsException("Invalid credentials");
        }
    }

    @Override
    public String register(RegisterDTO registerDTO) {

        // Check if Email already exists
        if (authRepository.existsByEmail(registerDTO.getEmail())) {
            log.warn("Registration attempt with existing email: {}", registerDTO.getEmail());
            throw new RuntimeException("Email already exists");
        }

        // Create new user entity
        User user = User.builder()
                .email(registerDTO.getEmail())
                .password(passwordEncoder.encode(registerDTO.getPassword()))
                .name(registerDTO.getName())
                .role(Role.valueOf(registerDTO.getRole()))
                .build();

        // Save user to database
        authRepository.save(user);
        log.info("User registered successfully: {}", registerDTO.getEmail());

        // Send welcome email
        emailService.sendEmail(
                registerDTO.getEmail(),
                "Welcome to TaskFlow 🎉",
                "<h2>Hello " + registerDTO.getName() + "!</h2>" +
                        "<p>Thank you for joining TaskFlow. We're excited to have you on board!</p>" +
                        "<p>Whether you're here to find work or hire talent, TaskFlow is your platform to connect and succeed.</p>" +
                        "<p>Get started by logging in to your account and exploring our features.</p>" +
                        "<p>Best regards,<br>The TaskFlow Team</p>"
        );

        // Notify admins about new registration
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notificationService.createAndSendNotification(
                    admin.getId(),
                    "New user registered: " + registerDTO.getName() + " (" + registerDTO.getEmail() + ")",
                    NotificationType.USER_REGISTERED,
                    null,
                    null
            );
        }

        return "User registered successfully";
    }

}
