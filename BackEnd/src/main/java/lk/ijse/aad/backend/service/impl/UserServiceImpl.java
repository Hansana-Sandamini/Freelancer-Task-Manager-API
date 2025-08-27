package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.UserDTO;
import lk.ijse.aad.backend.entity.Role;
import lk.ijse.aad.backend.entity.User;
import lk.ijse.aad.backend.repository.UserRepository;
import lk.ijse.aad.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
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

    private UserDTO convertToDTO(User user) {
        try {
            UserDTO userDTO = modelMapper.map(user, UserDTO.class);
            userDTO.setId(String.valueOf(user.getId()));
            userDTO.setRole(user.getRole().name());
            return userDTO;
        } catch (Exception e) {
            log.error("Error while converting user to DTO: {}", user.getEmail(), e);
            throw new RuntimeException("Failed to convert user to DTO: " + e.getMessage(), e);
        }
    }

}
