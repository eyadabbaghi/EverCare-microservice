package com.example.medicalrecordservice.controller;

import com.example.medicalrecordservice.dto.MedicalRecordArchiveRequest;
import com.example.medicalrecordservice.dto.MedicalRecordCreateRequest;
import com.example.medicalrecordservice.dto.MedicalRecordUpdateRequest;
import com.example.medicalrecordservice.entity.MedicalRecord;
import jakarta.validation.Valid;
import com.example.medicalrecordservice.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor

public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping
    public ResponseEntity<MedicalRecord> create(@Valid @RequestBody MedicalRecordCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicalRecordService.create(toCreateEntity(request)));
    }

    @PostMapping("/auto-create")
    public ResponseEntity<MedicalRecord> autoCreate(@Valid @RequestBody MedicalRecordCreateRequest request) {
        return ResponseEntity.ok(medicalRecordService.autoCreate(toCreateEntity(request)));
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
        return ResponseEntity.ok(medicalRecordService.update(id, toUpdateEntity(request)));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<MedicalRecord> archive(@PathVariable String id,
                                                 @RequestBody(required = false) MedicalRecordArchiveRequest request) {
        return ResponseEntity.ok(medicalRecordService.archive(id, request));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<MedicalRecord> restore(@PathVariable String id) {
        return ResponseEntity.ok(medicalRecordService.restore(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        medicalRecordService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private MedicalRecord toCreateEntity(MedicalRecordCreateRequest request) {
        return MedicalRecord.builder()
                .patientId(request.getPatientId().trim())
                .bloodGroup(normalize(request.getBloodGroup()))
                .alzheimerStage(normalize(request.getAlzheimerStage()))
                .build();
    }

    private MedicalRecord toUpdateEntity(MedicalRecordUpdateRequest request) {
        return MedicalRecord.builder()
                .bloodGroup(normalize(request.getBloodGroup()))
                .alzheimerStage(normalize(request.getAlzheimerStage()))
                .build();
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }
}
