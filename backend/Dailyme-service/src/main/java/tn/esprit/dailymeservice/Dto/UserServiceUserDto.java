package tn.esprit.dailymeservice.Dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class UserServiceUserDto {
    private String userId;
    private String name;
    private String email;
    private String role;
    private String phone;
    @JsonAlias({"verified", "isVerified"})
    private Boolean verified;
    private LocalDateTime createdAt;
    private LocalDate dateOfBirth;
    private String emergencyContact;
    private String profilePicture;
    private Integer yearsExperience;
    private String specialization;
    private String medicalLicense;
    private String workplaceType;
    private String workplaceName;
    private Set<String> caregiverEmails;
    private Set<String> patientEmails;
    private String doctorEmail;
}
