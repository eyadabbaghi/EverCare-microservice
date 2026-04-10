package everCare.appointments.dtos;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class UpdateAvailabilityRequest {
    @NotNull(message = "dayOfWeek is required")
    private DayOfWeek dayOfWeek;

    @NotNull(message = "startTime is required")
    private LocalTime startTime;

    @NotNull(message = "endTime is required")
    private LocalTime endTime;

    @NotNull(message = "validFrom is required")
    private LocalDate validFrom;

    @NotNull(message = "validTo is required")
    private LocalDate validTo;
    private String recurrence;
    private Boolean isBlocked;
    private String blockReason;
}
