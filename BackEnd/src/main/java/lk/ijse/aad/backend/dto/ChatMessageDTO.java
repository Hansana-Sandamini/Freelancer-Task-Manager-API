package lk.ijse.aad.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessageDTO {
    private Long id;
    private Long taskId;
    private Long senderId;
    private Long receiverId;
    private String message;
    private LocalDateTime timestamp;
}
