package lk.ijse.aad.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResetPasswordRequest {

    @NotBlank
    private String email;

    @NotBlank
    private String code;

    @NotBlank
    @Size(min = 8, max = 120)
    private String newPassword;
}
