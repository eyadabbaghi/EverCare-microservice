package tn.esprit.user.messaging;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MedicalRecordEvent {

    private String eventType;
    private String recordId;
    private String patientId;
    private String patientEmail;
    private String bloodGroup;
    private String alzheimerStage;
    private LocalDateTime occurredAt;
}
