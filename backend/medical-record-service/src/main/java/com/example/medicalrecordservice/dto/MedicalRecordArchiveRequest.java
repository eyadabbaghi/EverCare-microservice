package com.example.medicalrecordservice.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MedicalRecordArchiveRequest {

    private String archivedBy;
    private String archiveReason;
}
