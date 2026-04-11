package com.example.medicalrecordservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class MedicalHistoryUpdateRequest {

    @NotBlank(message = "type is required")
    private String type;

    @NotNull(message = "date is required")
    private LocalDate date;

    @NotBlank(message = "description is required")
    private String description;
}
