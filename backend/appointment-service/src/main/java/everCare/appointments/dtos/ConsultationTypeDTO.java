package everCare.appointments.dtos;

import lombok.Data;

@Data
public class ConsultationTypeDTO {
    private String typeId;
    private String name;
    private String description;
    private int defaultDurationMinutes;
    private boolean requiresCaregiver;
    private String environmentPreset;
    private boolean active;
}
