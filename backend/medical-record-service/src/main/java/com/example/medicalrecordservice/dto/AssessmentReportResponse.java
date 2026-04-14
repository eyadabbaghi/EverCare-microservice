package com.example.medicalrecordservice.dto;

import com.example.medicalrecordservice.entity.AlzheimerStage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentReportResponse {
    private UUID id;
    private String patientId;
    private String patientName;
    private String caregiverName;
    private Map<String, Integer> answers;
    private int score;
    private AlzheimerStage computedStage;
    private String recommendation;
    private String doctorNote;
    private boolean needsAttention;
    private boolean active;
    private LocalDateTime createdAt;
    private String reportType;
    private AlzheimerStage stage;
    private String summary;
    private String author;
    private LocalDateTime assessmentDate;
    private boolean archived;
    private String medicalRecordId;
    private LocalDateTime updatedAt;
}
