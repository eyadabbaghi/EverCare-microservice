package com.example.medicalrecordservice.event;

import com.example.medicalrecordservice.config.RabbitMqProperties;
import com.example.medicalrecordservice.dto.UserSummaryDto;
import com.example.medicalrecordservice.entity.MedicalRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalRecordEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final RabbitMqProperties rabbitMqProperties;
    private final SimpMessagingTemplate messagingTemplate;

    public void publishCreated(MedicalRecord record, UserSummaryDto patient) {
        publish(
                "MEDICAL_RECORD_CREATED",
                record,
                patient != null ? patient.getEmail() : null
        );
    }

    public void publishUpdated(MedicalRecord record) {
        publish("MEDICAL_RECORD_UPDATED", record, null);
    }

    public void publishDeleted(MedicalRecord record) {
        publish("MEDICAL_RECORD_DELETED", record, null);
    }

    public void publishArchived(MedicalRecord record) {
        publish("MEDICAL_RECORD_ARCHIVED", record, null);
    }

    public void publishRestored(MedicalRecord record) {
        publish("MEDICAL_RECORD_RESTORED", record, null);
    }

    private void publish(String eventType, MedicalRecord record, String patientEmail) {
        MedicalRecordEvent event = MedicalRecordEvent.builder()
                .eventType(eventType)
                .recordId(record.getId())
                .patientId(record.getPatientId())
                .patientEmail(patientEmail)
                .bloodGroup(record.getBloodGroup())
                .alzheimerStage(record.getAlzheimerStage())
                .archived(record.isArchived())
                .archiveReason(record.getArchiveReason())
                .occurredAt(LocalDateTime.now())
                .build();

        try {
            rabbitTemplate.convertAndSend(
                    rabbitMqProperties.exchange(),
                    rabbitMqProperties.routingKey(),
                    event
            );
        } catch (Exception ex) {
            log.warn("Unable to publish medical record event {} for patientId {}", eventType, record.getPatientId(), ex);
        }

        try {
            messagingTemplate.convertAndSend("/topic/medical-records", event);
            messagingTemplate.convertAndSend("/topic/medical-records/" + record.getPatientId(), event);
        } catch (Exception ex) {
            log.warn("Unable to push WebSocket medical record event {} for patientId {}", eventType, record.getPatientId(), ex);
        }
    }
}
