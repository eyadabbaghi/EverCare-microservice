package com.example.medicalrecordservice.controller;

import com.example.medicalrecordservice.dto.MedicalDocumentCreateRequest;
import com.example.medicalrecordservice.dto.MedicalDocumentUpdateRequest;
import com.example.medicalrecordservice.entity.MedicalDocument;
import com.example.medicalrecordservice.service.MedicalDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/medical-records/{recordId}/documents")
@RequiredArgsConstructor

public class MedicalDocumentController {

    private final MedicalDocumentService documentService;

    @PostMapping
    public ResponseEntity<MedicalDocument> add(@PathVariable String recordId,
                                               @Valid @RequestBody MedicalDocumentCreateRequest request) {
        return ResponseEntity.ok(documentService.addToRecord(recordId, toEntity(request)));
    }

    @GetMapping
    public ResponseEntity<List<MedicalDocument>> list(@PathVariable String recordId) {
        return ResponseEntity.ok(documentService.listByRecord(recordId));
    }

    @PutMapping("/{documentId}")
    public ResponseEntity<MedicalDocument> update(@PathVariable String recordId,
                                                  @PathVariable String documentId,
                                                  @Valid @RequestBody MedicalDocumentUpdateRequest request) {
        return ResponseEntity.ok(documentService.update(recordId, documentId, toEntity(request)));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> delete(@PathVariable String recordId, @PathVariable String documentId) {
        documentService.delete(recordId, documentId);
        return ResponseEntity.noContent().build();
    }

    private MedicalDocument toEntity(MedicalDocumentCreateRequest request) {
        return MedicalDocument.builder()
                .fileName(request.getFileName().trim())
                .fileType(normalizeFileType(request.getFileType()))
                .filePath(request.getFilePath().trim())
                .build();
    }

    private MedicalDocument toEntity(MedicalDocumentUpdateRequest request) {
        return MedicalDocument.builder()
                .fileName(request.getFileName().trim())
                .fileType(normalizeFileType(request.getFileType()))
                .filePath(request.getFilePath().trim())
                .build();
    }

    private String normalizeFileType(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}
