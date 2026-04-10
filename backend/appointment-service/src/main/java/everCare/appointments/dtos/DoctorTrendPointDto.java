package everCare.appointments.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DoctorTrendPointDto {
    private String day;
    private long count;
}
