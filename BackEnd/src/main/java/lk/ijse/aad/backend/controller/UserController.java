package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.UserDTO;
import lk.ijse.aad.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@CrossOrigin
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Users Retrieved Successfully",
                users
        ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        userDTO.setId(String.valueOf(id));
        userService.updateUser(userDTO);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "User Updated Successfully",
                null
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "User Deleted Successfully",
                null
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getUserById(@PathVariable Long id) {
        List<UserDTO> users = userService.getAllUsers();
        UserDTO user = users.stream()
                .filter(u -> u.getId().equals(String.valueOf(id)))
                .findFirst()
                .orElse(null);

        return ResponseEntity.ok(new ApiResponse(
                200,
                user != null ? "User Retrieved Successfully" : "User Not Found",
                user
        ));
    }

    @GetMapping("/freelancers")
    @PreAuthorize("hasAnyRole('CLIENT')")
    public ResponseEntity<ApiResponse> getAllFreelancers() {
        List<UserDTO> freelancers = userService.getFreelancers();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Freelancers Retrieved Successfully",
                freelancers
        ));
    }

    @GetMapping("/freelancers/{id}")
    @PreAuthorize("hasAnyRole('CLIENT')")
    public ResponseEntity<ApiResponse> getFreelancerById(@PathVariable Long id) {
        try {
            UserDTO freelancer = userService.getFreelancerById(id);
            return ResponseEntity.ok(new ApiResponse(
                    200,
                    "Freelancer retrieved successfully",
                    freelancer
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404)
                    .body(new ApiResponse(404, e.getMessage(), null));
        }
    }

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()") // Ensure only authenticated users can access
    public ResponseEntity<ApiResponse> getCurrentUserProfile() {
        UserDTO user = userService.getCurrentUserProfile();
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Profile Retrieved Successfully",
                user
        ));
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse> updateCurrentUserProfile(@RequestBody UserDTO userDTO) {
        UserDTO currentUser = userService.getCurrentUserProfile();
        userDTO.setId(currentUser.getId());
        userService.updateUser(userDTO);

        return ResponseEntity.ok(new ApiResponse(
                200,
                "Profile updated successfully",
                null
        ));
    }

}
