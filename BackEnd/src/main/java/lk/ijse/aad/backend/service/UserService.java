package lk.ijse.aad.backend.service;

import lk.ijse.aad.backend.dto.UserDTO;
import lk.ijse.aad.backend.entity.User;

import java.util.List;

public interface UserService {
    List<UserDTO> getAllUsers();
    void updateUser(UserDTO userDTO);
    void deleteUser(Long id);
    List<UserDTO> getFreelancers();
    UserDTO getUserById(Long id);
    UserDTO getFreelancerById(Long id);
    UserDTO getCurrentUserProfile();
    User findByEmailAndVerificationCode(String email, String code);
    void updatePassword(User user, String newPassword);
    User findByEmail(String email);
    boolean existsByEmail(String email);
}
