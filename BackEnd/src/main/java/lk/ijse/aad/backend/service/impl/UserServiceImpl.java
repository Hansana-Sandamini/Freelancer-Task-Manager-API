package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.AuthDTO;
import lk.ijse.aad.backend.dto.AuthResponseDTO;
import lk.ijse.aad.backend.dto.RegisterDTO;
import lk.ijse.aad.backend.entity.Role;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.repository.UserRepository;
import lk.ijse.aad.backend.service.UserService;
import lk.ijse.aad.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponseDTO authenticate(AuthDTO authDTO) {

        // Let Spring Security handle authentication
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authDTO.getEmail(),
                        authDTO.getPassword()
                )
        );

        // If successful, generate token
        if (authentication.isAuthenticated()) {
            String accessToken = jwtUtil.generateToken(authDTO.getEmail());
            return new AuthResponseDTO(accessToken);
        } else {
            throw new BadCredentialsException("Invalid credentials");
        }
    }

    @Override
    public String register(RegisterDTO registerDTO) {

        // Check if Email already exists
        if (userRepository.existsByEmail(registerDTO.getEmail())) {
            log.warn("Registration attempt with existing email: {}", registerDTO.getEmail());
            throw new RuntimeException("Email already exists");
        }

        // Create new user entity
        User user = User.builder()
                .email(registerDTO.getEmail())
                .password(passwordEncoder.encode(registerDTO.getPassword()))
                .name(registerDTO.getName())
                .role(Role.valueOf("FREELANCER")) // Default role
                .build();

        // Save user to database
        userRepository.save(user);
        log.info("User registered successfully: {}", registerDTO.getEmail());

        return "User registered successfully";
    }

}
