package com.example.medicalrecordservice.repository;

import com.example.medicalrecordservice.entity.AssessmentReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssessmentReportRepository extends JpaRepository<AssessmentReport, String> {

    List<AssessmentReport> findByMedicalRecordIdOrderByAssessmentDateDescCreatedAtDesc(String medicalRecordId);
}
