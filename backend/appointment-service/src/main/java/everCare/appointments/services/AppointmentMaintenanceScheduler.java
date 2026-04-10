package everCare.appointments.services;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AppointmentMaintenanceScheduler {

    private static final Logger log = LoggerFactory.getLogger(AppointmentMaintenanceScheduler.class);

    private final AppointmentService appointmentService;

    @Scheduled(fixedDelayString = "${appointments.missed-job.fixed-delay-ms:300000}")
    public void markMissedAppointments() {
        int updated = appointmentService.markMissedAppointments(LocalDateTime.now());
        if (updated > 0) {
            log.info("Marked {} overdue appointments as MISSED", updated);
        }
    }
}
