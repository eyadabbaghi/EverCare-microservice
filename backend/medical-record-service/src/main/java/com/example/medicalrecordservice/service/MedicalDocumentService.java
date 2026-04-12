package com.example.medicalrecordservice.service;

import com.example.medicalrecordservice.dto.MedicalDocumentCreateRequest;
import com.example.medicalrecordservice.dto.MedicalDocumentUpdateRequest;
import com.example.medicalrecordservice.entity.MedicalDocument;
import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.event.MedicalRecordEventPublisher;
import com.example.medicalrecordservice.exception.BadRequestException;
import com.example.medicalrecordservice.exception.NotFoundException;
import com.example.medicalrecordservice.repository.MedicalDocumentRepository;
import com.example.medicalrecordservice.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalDocumentService {

    private final MedicalDocumentRepository documentRepository;
    private final MedicalRecordRepository recordRepository;
    private final MedicalRecordEventPublisher medicalRecordEventPublisher;

    public MedicalDocument addToRecord(String recordId, MedicalDocumentCreateRequest request) {
        MedicalRecord record = getRequiredRecord(recordId);
        ensureRecordIsActive(record);

        MedicalDocument doc = MedicalDocument.builder()
                .fileName(normalizeText(request.getFileName(), "fileName is required"))
                .fileType(normalizeText(request.getFileType(), "fileType is required").toLowerCase())
                .filePath(normalizeText(request.getFilePath(), "filePath is required"))
                .medicalRecord(record)
                .build();

        doc.setMedicalRecord(record);
        MedicalDocument savedDocument = documentRepository.save(doc);
        medicalRecordEventPublisher.publishUpdated(record);
        return savedDocument;
    }

    public List<MedicalDocument> listByRecord(String recordId) {
        getRequiredRecord(recordId);
        return documentRepository.findByMedicalRecordId(recordId);
    }

    public MedicalDocument update(String recordId, String documentId, MedicalDocumentUpdateRequest request) {
        MedicalRecord record = getRequiredRecord(recordId);
        ensureRecordIsActive(record);
        MedicalDocument existing = getRequiredDocument(recordId, documentId);

        existing.setFileName(normalizeText(request.getFileName(), "fileName is required"));
        existing.setFileType(normalizeText(request.getFileType(), "fileType is required").toLowerCase());
        existing.setFilePath(normalizeText(request.getFilePath(), "filePath is required"));

        MedicalDocument savedDocument = documentRepository.save(existing);
        medicalRecordEventPublisher.publishUpdated(record);
        return savedDocument;
    }

    public void delete(String recordId, String documentId) {
        MedicalRecord record = getRequiredRecord(recordId);
        ensureRecordIsActive(record);
        MedicalDocument document = getRequiredDocument(recordId, documentId);
        documentRepository.delete(document);
        medicalRecordEventPublisher.publishUpdated(record);
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

    private void ensureRecordIsActive(MedicalRecord record) {
        if (record.isArchived()) {
            throw new BadRequestException("Medical record is archived; document changes are blocked");
        }
    }

    private String normalizeText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
        return value.trim();
    }
}
