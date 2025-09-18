package lk.ijse.aad.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TaskDTO {
    private Long id;
    private String title;
    private String description;
    private String status;  // OPEN, IN_PROGRESS, COMPLETED
    private LocalDate deadline;
    private Long clientId;
    private String taskCategoryName;
    private Long freelancerId;
    private String workUrl;
    private LocalDateTime createdAt;
}
