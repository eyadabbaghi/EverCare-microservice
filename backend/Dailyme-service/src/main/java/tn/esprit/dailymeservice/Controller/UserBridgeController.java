package tn.esprit.dailymeservice.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.dailymeservice.Dto.UserServiceUserDto;
import tn.esprit.dailymeservice.Service.UserServiceBridge;

@RestController
@RequestMapping({"/api/daily-entries/users", "/dailyme/api/daily-entries/users"})
@RequiredArgsConstructor
public class UserBridgeController {

    private final UserServiceBridge userServiceBridge;

    @GetMapping("/by-email")
    public ResponseEntity<UserServiceUserDto> getUserByEmail(
            @RequestParam String email,
            @RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
    ) {
        return ResponseEntity.ok(userServiceBridge.getUserByEmail(email, authorizationHeader));
    }
}
