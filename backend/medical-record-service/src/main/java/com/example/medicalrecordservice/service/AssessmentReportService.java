package com.example.medicalrecordservice.service;

import com.example.medicalrecordservice.entity.AssessmentReport;
import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.exception.BadRequestException;
import com.example.medicalrecordservice.exception.NotFoundException;
import com.example.medicalrecordservice.repository.AssessmentReportRepository;
import com.example.medicalrecordservice.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AssessmentReportService {

    private final AssessmentReportRepository reportRepository;
    private final MedicalRecordRepository recordRepository;

	public AssessmentReport addToRecord(String recordId, AssessmentReport report) {
		MedicalRecord record = getRequiredRecord(recordId);
		ensureRecordIsActive(record);
		validateReport(report);

		report.setMedicalRecord(record);
		report.setReportType(normalizeText(report.getReportType()));
		report.setStage(normalizeStage(report.getStage()));
		report.setRecommendation(report.getRecommendation().trim());
		report.setSummary(report.getSummary().trim());
		report.setAuthor(normalizeOptional(report.getAuthor(), "Care team"));
		report.setCreatedAt(LocalDateTime.now());
		report.setUpdatedAt(LocalDateTime.now());

		return reportRepository.save(report);
	}

	public List<AssessmentReport> listByRecord(String recordId) {
		getRequiredRecord(recordId);
		return reportRepository.findByMedicalRecordIdOrderByAssessmentDateDescCreatedAtDesc(recordId);
	}

	public AssessmentReport update(String recordId, String reportId, AssessmentReport updatedReport) {
		MedicalRecord record = getRequiredRecord(recordId);
		ensureRecordIsActive(record);
		AssessmentReport existing = getRequiredReport(recordId, reportId);
		validateReport(updatedReport);

		existing.setMedicalRecord(record);
		existing.setReportType(normalizeText(updatedReport.getReportType()));
		existing.setScore(updatedReport.getScore());
		existing.setStage(normalizeStage(updatedReport.getStage()));
		existing.setRecommendation(updatedReport.getRecommendation().trim());
		existing.setSummary(updatedReport.getSummary().trim());
		existing.setAuthor(normalizeOptional(updatedReport.getAuthor(), "Care team"));
		existing.setAssessmentDate(updatedReport.getAssessmentDate());
		existing.setUpdatedAt(LocalDateTime.now());

		return reportRepository.save(existing);
	}

	public void delete(String recordId, String reportId) {
		MedicalRecord record = getRequiredRecord(recordId);
		ensureRecordIsActive(record);
		AssessmentReport report = getRequiredReport(recordId, reportId);
		reportRepository.deleteById(report.getId());
	}

    private MedicalRecord getRequiredRecord(String recordId) {
        return recordRepository.findById(recordId)
                .orElseThrow(() -> new NotFoundException("MedicalRecord not found"));
    }

    private AssessmentReport getRequiredReport(String recordId, String reportId) {
        AssessmentReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("AssessmentReport not found"));

        if (report.getMedicalRecord() == null || !recordId.equals(report.getMedicalRecord().getId())) {
            throw new BadRequestException("AssessmentReport does not belong to the provided medical record");
        }

        return report;
    }

    private void validateReport(AssessmentReport report) {
        if (report.getReportType() == null || report.getReportType().isBlank()) {
            throw new BadRequestException("reportType is required");
        }

        if (report.getScore() == null || report.getScore() < 0 || report.getScore() > 100) {
            throw new BadRequestException("score must be between 0 and 100");
        }

        if (report.getStage() == null || report.getStage().isBlank()) {
            throw new BadRequestException("stage is required");
        }

        if (report.getAssessmentDate() == null) {
            throw new BadRequestException("assessmentDate is required");
        }

        if (report.getRecommendation() == null || report.getRecommendation().isBlank()) {
            throw new BadRequestException("recommendation is required");
        }

        if (report.getSummary() == null || report.getSummary().isBlank()) {
            throw new BadRequestException("summary is required");
        }
    }

    private void ensureRecordIsActive(MedicalRecord record) {
        if (record.isArchived()) {
            throw new BadRequestException("Medical record is archived; report changes are blocked");
        }
    }

    private String normalizeStage(String stage) {
        return stage.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeText(String value) {
        return value.trim();
    }

    private String normalizeOptional(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }
}
