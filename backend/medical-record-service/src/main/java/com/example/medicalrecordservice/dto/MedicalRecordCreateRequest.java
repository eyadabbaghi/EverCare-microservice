package com.example.medicalrecordservice.dto;

import com.example.medicalrecordservice.validation.MedicalRecordValidationRules;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MedicalRecordCreateRequest {

    @NotBlank(message = "patientId is required")
    @Size(max = 100, message = "patientId must not exceed 100 characters")
    private String patientId;

    @NotBlank(message = "bloodGroup is required")
    @Pattern(
            regexp = MedicalRecordValidationRules.BLOOD_GROUP_PATTERN,
            message = MedicalRecordValidationRules.BLOOD_GROUP_MESSAGE
    )
    private String bloodGroup;

    @NotBlank(message = "alzheimerStage is required")
    @Pattern(
            regexp = MedicalRecordValidationRules.ALZHEIMER_STAGE_PATTERN,
            message = MedicalRecordValidationRules.ALZHEIMER_STAGE_MESSAGE
    )
    private String alzheimerStage;
}
