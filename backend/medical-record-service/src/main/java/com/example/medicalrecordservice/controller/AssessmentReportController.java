package com.example.medicalrecordservice.controller;

import com.example.medicalrecordservice.dto.AssessmentReportCreateRequest;
import com.example.medicalrecordservice.dto.AssessmentReportUpdateRequest;
import com.example.medicalrecordservice.entity.AssessmentReport;
import com.example.medicalrecordservice.service.AssessmentReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/medical-records/{recordId}/reports")
@RequiredArgsConstructor
public class AssessmentReportController {

    private final AssessmentReportService reportService;

    @PostMapping
    public ResponseEntity<AssessmentReport> add(@PathVariable String recordId,
                                                @Valid @RequestBody AssessmentReportCreateRequest request) {
        return ResponseEntity.ok(reportService.addToRecord(recordId, toEntity(request)));
    }

    @GetMapping
    public ResponseEntity<List<AssessmentReport>> list(@PathVariable String recordId) {
        return ResponseEntity.ok(reportService.listByRecord(recordId));
    }

    @PutMapping("/{reportId}")
    public ResponseEntity<AssessmentReport> update(@PathVariable String recordId,
                                                   @PathVariable String reportId,
                                                   @Valid @RequestBody AssessmentReportUpdateRequest request) {
        return ResponseEntity.ok(reportService.update(recordId, reportId, toEntity(request)));
    }

    @DeleteMapping("/{reportId}")
    public ResponseEntity<Void> delete(@PathVariable String recordId, @PathVariable String reportId) {
        reportService.delete(recordId, reportId);
        return ResponseEntity.noContent().build();
    }

    private AssessmentReport toEntity(AssessmentReportCreateRequest request) {
        return AssessmentReport.builder()
                .reportType(normalizeText(request.getReportType()))
                .score(request.getScore())
                .stage(normalizeStage(request.getStage()))
                .recommendation(request.getRecommendation().trim())
                .summary(request.getSummary().trim())
                .author(normalizeOptional(request.getAuthor()))
                .assessmentDate(request.getAssessmentDate())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private AssessmentReport toEntity(AssessmentReportUpdateRequest request) {
        return AssessmentReport.builder()
                .reportType(normalizeText(request.getReportType()))
                .score(request.getScore())
                .stage(normalizeStage(request.getStage()))
                .recommendation(request.getRecommendation().trim())
                .summary(request.getSummary().trim())
                .author(normalizeOptional(request.getAuthor()))
                .assessmentDate(request.getAssessmentDate())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private String normalizeStage(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? "Care team" : value.trim();
    }
}
