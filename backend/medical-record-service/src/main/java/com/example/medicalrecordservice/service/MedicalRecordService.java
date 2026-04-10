package com.example.medicalrecordservice.service;

import com.example.medicalrecordservice.client.UserServiceGateway;
import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.event.MedicalRecordEventPublisher;
import com.example.medicalrecordservice.exception.BadRequestException;
import com.example.medicalrecordservice.exception.ConflictException;
import com.example.medicalrecordservice.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final UserServiceGateway userServiceGateway;
    private final MedicalRecordEventPublisher medicalRecordEventPublisher;

    public MedicalRecord create(MedicalRecord record) {
        if (record.getPatientId() == null || record.getPatientId().isBlank()) {
            throw new BadRequestException("patientId is required");
        }
        if (medicalRecordRepository.existsByPatientId(record.getPatientId())) {
            throw new ConflictException("MedicalRecord already exists for this patientId");
        }
        var patient = userServiceGateway.getRequiredPatient(record.getPatientId());
        MedicalRecord savedRecord = medicalRecordRepository.save(record);
        medicalRecordEventPublisher.publishCreated(savedRecord, patient);
        return savedRecord;
    }

    public List<MedicalRecord> findAll() {
        return medicalRecordRepository.findAll();
    }

    public MedicalRecord findById(String id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("MedicalRecord not found"));
    }

    public MedicalRecord findByPatientId(String patientId) {
        return medicalRecordRepository.findByPatientId(patientId)
                .orElseThrow(() -> new IllegalStateException("MedicalRecord not found"));
    }

    public MedicalRecord update(String id, MedicalRecord updated) {
        MedicalRecord existing = findById(id);
        existing.setBloodGroup(updated.getBloodGroup());
        existing.setAlzheimerStage(updated.getAlzheimerStage());
        MedicalRecord savedRecord = medicalRecordRepository.save(existing);
        medicalRecordEventPublisher.publishUpdated(savedRecord);
        return savedRecord;
    }

    public void delete(String id) {
        MedicalRecord existing = findById(id);
        medicalRecordRepository.deleteById(id);
        medicalRecordEventPublisher.publishDeleted(existing);
    }
}
