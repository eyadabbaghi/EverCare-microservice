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

@RestController
@RequestMapping("/api/medical-records/{recordId}/histories")
@RequiredArgsConstructor

public class MedicalHistoryController {

    private final MedicalHistoryService historyService;

    @PostMapping
    public ResponseEntity<MedicalHistory> add(@PathVariable String recordId,
                                              @Valid @RequestBody MedicalHistoryCreateRequest request) {
        return ResponseEntity.ok(historyService.addToRecord(recordId, request));
    }

    @GetMapping
    public ResponseEntity<List<MedicalHistory>> list(@PathVariable String recordId) {
        return ResponseEntity.ok(historyService.listByRecord(recordId));
    }

    @PutMapping("/{historyId}")
    public ResponseEntity<MedicalHistory> update(@PathVariable String recordId,
                                                 @PathVariable String historyId,
                                                 @Valid @RequestBody MedicalHistoryUpdateRequest request) {
        return ResponseEntity.ok(historyService.update(recordId, historyId, request));
    }

    @DeleteMapping("/{historyId}")
    public ResponseEntity<Void> delete(@PathVariable String recordId, @PathVariable String historyId) {
        historyService.delete(recordId, historyId);
        return ResponseEntity.noContent().build();
    }
}
