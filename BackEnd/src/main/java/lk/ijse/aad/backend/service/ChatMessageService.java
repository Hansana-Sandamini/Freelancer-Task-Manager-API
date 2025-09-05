package lk.ijse.aad.backend.service;

import lk.ijse.aad.backend.dto.ChatMessageDTO;

import java.util.List;

public interface ChatMessageService {
    void sendMessage(ChatMessageDTO dto);
    List<ChatMessageDTO> getMessagesByTaskId(Long taskId);
    List<ChatMessageDTO> getConversation(Long senderId, Long receiverId);
}
