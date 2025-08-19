package lk.ijse.aad.backend.dto;

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
    private Long freelancerId;
    private String freelancerName;
    private Long taskId;
    private String taskTitle;
}
