package lk.ijse.aad.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long taskId;       // Chat belongs to a specific task

    private Long senderId;     // Who sent (client or freelancer)

    private Long receiverId;   // Who received

    private String message;

    private LocalDateTime timestamp;

}
