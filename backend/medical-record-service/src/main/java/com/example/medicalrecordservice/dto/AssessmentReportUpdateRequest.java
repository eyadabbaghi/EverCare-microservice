package com.example.medicalrecordservice.dto;

import com.example.medicalrecordservice.validation.MedicalRecordValidationRules;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class AssessmentReportUpdateRequest {

    @NotBlank(message = "reportType is required")
    private String reportType;

    @NotNull(message = "score is required")
    @Min(value = 0, message = "score must be between 0 and 100")
    @Max(value = 100, message = "score must be between 0 and 100")
    private Integer score;

    @NotBlank(message = "stage is required")
    @Pattern(
            regexp = MedicalRecordValidationRules.ALZHEIMER_STAGE_PATTERN,
            message = MedicalRecordValidationRules.ALZHEIMER_STAGE_MESSAGE
    )
    private String stage;

    @NotBlank(message = "recommendation is required")
    private String recommendation;

    @NotBlank(message = "summary is required")
    private String summary;

    private String author;

    @NotNull(message = "assessmentDate is required")
    private LocalDate assessmentDate;
}
