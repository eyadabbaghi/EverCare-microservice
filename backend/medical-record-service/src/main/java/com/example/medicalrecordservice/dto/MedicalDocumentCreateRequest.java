package com.example.medicalrecordservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MedicalDocumentCreateRequest {

    @NotBlank(message = "fileName is required")
    private String fileName;

    @NotBlank(message = "fileType is required")
    private String fileType;

    @NotBlank(message = "filePath is required")
    private String filePath;
}
