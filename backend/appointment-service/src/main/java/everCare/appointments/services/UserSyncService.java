package everCare.appointments.services;

import everCare.appointments.client.UserServiceClient;
import everCare.appointments.dtos.UserDto;
import everCare.appointments.entities.User;
import everCare.appointments.entities.UserRole;
import everCare.appointments.exceptions.ResourceNotFoundException;
import everCare.appointments.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserSyncService {

    private final UserRepository userRepository;
    private final UserServiceClient userServiceClient;

    public User findByIdOrSync(String userId) {
        return userRepository.findById(userId)
                .orElseGet(() -> syncById(userId));
    }

    public User syncById(String userId) {
        UserDto userDto = userServiceClient.getUserById(userId);
        if (userDto == null) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }

        User user = userRepository.findById(userId).orElseGet(User::new);
        user.setUserId(userDto.getUserId());
        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());
        user.setPhone(userDto.getPhone());
        user.setVerified(userDto.isVerified());
        user.setProfilePicture(userDto.getProfilePicture());
        user.setDoctorEmail(userDto.getDoctorEmail());

        if (userDto.getRole() != null) {
            user.setRole(UserRole.valueOf(userDto.getRole()));
        }

        return userRepository.save(user);
    }

    public User findOptionalByIdOrSync(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }

        UserDto userDto = userServiceClient.getUserById(userId);
        if (userDto == null) {
            return null;
        }

        return syncById(userId);
    }
}
