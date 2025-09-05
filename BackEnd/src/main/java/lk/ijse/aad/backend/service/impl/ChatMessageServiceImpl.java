package lk.ijse.aad.backend.service.impl;

import lk.ijse.aad.backend.dto.ChatMessageDTO;
import lk.ijse.aad.backend.entity.ChatMessage;
import lk.ijse.aad.backend.repository.ChatMessageRepository;
import lk.ijse.aad.backend.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatMessageServiceImpl implements ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ModelMapper modelMapper;

    @Override
    public void sendMessage(ChatMessageDTO dto) {
        try {
            ChatMessage message = modelMapper.map(dto, ChatMessage.class);
            message.setTimestamp(LocalDateTime.now());

            chatMessageRepository.save(message);
            log.info("Message sent successfully from {} to {} for Task {}",
                    dto.getSenderId(), dto.getReceiverId(), dto.getTaskId());

        } catch (Exception e) {
            log.error("Error while sending message: {}", dto, e);
            throw new RuntimeException("Failed to send message: " + e.getMessage(), e);
        }
    }

    @Override
    public List<ChatMessageDTO> getMessagesByTaskId(Long taskId) {
        try {
            List<ChatMessage> messages = chatMessageRepository.findByTaskIdOrderByTimestampAsc(taskId);

            log.info("Retrieved {} messages for Task {}", messages.size(), taskId);

            return messages.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error while retrieving messages for Task {}", taskId, e);
            throw new RuntimeException("Failed to retrieve messages: " + e.getMessage(), e);
        }
    }

    @Override
    public List<ChatMessageDTO> getConversation(Long senderId, Long receiverId) {
        try {
            List<ChatMessage> messages = chatMessageRepository.findConversation(senderId, receiverId);

            log.info("Retrieved {} messages between users {} and {}",
                    messages.size(), senderId, receiverId);

            return messages.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error while retrieving conversation between {} and {}", senderId, receiverId, e);
            throw new RuntimeException("Failed to retrieve conversation: " + e.getMessage(), e);
        }
    }

    private ChatMessageDTO convertToDTO(ChatMessage msg) {
        return modelMapper.map(msg, ChatMessageDTO.class);
    }

}
