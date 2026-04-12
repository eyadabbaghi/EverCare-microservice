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

@RestController
@RequestMapping("/api/medical-records/{recordId}/documents")
@RequiredArgsConstructor

public class MedicalDocumentController {

    private final MedicalDocumentService documentService;

    @PostMapping
    public ResponseEntity<MedicalDocument> add(@PathVariable String recordId,
                                               @Valid @RequestBody MedicalDocumentCreateRequest request) {
        return ResponseEntity.ok(documentService.addToRecord(recordId, request));
    }

    @GetMapping
    public ResponseEntity<List<MedicalDocument>> list(@PathVariable String recordId) {
        return ResponseEntity.ok(documentService.listByRecord(recordId));
    }

    @PutMapping("/{documentId}")
    public ResponseEntity<MedicalDocument> update(@PathVariable String recordId,
                                                  @PathVariable String documentId,
                                                  @Valid @RequestBody MedicalDocumentUpdateRequest request) {
        return ResponseEntity.ok(documentService.update(recordId, documentId, request));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> delete(@PathVariable String recordId, @PathVariable String documentId) {
        documentService.delete(recordId, documentId);
        return ResponseEntity.noContent().build();
    }
}
