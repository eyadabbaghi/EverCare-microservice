package com.example.medicalrecordservice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String reportType;
    private Integer score;
    private String stage;

    @Column(length = 3000)
    private String recommendation;

    @Column(length = 2000)
    private String summary;

    private String author;
    private LocalDate assessmentDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id", nullable = false)
    private MedicalRecord medicalRecord;
}
