package everCare.appointments.dtos;

import lombok.Data;

@Data
public class UserDto {
    private String userId;
    private String name;
    private String email;
    private String role;
    private String phone;
    private boolean isVerified;
    private String profilePicture;
    private String dateOfBirth;
    private String emergencyContact;
    private Integer yearsExperience;
    private String specialization;
    private String medicalLicense;
    private String workplaceType;
    private String workplaceName;
    private String doctorEmail;
}