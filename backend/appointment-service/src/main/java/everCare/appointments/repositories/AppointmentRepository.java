package everCare.appointments.repositories;

import everCare.appointments.entities.Appointment;
import everCare.appointments.entities.ConsultationType;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, String>, JpaSpecificationExecutor<Appointment> {

    // Find by patient
    List<Appointment> findByPatientId(String patientId);

    // Find by doctor
    List<Appointment> findByDoctorId(String doctorId);

    // Find by caregiver
    List<Appointment> findByCaregiverId(String caregiverId);

    // Find by status
    List<Appointment> findByStatus(String status);

    // Find by date range
    List<Appointment> findByStartDateTimeBetween(LocalDateTime start, LocalDateTime end);

    // Find by doctor and date range
    List<Appointment> findByDoctorIdAndStartDateTimeBetween(String doctorId, LocalDateTime start, LocalDateTime end);

    // Find future appointments by patient
    @Query("SELECT a FROM Appointment a WHERE a.patientId = :patientId AND a.startDateTime > :now ORDER BY a.startDateTime")
    List<Appointment> findFutureByPatient(@Param("patientId") String patientId, @Param("now") LocalDateTime now);

    // Find by consultation type
    List<Appointment> findByConsultationType(ConsultationType consultationType);

    // Check if doctor is available at specific time
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.startDateTime = :dateTime AND a.status != 'CANCELLED'")
    int countByDoctorAndDateTime(@Param("doctorId") String doctorId, @Param("dateTime") LocalDateTime dateTime);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.status != 'CANCELLED' AND a.startDateTime < :endDateTime AND a.endDateTime > :startDateTime")
    long countOverlappingAppointments(@Param("doctorId") String doctorId,
                                      @Param("startDateTime") LocalDateTime startDateTime,
                                      @Param("endDateTime") LocalDateTime endDateTime);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.appointmentId <> :appointmentId AND a.status != 'CANCELLED' AND a.startDateTime < :endDateTime AND a.endDateTime > :startDateTime")
    long countOverlappingAppointmentsExcludingId(@Param("doctorId") String doctorId,
                                                 @Param("appointmentId") String appointmentId,
                                                 @Param("startDateTime") LocalDateTime startDateTime,
                                                 @Param("endDateTime") LocalDateTime endDateTime);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.startDateTime >= :startOfDay AND a.startDateTime < :endOfDay")
    long countTodayByDoctorId(@Param("doctorId") String doctorId,
                              @Param("startOfDay") LocalDateTime startOfDay,
                              @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.startDateTime >= :now AND a.status NOT IN ('CANCELLED', 'COMPLETED', 'MISSED')")
    long countUpcomingByDoctorId(@Param("doctorId") String doctorId,
                                 @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(DISTINCT a.patientId) FROM Appointment a WHERE a.doctorId = :doctorId")
    long countDistinctPatientsByDoctorId(@Param("doctorId") String doctorId);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.status = 'COMPLETED' AND a.startDateTime < :now")
    long countCompletedPastByDoctorId(@Param("doctorId") String doctorId,
                                      @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.status <> 'CANCELLED' AND a.startDateTime < :now")
    long countPastNonCancelledByDoctorId(@Param("doctorId") String doctorId,
                                         @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.startDateTime >= :startDateTime AND a.startDateTime < :endDateTime")
    long countByDoctorIdAndRange(@Param("doctorId") String doctorId,
                                 @Param("startDateTime") LocalDateTime startDateTime,
                                 @Param("endDateTime") LocalDateTime endDateTime);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.status = :status")
    long countByDoctorIdAndStatus(@Param("doctorId") String doctorId,
                                  @Param("status") String status);

    @Query("SELECT FUNCTION('DATE', a.startDateTime), COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.startDateTime >= :startDateTime AND a.startDateTime < :endDateTime GROUP BY FUNCTION('DATE', a.startDateTime) ORDER BY FUNCTION('DATE', a.startDateTime)")
    List<Object[]> countDailyTrendByDoctorId(@Param("doctorId") String doctorId,
                                             @Param("startDateTime") LocalDateTime startDateTime,
                                             @Param("endDateTime") LocalDateTime endDateTime);

    List<Appointment> findByStatusInAndEndDateTimeBefore(Collection<String> statuses, LocalDateTime cutoff);
}
