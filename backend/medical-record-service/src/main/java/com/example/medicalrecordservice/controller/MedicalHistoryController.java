package com.example.medicalrecordservice.controller;

import com.example.medicalrecordservice.dto.MedicalHistoryCreateRequest;
import com.example.medicalrecordservice.dto.MedicalHistoryUpdateRequest;
import com.example.medicalrecordservice.entity.MedicalHistory;
import com.example.medicalrecordservice.service.MedicalHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/medical-records/{recordId}/histories")
@RequiredArgsConstructor

public class MedicalHistoryController {

    private final MedicalHistoryService historyService;

    @PostMapping
    public ResponseEntity<MedicalHistory> add(@PathVariable String recordId,
                                              @Valid @RequestBody MedicalHistoryCreateRequest request) {
        return ResponseEntity.ok(historyService.addToRecord(recordId, toEntity(request)));
    }

    @GetMapping
    public ResponseEntity<List<MedicalHistory>> list(@PathVariable String recordId) {
        return ResponseEntity.ok(historyService.listByRecord(recordId));
    }

    @PutMapping("/{historyId}")
    public ResponseEntity<MedicalHistory> update(@PathVariable String recordId,
                                                 @PathVariable String historyId,
                                                 @Valid @RequestBody MedicalHistoryUpdateRequest request) {
        return ResponseEntity.ok(historyService.update(recordId, historyId, toEntity(request)));
    }

    @DeleteMapping("/{historyId}")
    public ResponseEntity<Void> delete(@PathVariable String recordId, @PathVariable String historyId) {
        historyService.delete(recordId, historyId);
        return ResponseEntity.noContent().build();
    }

    private MedicalHistory toEntity(MedicalHistoryCreateRequest request) {
        return MedicalHistory.builder()
                .type(normalize(request.getType()))
                .date(request.getDate())
                .description(request.getDescription().trim())
                .build();
    }

    private MedicalHistory toEntity(MedicalHistoryUpdateRequest request) {
        return MedicalHistory.builder()
                .type(normalize(request.getType()))
                .date(request.getDate())
                .description(request.getDescription().trim())
                .build();
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }
}
