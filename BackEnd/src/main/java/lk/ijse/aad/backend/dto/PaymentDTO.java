package lk.ijse.aad.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentDTO {
    private Long id;
    private double amount;
    private LocalDate paymentDate;
    private String paymentStatus;
    private Long taskId;
    private String taskTitle;
    private Long clientId;
    private String clientName;
    private Long freelancerId;
    private String freelancerName;
}
