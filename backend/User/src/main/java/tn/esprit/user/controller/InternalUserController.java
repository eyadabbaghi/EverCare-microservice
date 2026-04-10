package tn.esprit.user.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.user.dto.InternalUserDto;
import tn.esprit.user.entity.User;
import tn.esprit.user.service.UserService;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@RestController
@RequestMapping("/users/internal")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;

    @Value("${app.internal.api-key}")
    private String internalApiKey;

    @GetMapping("/{userId}")
    public ResponseEntity<InternalUserDto> getUserByIdForInternalUse(
            @PathVariable String userId,
            @RequestHeader(name = "X-Internal-Api-Key", required = false) String providedApiKey
    ) {
        if (!internalApiKey.equals(providedApiKey)) {
            throw new ResponseStatusException(FORBIDDEN, "Invalid internal API key");
        }

        User user = userService.findByUserId(userId);
        InternalUserDto dto = new InternalUserDto();
        dto.setUserId(user.getUserId());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setVerified(user.isVerified());
        return ResponseEntity.ok(dto);
    }
}
