package lk.ijse.aad.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReviewDTO {
    private Long id;
    private int rating;
    private String comment;
    private Long clientId;
    private String clientName;
    private Long freelancerId;
    private String freelancerName;
    private Long taskId;
    private String taskTitle;
}
