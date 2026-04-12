package com.example.medicalrecordservice.service;

import com.example.medicalrecordservice.client.UserServiceGateway;
import com.example.medicalrecordservice.dto.MedicalRecordArchiveRequest;
import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.exception.BadRequestException;
import com.example.medicalrecordservice.exception.ConflictException;
import com.example.medicalrecordservice.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

	private final MedicalRecordRepository medicalRecordRepository;
	private final UserServiceGateway userServiceGateway;

	public MedicalRecord create(MedicalRecord record) {
		if (record.getPatientId() == null || record.getPatientId().isBlank()) {
			throw new BadRequestException("patientId is required");
		}
		if (medicalRecordRepository.existsByPatientId(record.getPatientId())) {
			throw new ConflictException("MedicalRecord already exists for this patientId");
		}
		userServiceGateway.getRequiredPatient(record.getPatientId());
		return medicalRecordRepository.save(record);
	}

    public MedicalRecord autoCreate(MedicalRecord record) {
        if (record.getPatientId() == null || record.getPatientId().isBlank()) {
            throw new BadRequestException("patientId is required");
        }

        return medicalRecordRepository.findByPatientId(record.getPatientId())
                .orElseGet(() -> create(record));
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
		ensureRecordIsActive(existing);
		existing.setBloodGroup(updated.getBloodGroup());
		existing.setAlzheimerStage(updated.getAlzheimerStage());
		return medicalRecordRepository.save(existing);
	}

	public MedicalRecord archive(String id, MedicalRecordArchiveRequest request) {
		MedicalRecord existing = findById(id);
		if (existing.isArchived()) {
			throw new ConflictException("Medical record is already archived");
		}

		existing.setArchived(true);
		existing.setArchivedAt(LocalDateTime.now());
		existing.setArchivedBy(request != null ? normalizeOptional(request.getArchivedBy()) : null);
		existing.setArchiveReason(request != null ? normalizeOptional(request.getArchiveReason()) : null);

		return medicalRecordRepository.save(existing);
	}

	public MedicalRecord restore(String id) {
		MedicalRecord existing = findById(id);
		if (!existing.isArchived()) {
			throw new ConflictException("Medical record is already active");
		}

		existing.setArchived(false);
		existing.setArchivedAt(null);
		existing.setArchivedBy(null);
		existing.setArchiveReason(null);

		return medicalRecordRepository.save(existing);
	}

	public void delete(String id) {
		MedicalRecord existing = findById(id);
		medicalRecordRepository.deleteById(id);
	}

    private void ensureRecordIsActive(MedicalRecord record) {
        if (record.isArchived()) {
            throw new BadRequestException("Medical record is archived; modification is not allowed");
        }
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
