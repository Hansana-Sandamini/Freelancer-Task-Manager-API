package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.UserDTO;
import lk.ijse.aad.backend.entity.Role;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.repository.UserRepository;
import lk.ijse.aad.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;

    @Override
    public List<UserDTO> getAllUsers() {
        try {
            log.info("Fetching all users");
            return userRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error while fetching all users", e);
            throw new RuntimeException("Failed to fetch users: " + e.getMessage(), e);
        }
    }

    @Override
    public void updateUser(UserDTO userDTO) {
        try {
            Long id = Long.parseLong(userDTO.getId());
            User existingUser = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

            // Update fields
            existingUser.setName(userDTO.getName());
            existingUser.setEmail(userDTO.getEmail());

            // Update profile image if provided
            if (userDTO.getProfileImage() != null && !userDTO.getProfileImage().isEmpty()) {
                existingUser.setProfileImage(userDTO.getProfileImage());
            } else {
                existingUser.setProfileImage(null);
            }

            // Update role-specific fields
            existingUser.setBio(userDTO.getBio());
            existingUser.setCompany(userDTO.getCompany());
            existingUser.setSkills(userDTO.getSkills());

            if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
                existingUser.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            }
            if (userDTO.getRole() != null) {
                existingUser.setRole(Role.valueOf(userDTO.getRole()));
            }

            userRepository.save(existingUser);
            log.info("User updated successfully: {}", userDTO.getEmail());

        } catch (Exception e) {
            log.error("Error while updating user: {}", userDTO.getEmail(), e);
            throw new RuntimeException("Failed to update user: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteUser(Long id) {
        try {
            if (!userRepository.existsById(id)) {
                throw new RuntimeException("User not found with ID: " + id);
            }
            userRepository.deleteById(id);
            log.info("User deleted successfully: {}", id);

        } catch (Exception e) {
            log.error("Error while deleting user: {}", id, e);
            throw new RuntimeException("Failed to delete user: " + e.getMessage(), e);
        }
    }

    @Override
    public List<UserDTO> getFreelancers() {
        try {
            log.info("Fetching all freelancers");
            return userRepository.findAll().stream()
                    .filter(user -> user.getRole() == Role.FREELANCER)
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error while fetching freelancers", e);
            throw new RuntimeException("Failed to fetch freelancers: " + e.getMessage(), e);
        }
    }

    @Override
    public UserDTO getUserById(Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
            return convertToDTO(user);
        } catch (Exception e) {
            log.error("Error fetching user with ID: {}", id, e);
            throw new RuntimeException("Failed to fetch user: " + e.getMessage(), e);
        }
    }

    @Override
    public UserDTO getFreelancerById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Freelancer not found with ID: " + id));

        if (user.getRole() != Role.FREELANCER) {
            throw new RuntimeException("User is not a freelancer");
        }

        return convertToDTO(user);
    }

    @Override
    public UserDTO getCurrentUserProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = (User) userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return convertToDTO(user);
    }

    @Override
    public User findByEmailAndVerificationCode(String email, String code) {
        return userRepository.findByEmailAndVerificationCode(email, code)
                .orElseThrow(() -> new RuntimeException("Invalid verification code"));
    }

    @Override
    public void updatePassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setVerificationCode(null);
        user.setCodeExpiresAt(null);
        userRepository.save(user);
    }

    @Override
    public User findByEmail(String email) {
        return (User) userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    private UserDTO convertToDTO(User user) {
        try {
            UserDTO userDTO = modelMapper.map(user, UserDTO.class);
            userDTO.setId(String.valueOf(user.getId()));
            userDTO.setRole(user.getRole().name());
            userDTO.setBio(user.getBio());
            userDTO.setCompany(user.getCompany());
            userDTO.setSkills(user.getSkills());
            userDTO.setProfileImage(user.getProfileImage());
            return userDTO;
        } catch (Exception e) {
            log.error("Error while converting user to DTO: {}", user.getEmail(), e);
            throw new RuntimeException("Failed to convert user to DTO: " + e.getMessage(), e);
        }
    }

}
