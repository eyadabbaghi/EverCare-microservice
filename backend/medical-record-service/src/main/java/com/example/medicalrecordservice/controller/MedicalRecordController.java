package com.example.medicalrecordservice.controller;

import com.example.medicalrecordservice.dto.MedicalRecordArchiveRequest;
import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.dto.MedicalRecordCreateRequest;
import com.example.medicalrecordservice.dto.MedicalRecordUpdateRequest;
import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor

public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping
    public ResponseEntity<MedicalRecord> create(@Valid @RequestBody MedicalRecordCreateRequest request) {
        return ResponseEntity.ok(medicalRecordService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<MedicalRecord>> findAll() {
        return ResponseEntity.ok(medicalRecordService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicalRecord> findById(@PathVariable String id) {
        return ResponseEntity.ok(medicalRecordService.findById(id));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<MedicalRecord> findByPatientId(@PathVariable String patientId) {
        return ResponseEntity.ok(medicalRecordService.findByPatientId(patientId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicalRecord> update(@PathVariable String id,
                                                @Valid @RequestBody MedicalRecordUpdateRequest request) {
        return ResponseEntity.ok(medicalRecordService.update(id, request));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<MedicalRecord> archive(@PathVariable String id,
                                                 @RequestBody(required = false) MedicalRecordArchiveRequest request) {
        return ResponseEntity.ok(medicalRecordService.archive(id, request));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<MedicalRecord> restore(@PathVariable String id) {
        return ResponseEntity.ok(medicalRecordService.restore(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        medicalRecordService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
