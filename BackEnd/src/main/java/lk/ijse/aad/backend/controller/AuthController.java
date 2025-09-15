package lk.ijse.aad.backend.controller;

import jakarta.validation.Valid;
import lk.ijse.aad.backend.dto.*;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.service.AuthService;
import lk.ijse.aad.backend.service.EmailService;
import lk.ijse.aad.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final EmailService emailService;
    private final ModelMapper modelMapper;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody RegisterDTO registerDTO){
        return ResponseEntity.ok(new ApiResponse(
                201,
                "User Registered Successfully",
                authService.register(registerDTO))
        );
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody AuthDTO authDTO){
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Login Successful",
                authService.authenticate(authDTO))
        );
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            if (!userService.existsByEmail(request.getEmail())) {
                Map<String, Object> error = new HashMap<>();
                error.put("data", "Email not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            String verificationCode = emailService.generateVerificationCode();
            User user = userService.findByEmail(request.getEmail());

            user.setVerificationCode(verificationCode);
            user.setCodeExpiresAt(java.time.LocalDateTime.now().plusMinutes(10));
            userService.updateUser(modelMapper.map(user, UserDTO.class));

            emailService.sendForgotPasswordCode(request.getEmail(), verificationCode);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Verification code sent to your email");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("data", "Failed to send verification code");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        try {
            User user = userService.findByEmailAndVerificationCode(request.getEmail(), request.getCode());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Code verified successfully");
            response.put("email", user.getEmail());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("data", "Invalid or expired verification code");
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            User user = userService.findByEmailAndVerificationCode(request.getEmail(), request.getCode());
            userService.updatePassword(user, request.getNewPassword());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Password reset successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("data", "Invalid or expired verification code");
            return ResponseEntity.badRequest().body(error);
        }
    }

}
