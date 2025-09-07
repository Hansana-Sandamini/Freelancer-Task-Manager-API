package lk.ijse.aad.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private String id;
    private String name;
    private String email;
    private String password;
    private String role;
    private String bio;
    private String company;
    private String skills;
}
