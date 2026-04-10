package everCare.appointments.dtos;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateAppointmentRequest {
    @NotBlank(message = "patientId is required")
    private String patientId;

    @NotBlank(message = "doctorId is required")
    private String doctorId;

    private String caregiverId;

    @NotBlank(message = "consultationTypeId is required")
    private String consultationTypeId;

    @NotNull(message = "startDateTime is required")
    private LocalDateTime startDateTime;

    private LocalDateTime endDateTime;
    private String status;
    private String caregiverPresence;
    private String videoLink;
    private boolean isRecurring;
    private String recurrencePattern;
    private String doctorNotes;
    private String simpleSummary;
}
