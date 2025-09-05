package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ChatMessageDTO;
import lk.ijse.aad.backend.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatSocketController {

    private final ChatMessageService chatMessageService;

    @MessageMapping("/chat.sendMessage/{taskId}")
    @SendTo("/topic/messages.{taskId}")
    public ChatMessageDTO sendMessage(@DestinationVariable Long taskId, ChatMessageDTO chatMessageDTO, SimpMessageHeaderAccessor headerAccessor) {
        log.info("Received message: {}", chatMessageDTO);

        // Validate taskId
        if (taskId == null || !taskId.equals(chatMessageDTO.getTaskId())) {
            throw new IllegalArgumentException("Task ID mismatch between path and message");
        }

        // Validate sender and receiver
        if (chatMessageDTO.getSenderId() == null || chatMessageDTO.getReceiverId() == null) {
            throw new IllegalArgumentException("SenderId and ReceiverId are required");
        }

        try {
            // Save message to database
            chatMessageService.sendMessage(chatMessageDTO);

            // Add server timestamp
            chatMessageDTO.setTimestamp(java.time.LocalDateTime.now());

            log.info("Message sent successfully for taskId: {}", taskId);
            return chatMessageDTO;

        } catch (Exception e) {
            log.error("Error processing message: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send message: " + e.getMessage(), e);
        }
    }

    @MessageMapping("/chat.addUser/{taskId}")
    @SendTo("/topic/messages.{taskId}")
    public ChatMessageDTO addUser(@DestinationVariable Long taskId, ChatMessageDTO chatMessageDTO, SimpMessageHeaderAccessor headerAccessor) {
        log.info("User join request: {}", chatMessageDTO);

        if (taskId == null || !taskId.equals(chatMessageDTO.getTaskId())) {
            throw new IllegalArgumentException("Task ID mismatch between path and message");
        }

        headerAccessor.getSessionAttributes().put("username", chatMessageDTO.getSenderId());
        headerAccessor.getSessionAttributes().put("taskId", chatMessageDTO.getTaskId());

        chatMessageDTO.setMessage(chatMessageDTO.getSenderId() + " joined the chat!");
        chatMessageDTO.setTimestamp(java.time.LocalDateTime.now());

        return chatMessageDTO;
    }

}
