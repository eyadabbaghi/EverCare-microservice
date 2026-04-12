package com.example.medicalrecordservice.service;

import com.example.medicalrecordservice.entity.MedicalHistory;
import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.exception.BadRequestException;
import com.example.medicalrecordservice.exception.NotFoundException;
import com.example.medicalrecordservice.repository.MedicalHistoryRepository;
import com.example.medicalrecordservice.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MedicalHistoryService {

    private final MedicalHistoryRepository historyRepository;
    private final MedicalRecordRepository recordRepository;

	public MedicalHistory addToRecord(String recordId, MedicalHistory history) {
		MedicalRecord record = getRequiredRecord(recordId);
		ensureRecordIsActive(record);
		validateHistory(history);
		history.setMedicalRecord(record);
		history.setType(normalizeType(history.getType()));
		return historyRepository.save(history);
	}

	public List<MedicalHistory> listByRecord(String recordId) {
		getRequiredRecord(recordId);
		return historyRepository.findByMedicalRecordId(recordId);
	}

	public MedicalHistory update(String recordId, String historyId, MedicalHistory updatedHistory) {
		MedicalRecord record = getRequiredRecord(recordId);
		ensureRecordIsActive(record);
		MedicalHistory existing = getRequiredHistory(recordId, historyId);
		validateHistory(updatedHistory);

		existing.setMedicalRecord(record);
		existing.setType(normalizeType(updatedHistory.getType()));
		existing.setDate(updatedHistory.getDate());
		existing.setDescription(updatedHistory.getDescription().trim());

		return historyRepository.save(existing);
	}

	public void delete(String recordId, String historyId) {
		MedicalRecord record = getRequiredRecord(recordId);
		ensureRecordIsActive(record);
		getRequiredHistory(recordId, historyId);
		historyRepository.deleteById(historyId);
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

    private void validateHistory(MedicalHistory history) {
        if (history.getType() == null || history.getType().isBlank()) {
            throw new BadRequestException("type is required");
        }

        if (history.getDate() == null) {
            throw new BadRequestException("date is required");
        }

        if (history.getDate().isAfter(LocalDate.now())) {
            throw new BadRequestException("date cannot be in the future");
        }

        if (history.getDescription() == null || history.getDescription().isBlank()) {
            throw new BadRequestException("description is required");
        }
    }

    private String normalizeType(String type) {
        return type.trim().toUpperCase(Locale.ROOT);
    }

    private void ensureRecordIsActive(MedicalRecord record) {
        if (record.isArchived()) {
            throw new BadRequestException("Medical record is archived; history changes are blocked");
        }
    }
}
