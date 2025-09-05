package lk.ijse.aad.backend.controller;

import lk.ijse.aad.backend.dto.ApiResponse;
import lk.ijse.aad.backend.dto.ChatMessageDTO;
import lk.ijse.aad.backend.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@CrossOrigin
public class ChatController {

    private final ChatMessageService chatMessageService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENT','FREELANCER')")
    public ResponseEntity<ApiResponse> sendMessage(@RequestBody ChatMessageDTO chatMessageDTO) {
        chatMessageService.sendMessage(chatMessageDTO);
        return ResponseEntity.ok(new ApiResponse(
                201,
                "Message Sent Successfully",
                null
        ));
    }

    @GetMapping("/task/{taskId}")
    @PreAuthorize("hasAnyRole('CLIENT','FREELANCER','ADMIN')")
    public ResponseEntity<ApiResponse> getMessagesByTask(@PathVariable Long taskId) {
        List<ChatMessageDTO> messages = chatMessageService.getMessagesByTaskId(taskId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Messages Retrieved Successfully",
                messages
        ));
    }

    @GetMapping("/conversation")
    @PreAuthorize("hasAnyRole('CLIENT','FREELANCER','ADMIN')")
    public ResponseEntity<ApiResponse> getConversation(
            @RequestParam Long senderId,
            @RequestParam Long receiverId) {
        List<ChatMessageDTO> messages = chatMessageService.getConversation(senderId, receiverId);
        return ResponseEntity.ok(new ApiResponse(
                200,
                "Conversation Retrieved Successfully",
                messages
        ));
    }

}
