package com.example.medicalrecordservice.service;

import com.example.medicalrecordservice.client.UserServiceGateway;
import com.example.medicalrecordservice.dto.MedicalRecordArchiveRequest;
import com.example.medicalrecordservice.dto.MedicalRecordCreateRequest;
import com.example.medicalrecordservice.dto.MedicalRecordUpdateRequest;
import com.example.medicalrecordservice.dto.UserSummaryDto;
import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.event.MedicalRecordEventPublisher;
import com.example.medicalrecordservice.exception.BadRequestException;
import com.example.medicalrecordservice.exception.ConflictException;
import com.example.medicalrecordservice.exception.NotFoundException;
import com.example.medicalrecordservice.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final UserServiceGateway userServiceGateway;
    private final MedicalRecordEventPublisher medicalRecordEventPublisher;

    public MedicalRecord create(MedicalRecordCreateRequest request) {
        String patientId = normalizeRequired(request.getPatientId(), "patientId is required");
        if (medicalRecordRepository.existsByPatientId(patientId)) {
            throw new ConflictException("MedicalRecord already exists for this patientId");
        }

        UserSummaryDto patient = userServiceGateway.getRequiredPatient(patientId);
        LocalDateTime now = LocalDateTime.now();

        MedicalRecord record = MedicalRecord.builder()
                .patientId(patientId)
                .bloodGroup(normalizeRequired(request.getBloodGroup(), "bloodGroup is required").toUpperCase(Locale.ROOT))
                .alzheimerStage(normalizeStage(request.getAlzheimerStage()))
                .archived(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        MedicalRecord savedRecord = medicalRecordRepository.save(record);
        medicalRecordEventPublisher.publishCreated(savedRecord, patient);
        return savedRecord;
    }

    public List<MedicalRecord> findAll() {
        return medicalRecordRepository.findAll();
    }

    public MedicalRecord findById(String id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("MedicalRecord not found"));
    }

    public MedicalRecord findByPatientId(String patientId) {
        return medicalRecordRepository.findByPatientId(patientId)
                .orElseThrow(() -> new NotFoundException("MedicalRecord not found"));
    }

    public MedicalRecord update(String id, MedicalRecordUpdateRequest request) {
        MedicalRecord existing = findById(id);
        ensureRecordIsActive(existing);

        existing.setBloodGroup(normalizeRequired(request.getBloodGroup(), "bloodGroup is required").toUpperCase(Locale.ROOT));
        existing.setAlzheimerStage(normalizeStage(request.getAlzheimerStage()));
        existing.setUpdatedAt(LocalDateTime.now());

        MedicalRecord savedRecord = medicalRecordRepository.save(existing);
        medicalRecordEventPublisher.publishUpdated(savedRecord);
        return savedRecord;
    }

    public MedicalRecord archive(String id, MedicalRecordArchiveRequest request) {
        MedicalRecord existing = findById(id);
        if (existing.isArchived()) {
            throw new BadRequestException("MedicalRecord is already archived");
        }

        existing.setArchived(true);
        existing.setArchivedAt(LocalDateTime.now());
        existing.setArchivedBy(normalizeOptional(request != null ? request.getArchivedBy() : null));
        existing.setArchiveReason(normalizeOptional(request != null ? request.getArchiveReason() : null));
        existing.setUpdatedAt(LocalDateTime.now());

        MedicalRecord savedRecord = medicalRecordRepository.save(existing);
        medicalRecordEventPublisher.publishArchived(savedRecord);
        return savedRecord;
    }

    public MedicalRecord restore(String id) {
        MedicalRecord existing = findById(id);
        if (!existing.isArchived()) {
            throw new BadRequestException("MedicalRecord is not archived");
        }

        existing.setArchived(false);
        existing.setArchivedAt(null);
        existing.setArchivedBy(null);
        existing.setArchiveReason(null);
        existing.setUpdatedAt(LocalDateTime.now());

        MedicalRecord savedRecord = medicalRecordRepository.save(existing);
        medicalRecordEventPublisher.publishRestored(savedRecord);
        return savedRecord;
    }

    public void delete(String id) {
        MedicalRecord existing = findById(id);
        medicalRecordRepository.delete(existing);
        medicalRecordEventPublisher.publishDeleted(existing);
    }

    private void ensureRecordIsActive(MedicalRecord record) {
        if (record.isArchived()) {
            throw new BadRequestException("MedicalRecord is archived; restore it before updating it");
        }
    }

    private String normalizeStage(String value) {
        return normalizeRequired(value, "alzheimerStage is required").toUpperCase(Locale.ROOT);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
