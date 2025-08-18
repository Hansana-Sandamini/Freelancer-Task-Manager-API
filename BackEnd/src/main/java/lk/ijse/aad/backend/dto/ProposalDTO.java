package lk.ijse.aad.backend.dto;

import lk.ijse.aad.backend.entity.Task;
import lk.ijse.aad.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProposalDTO {
    private Long id;
    private String coverLetter;
    private double bidAmount;
    private LocalDateTime submittedAt;
    private String status;
    private User freelancer;
    private Task task;
}
