package com.yourteam.communicationservice.Controller;

import com.yourteam.communicationservice.client.UserServiceClient;
import com.yourteam.communicationservice.dto.UserDto;
import com.yourteam.communicationservice.entity.Message;
import com.yourteam.communicationservice.service.ContentFilterService;
import com.yourteam.communicationservice.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final ContentFilterService contentFilterService;
    private final UserServiceClient userServiceClient;

    @GetMapping("/forbidden-words")
    public ResponseEntity<List<String>> getForbiddenWords() {
        return ResponseEntity.ok(contentFilterService.getForbiddenWords());
    }

    @PostMapping("/{conversationId}")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long conversationId,
            @RequestParam String senderId,   // email de l'expéditeur
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile file) throws IOException {

        // Vérifier que l'expéditeur existe
        try {
            UserDto sender = userServiceClient.getUserByEmail(senderId);
            if (sender == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Utilisateur non autorisé.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Service utilisateur indisponible.");
        }

        Message message = new Message();
        message.setSenderId(senderId);
        message.setContent(content != null ? content : "");

        if (file != null && !file.isEmpty()) {
            // Gestion du fichier (upload)
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path path = Paths.get("uploads/" + fileName);
            Files.createDirectories(path.getParent());
            Files.write(path, file.getBytes());
            message.setFileUrl("/uploads/" + fileName);
            message.setFileType(file.getContentType());
            message.setContent("Fichier joint : " + file.getOriginalFilename());
        }

        return ResponseEntity.ok(messageService.sendMessage(conversationId, message));
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<List<Message>> getMessages(@PathVariable Long conversationId) {
        return ResponseEntity.ok(messageService.getMessagesByConversation(conversationId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Message> updateMessage(@PathVariable Long id, @RequestBody String newContent) {
        return ResponseEntity.ok(messageService.updateMessage(id, newContent));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        messageService.deleteMessage(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Message> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(messageService.markAsRead(id));
    }
}