package lk.ijse.aad.backend.service;

import lk.ijse.aad.backend.dto.UserDTO;

import java.util.List;

public interface UserService {
    List<UserDTO> getAllUsers();
    void updateUser(UserDTO userDTO);
    void deleteUser(Long id);
    List<UserDTO> getFreelancers();
    UserDTO getUserById(Long id);
    UserDTO getFreelancerById(Long id);
}
