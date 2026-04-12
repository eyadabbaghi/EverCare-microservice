package com.yourteam.communicationservice.client;

import com.yourteam.communicationservice.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "USER-SERVICE", url = "${user.service.url:http://localhost:8089/EverCare}", configuration = FeignConfig.class)
public interface UserServiceClient {

    // Récupérer un utilisateur par son email (public)
    @GetMapping("/users/by-email")
    UserDto getUserByEmail(@RequestParam("email") String email);

    // Récupérer un utilisateur par son userId (public)
    @GetMapping("/users/external/{userId}")
    UserDto getUserById(@PathVariable("userId") String userId);

    // Récupérer tous les utilisateurs (pour la liste déroulante)
    @GetMapping("/users/all")
    List<UserDto> getAllUsers();

    // Rechercher par rôle (public)
    @GetMapping("/users/external/role/{role}")
    List<UserDto> getUsersByRole(@PathVariable("role") String role);
}