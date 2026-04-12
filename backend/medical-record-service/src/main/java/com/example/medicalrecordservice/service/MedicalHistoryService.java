package com.example.medicalrecordservice.service;

import com.example.medicalrecordservice.dto.MedicalHistoryCreateRequest;
import com.example.medicalrecordservice.dto.MedicalHistoryUpdateRequest;
import com.example.medicalrecordservice.entity.MedicalHistory;
import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.event.MedicalRecordEventPublisher;
import com.example.medicalrecordservice.exception.BadRequestException;
import com.example.medicalrecordservice.exception.NotFoundException;
import com.example.medicalrecordservice.repository.MedicalHistoryRepository;
import com.example.medicalrecordservice.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MedicalHistoryService {

    private final MedicalHistoryRepository historyRepository;
    private final MedicalRecordRepository recordRepository;
    private final MedicalRecordEventPublisher medicalRecordEventPublisher;

    public MedicalHistory addToRecord(String recordId, MedicalHistoryCreateRequest request) {
        MedicalRecord record = getRequiredRecord(recordId);
        ensureRecordIsActive(record);

        MedicalHistory history = MedicalHistory.builder()
                .type(normalizeText(request.getType()))
                .date(request.getDate())
                .description(normalizeText(request.getDescription()))
                .medicalRecord(record)
                .build();

        history.setMedicalRecord(record);
        MedicalHistory savedHistory = historyRepository.save(history);
        medicalRecordEventPublisher.publishUpdated(record);
        return savedHistory;
    }

    public List<MedicalHistory> listByRecord(String recordId) {
        getRequiredRecord(recordId);
        return historyRepository.findByMedicalRecordId(recordId);
    }

    public MedicalHistory update(String recordId, String historyId, MedicalHistoryUpdateRequest request) {
        MedicalRecord record = getRequiredRecord(recordId);
        ensureRecordIsActive(record);
        MedicalHistory existing = getRequiredHistory(recordId, historyId);

        existing.setType(normalizeText(request.getType()));
        existing.setDate(request.getDate());
        existing.setDescription(normalizeText(request.getDescription()));

        MedicalHistory savedHistory = historyRepository.save(existing);
        medicalRecordEventPublisher.publishUpdated(record);
        return savedHistory;
    }

    public void delete(String recordId, String historyId) {
        MedicalRecord record = getRequiredRecord(recordId);
        ensureRecordIsActive(record);
        MedicalHistory history = getRequiredHistory(recordId, historyId);
        historyRepository.delete(history);
        medicalRecordEventPublisher.publishUpdated(record);
    }

    private MedicalRecord getRequiredRecord(String recordId) {
        return recordRepository.findById(recordId)
                .orElseThrow(() -> new NotFoundException("MedicalRecord not found"));
    }

    private MedicalHistory getRequiredHistory(String recordId, String historyId) {
        MedicalHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new NotFoundException("MedicalHistory not found"));

        if (history.getMedicalRecord() == null || !recordId.equals(history.getMedicalRecord().getId())) {
            throw new BadRequestException("MedicalHistory does not belong to the provided medical record");
        }
        return history;
    }

    private void ensureRecordIsActive(MedicalRecord record) {
        if (record.isArchived()) {
            throw new BadRequestException("Medical record is archived; history changes are blocked");
        }
    }

    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("History values must not be empty");
        }
        return value.trim().toUpperCase(Locale.ROOT).equals(value.trim())
                ? value.trim()
                : value.trim();
    }
}
