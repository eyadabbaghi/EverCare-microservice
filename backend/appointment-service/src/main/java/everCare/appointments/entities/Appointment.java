package everCare.appointments.entities;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @Column(name = "appointment_id")
    private String appointmentId;

    @PrePersist
    public void generateId() {
        if (this.appointmentId == null) {
            this.appointmentId = UUID.randomUUID().toString();
        }
        this.createdAt = LocalDateTime.now();
    }

    // ========== LIENS VERS AUTRES ENTITÉS ==========

    @Column(name = "patient_id", nullable = false)
    private String patientId;

    @Column(name = "doctor_id", nullable = false)
    private String doctorId;

    @Column(name = "caregiver_id")
    private String caregiverId;

    @ManyToOne
    @JoinColumn(name = "consultation_type_id")
    private ConsultationType consultationType;

    // ========== DATES ET HORAIRES ==========

    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;

    // ========== STATUT ==========

    private String status; // SCHEDULED, CONFIRMED_BY_PATIENT, CONFIRMED_BY_CAREGIVER, COMPLETED, CANCELLED, MISSED

    // ========== VALIDATIONS ==========

    private LocalDateTime confirmationDatePatient;
    private LocalDateTime confirmationDateCaregiver;

    // ========== PRÉSENCE AIDANT ==========

    private String caregiverPresence; // PHYSICAL, REMOTE, NONE

    // ========== LIEN VIDÉO ==========

    private String videoLink; // Lien unique pour la consultation

    // ========== RÉCURRENCE ==========

    private boolean isRecurring;
    private String recurrencePattern; // WEEKLY, BIWEEKLY, MONTHLY

    // ========== NOTES ==========

    @Column(length = 1000)
    private String doctorNotes; // Notes du médecin (privées)

    @Column(length = 500)
    private String simpleSummary; // Résumé simple pour patient (3 pictos)

    // ========== SUIVI ==========

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
