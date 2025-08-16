package lk.ijse.aad.backend.service;

import lk.ijse.aad.backend.dto.AuthDTO;
import lk.ijse.aad.backend.dto.AuthResponseDTO;
import lk.ijse.aad.backend.dto.RegisterDTO;

public interface UserService {
    AuthResponseDTO authenticate(AuthDTO authDTO);
    String register(RegisterDTO registerDTO);
}
