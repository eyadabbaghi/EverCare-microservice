package com.example.medicalrecordservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordEvent {

    private String eventType;
    private String recordId;
    private String patientId;
    private String patientEmail;
    private String bloodGroup;
    private String alzheimerStage;
    private LocalDateTime occurredAt;
}
