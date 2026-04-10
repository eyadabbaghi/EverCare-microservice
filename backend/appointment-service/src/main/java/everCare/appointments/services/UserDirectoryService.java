package everCare.appointments.services;

import everCare.appointments.client.UserServiceClient;
import everCare.appointments.dtos.UserDto;
import everCare.appointments.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDirectoryService {

    private final UserServiceClient userServiceClient;

    public UserDto getRequiredPatient(String userId) {
        return getRequiredUserWithRole(userId, "PATIENT");
    }

    public UserDto getRequiredDoctor(String userId) {
        return getRequiredUserWithRole(userId, "DOCTOR");
    }

    public UserDto getOptionalCaregiver(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }
        return getRequiredUserWithRole(userId, "CAREGIVER");
    }

    public UserDto getRequiredUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResourceNotFoundException("User ID is required");
        }

        UserDto user = userServiceClient.getUserById(userId);
        if (user == null) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        return user;
    }

    private UserDto getRequiredUserWithRole(String userId, String expectedRole) {
        UserDto user = getRequiredUser(userId);
        if (user.getRole() == null || !expectedRole.equalsIgnoreCase(user.getRole())) {
            throw new ResourceNotFoundException("User " + userId + " is not a " + expectedRole);
        }
        return user;
    }
}
