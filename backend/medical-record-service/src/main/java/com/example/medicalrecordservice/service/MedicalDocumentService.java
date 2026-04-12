package com.example.medicalrecordservice.service;

import com.example.medicalrecordservice.entity.MedicalDocument;
import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.exception.BadRequestException;
import com.example.medicalrecordservice.exception.NotFoundException;
import com.example.medicalrecordservice.repository.MedicalDocumentRepository;
import com.example.medicalrecordservice.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MedicalDocumentService {

	private final MedicalDocumentRepository documentRepository;
	private final MedicalRecordRepository recordRepository;

	public MedicalDocument addToRecord(String recordId, MedicalDocument doc) {
		MedicalRecord record = getRequiredRecord(recordId);
		ensureRecordIsActive(record);
		validateDocument(doc);
		doc.setMedicalRecord(record);
		doc.setFileName(doc.getFileName().trim());
		doc.setFileType(normalizeFileType(doc.getFileType()));
		doc.setFilePath(doc.getFilePath().trim());
		return documentRepository.save(doc);
	}

	public List<MedicalDocument> listByRecord(String recordId) {
		getRequiredRecord(recordId);
		return documentRepository.findByMedicalRecordId(recordId);
	}

	public MedicalDocument update(String recordId, String documentId, MedicalDocument updatedDocument) {
		MedicalRecord record = getRequiredRecord(recordId);
		ensureRecordIsActive(record);
		MedicalDocument existing = getRequiredDocument(recordId, documentId);
		validateDocument(updatedDocument);

		existing.setMedicalRecord(record);
		existing.setFileName(updatedDocument.getFileName().trim());
		existing.setFileType(normalizeFileType(updatedDocument.getFileType()));
		existing.setFilePath(updatedDocument.getFilePath().trim());

		return documentRepository.save(existing);
	}

	public void delete(String recordId, String documentId) {
		MedicalRecord record = getRequiredRecord(recordId);
		ensureRecordIsActive(record);
		getRequiredDocument(recordId, documentId);
		documentRepository.deleteById(documentId);
	}

    private MedicalRecord getRequiredRecord(String recordId) {
        return recordRepository.findById(recordId)
                .orElseThrow(() -> new NotFoundException("MedicalRecord not found"));
    }

    private MedicalDocument getRequiredDocument(String recordId, String documentId) {
        MedicalDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new NotFoundException("MedicalDocument not found"));

        if (document.getMedicalRecord() == null || !recordId.equals(document.getMedicalRecord().getId())) {
            throw new BadRequestException("MedicalDocument does not belong to the provided medical record");
        }

        return document;
    }

    private void validateDocument(MedicalDocument document) {
        if (document.getFileName() == null || document.getFileName().isBlank()) {
            throw new BadRequestException("fileName is required");
        }

        if (document.getFileType() == null || document.getFileType().isBlank()) {
            throw new BadRequestException("fileType is required");
        }

        if (document.getFilePath() == null || document.getFilePath().isBlank()) {
            throw new BadRequestException("filePath is required");
        }
    }

    private String normalizeFileType(String fileType) {
        return fileType.trim().toLowerCase(Locale.ROOT);
    }

    private void ensureRecordIsActive(MedicalRecord record) {
        if (record.isArchived()) {
            throw new BadRequestException("Medical record is archived; document changes are blocked");
        }
    }
}
