package everCare.appointments.dtos;

import jakarta.validation.constraints.Future;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdateAppointmentRequest {
    private String caregiverId;
    private String consultationTypeId;

    @Future(message = "startDateTime must be in the future")
    private LocalDateTime startDateTime;

    private LocalDateTime endDateTime;
    private String status;
    private String caregiverPresence;
    private String videoLink;
    private Boolean isRecurring;
    private String recurrencePattern;
    private String doctorNotes;
    private String simpleSummary;
}
