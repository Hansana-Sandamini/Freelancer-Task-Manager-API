package lk.ijse.aad.backend.dto;

import lk.ijse.aad.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TaskDTO {
    private Long id;
    private String title;
    private String description;
    private String status;  // OPEN, IN_PROGRESS, COMPLETED
    private LocalDate deadline;
//    private User client;
    private Long clientId;
}
