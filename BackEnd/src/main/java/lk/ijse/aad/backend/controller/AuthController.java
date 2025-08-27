package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.AuthDTO;
import lk.ijse.aad.backend.dto.RegisterDTO;
import lk.ijse.aad.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {

    private final AuthService authService;

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

}
