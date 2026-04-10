package everCare.appointments.client;

import everCare.appointments.dtos.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

// Feign client to call NestJS user-node-service
// URL includes context path /EverCare
@FeignClient(name = "user-node-service", url = "http://localhost:8096/EverCare")
public interface UserServiceClient {

    // Get user by ID from NestJS service
    @GetMapping("/users/external/{userId}")
    UserDto getUserById(@PathVariable("userId") String userId);

    // Get user by email from NestJS service
    @GetMapping("/users/external/email/{email}")
    UserDto getUserByEmail(@PathVariable("email") String email);

    // Get users by role from NestJS service
    @GetMapping("/users/external/role/{role}")
    List<UserDto> getUsersByRole(@PathVariable("role") String role);
}