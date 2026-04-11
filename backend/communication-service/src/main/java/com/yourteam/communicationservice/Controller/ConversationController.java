package com.yourteam.communicationservice.Controller;

import com.yourteam.communicationservice.client.UserServiceClient;
import com.yourteam.communicationservice.dto.UserDto;
import com.yourteam.communicationservice.entity.Conversation;
import com.yourteam.communicationservice.service.conversationservice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final conversationservice conversationService;
    private final UserServiceClient userServiceClient;

    // Créer une conversation avec user1Id et user2Id = emails
    @PostMapping
    public ResponseEntity<?> createConversation(@RequestBody Conversation conversation) {
        // Vérifier que user2Id (email) existe dans User Service
        try {
            UserDto targetUser = userServiceClient.getUserByEmail(conversation.getUser2Id());
            if (targetUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("L'utilisateur destinataire n'existe pas.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Service utilisateur indisponible.");
        }
        // user1Id est l'email de l'expéditeur (envoyé par le front)
        return ResponseEntity.ok(conversationService.createConversation(conversation));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Conversation>> getConversationsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(conversationService.getConversationsByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Conversation> getConversationById(@PathVariable Long id) {
        return conversationService.getConversationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Conversation> toggleStatus(@PathVariable Long id, @RequestParam boolean active) {
        return ResponseEntity.ok(conversationService.toggleConversationStatus(id, active));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable Long id) {
        conversationService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }
}