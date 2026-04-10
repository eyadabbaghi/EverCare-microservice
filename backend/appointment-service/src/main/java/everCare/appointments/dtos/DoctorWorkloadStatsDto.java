package everCare.appointments.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DoctorWorkloadStatsDto {
    private String doctorId;
    private long todayCount;
    private long upcomingCount;
    private long totalPatients;
    private long weeklyCount;
    private long completedCount;
    private long cancelledCount;
    private long missedCount;
    private long completionRate;
}
