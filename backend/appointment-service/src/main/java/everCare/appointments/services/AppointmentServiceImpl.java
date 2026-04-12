package everCare.appointments.services;

import everCare.appointments.entities.Appointment;
import everCare.appointments.dtos.DoctorTrendPointDto;
import everCare.appointments.dtos.DoctorWorkloadStatsDto;
import everCare.appointments.entities.ConsultationType;
import everCare.appointments.exceptions.ResourceNotFoundException;
import everCare.appointments.repositories.AppointmentRepository;
import everCare.appointments.repositories.AvailabilityRepository;
import everCare.appointments.repositories.ConsultationTypeRepository;
import everCare.appointments.services.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AvailabilityRepository availabilityRepository;
    private final ConsultationTypeRepository consultationTypeRepository;
    private final UserDirectoryService userDirectoryService;

// ========== CREATE ==========

    @Override
    public Appointment createAppointment(Appointment appointment) {
        // Generate ID if not present
        if (appointment.getAppointmentId() == null) {
            appointment.setAppointmentId(UUID.randomUUID().toString());
        }

        // Set creation timestamp
        appointment.setCreatedAt(LocalDateTime.now());

        // ========== FIX: Load actual entities from database ==========

        // Load patient from database
        if (appointment.getPatientId() != null) {
            userDirectoryService.getRequiredPatient(appointment.getPatientId());
        } else {
            throw new ResourceNotFoundException("Patient is required");
        }

        // Load doctor from database
        if (appointment.getDoctorId() != null) {
            userDirectoryService.getRequiredDoctor(appointment.getDoctorId());
        } else {
            throw new ResourceNotFoundException("Doctor is required");
        }

        // Load caregiver if present
        if (appointment.getCaregiverId() != null && !appointment.getCaregiverId().isBlank()) {
            userDirectoryService.getOptionalCaregiver(appointment.getCaregiverId());
        }

        // Load consultation type
        if (appointment.getConsultationType() != null && appointment.getConsultationType().getTypeId() != null) {
            ConsultationType consultationType = consultationTypeRepository.findById(appointment.getConsultationType().getTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Consultation type not found with id: " + appointment.getConsultationType().getTypeId()));
            appointment.setConsultationType(consultationType);
        } else {
            throw new ResourceNotFoundException("Consultation type is required");
        }

        // ========== END OF FIX ==========

        validateAndPrepareAppointment(appointment, null);

		// Generate Jitsi Meet video link
		if (appointment.getVideoLink() == null && appointment.getAppointmentId() != null) {
			String roomName = "evercare-" + appointment.getAppointmentId();
			appointment.setVideoLink("https://meet.jit.si/" + roomName);
		}

        // Set default status
        if (appointment.getStatus() == null) {
            appointment.setStatus("SCHEDULED");
        }

        return appointmentRepository.save(appointment);
    }

    // ========== READ ==========

    @Override
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    @Override
    public Appointment getAppointmentById(String id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
    }

    @Override
    public List<Appointment> getAppointmentsByPatient(String patientId) {
        userDirectoryService.getRequiredPatient(patientId);
        return appointmentRepository.findByPatientId(patientId);
    }

    @Override
    public List<Appointment> getAppointmentsByDoctor(String doctorId) {
        userDirectoryService.getRequiredDoctor(doctorId);
        return appointmentRepository.findByDoctorId(doctorId);
    }

    @Override
    public List<Appointment> getAppointmentsByCaregiver(String caregiverId) {
        userDirectoryService.getOptionalCaregiver(caregiverId);
        return appointmentRepository.findByCaregiverId(caregiverId);
    }

    @Override
    public List<Appointment> getAppointmentsByStatus(String status) {
        return appointmentRepository.findByStatus(status);
    }

    @Override
    public List<Appointment> getAppointmentsByDateRange(LocalDateTime start, LocalDateTime end) {
        return appointmentRepository.findByStartDateTimeBetween(start, end);
    }

    @Override
    public List<Appointment> getAppointmentsByDoctorAndDateRange(String doctorId, LocalDateTime start, LocalDateTime end) {
        userDirectoryService.getRequiredDoctor(doctorId);
        return appointmentRepository.findByDoctorIdAndStartDateTimeBetween(doctorId, start, end);
    }

    @Override
    public List<Appointment> getFutureAppointmentsByPatient(String patientId) {
        userDirectoryService.getRequiredPatient(patientId);
        return appointmentRepository.findFutureByPatient(patientId, LocalDateTime.now());
    }

    @Override
    public Page<Appointment> searchAppointments(String patientId,
                                                String doctorId,
                                                String caregiverId,
                                                String status,
                                                LocalDateTime startDate,
                                                LocalDateTime endDate,
                                                String consultationTypeId,
                                                Pageable pageable) {
        Specification<Appointment> spec = Specification.where(null);

        if (patientId != null && !patientId.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("patientId"), patientId));
        }
        if (doctorId != null && !doctorId.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("doctorId"), doctorId));
        }
        if (caregiverId != null && !caregiverId.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("caregiverId"), caregiverId));
        }
        if (status != null && !status.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (startDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("startDateTime"), startDate));
        }
        if (endDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("startDateTime"), endDate));
        }
        if (consultationTypeId != null && !consultationTypeId.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("consultationType").get("typeId"), consultationTypeId));
        }

        return appointmentRepository.findAll(spec, pageable);
    }

    @Override
    public boolean isDoctorAvailable(String doctorId, LocalDateTime dateTime) {
        userDirectoryService.getRequiredDoctor(doctorId);
        int count = appointmentRepository.countByDoctorAndDateTime(doctorId, dateTime);
        return count == 0;
    }

    // ========== UPDATE ==========

    @Override
    public Appointment updateAppointment(String id, Appointment appointmentDetails) {
        Appointment existingAppointment = getAppointmentById(id);
        ensureMutable(existingAppointment);

        if (appointmentDetails.getStartDateTime() != null) {
            existingAppointment.setStartDateTime(appointmentDetails.getStartDateTime());
        }

        if (appointmentDetails.getEndDateTime() != null) {
            existingAppointment.setEndDateTime(appointmentDetails.getEndDateTime());
        }

        if (appointmentDetails.getStatus() != null) {
            validateStatusTransition(existingAppointment.getStatus(), appointmentDetails.getStatus(), existingAppointment);
            existingAppointment.setStatus(appointmentDetails.getStatus());
        }

        if (appointmentDetails.getCaregiverPresence() != null) {
            existingAppointment.setCaregiverPresence(appointmentDetails.getCaregiverPresence());
        }

        if (appointmentDetails.getDoctorNotes() != null) {
            existingAppointment.setDoctorNotes(appointmentDetails.getDoctorNotes());
        }

        if (appointmentDetails.getSimpleSummary() != null) {
            existingAppointment.setSimpleSummary(appointmentDetails.getSimpleSummary());
        }

        // Load caregiver if provided
        if (appointmentDetails.getCaregiverId() != null) {
            userDirectoryService.getOptionalCaregiver(appointmentDetails.getCaregiverId());
            existingAppointment.setCaregiverId(appointmentDetails.getCaregiverId());
        }

        // Load consultation type if provided
        if (appointmentDetails.getConsultationType() != null && appointmentDetails.getConsultationType().getTypeId() != null) {
            ConsultationType consultationType = consultationTypeRepository.findById(appointmentDetails.getConsultationType().getTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Consultation type not found"));
            existingAppointment.setConsultationType(consultationType);
        }

        validateAndPrepareAppointment(existingAppointment, existingAppointment.getAppointmentId());

        existingAppointment.setUpdatedAt(LocalDateTime.now());

        return appointmentRepository.save(existingAppointment);
    }

    @Override
    public Appointment confirmByPatient(String id) {
        Appointment appointment = getAppointmentById(id);
        if (!"SCHEDULED".equals(appointment.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Only scheduled appointments can be confirmed by the patient");
        }
        appointment.setConfirmationDatePatient(LocalDateTime.now());
        appointment.setStatus("CONFIRMED_BY_PATIENT");
        appointment.setUpdatedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment confirmByCaregiver(String id) {
        Appointment appointment = getAppointmentById(id);
        if (!"CONFIRMED_BY_PATIENT".equals(appointment.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Caregiver confirmation requires prior patient confirmation");
        }
        if (appointment.getCaregiverId() == null || appointment.getCaregiverId().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "This appointment has no caregiver assigned");
        }
        appointment.setConfirmationDateCaregiver(LocalDateTime.now());
        appointment.setStatus("CONFIRMED_BY_CAREGIVER");
        appointment.setUpdatedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment cancelAppointment(String id) {
        Appointment appointment = getAppointmentById(id);
        if (isTerminalStatus(appointment.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Terminal appointments cannot be cancelled");
        }
        appointment.setStatus("CANCELLED");
        appointment.setUpdatedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment rescheduleAppointment(String id, LocalDateTime newDateTime) {
        Appointment appointment = getAppointmentById(id);
        ensureMutable(appointment);
        appointment.setStartDateTime(newDateTime);
        validateAndPrepareAppointment(appointment, appointment.getAppointmentId());

        appointment.setStatus("SCHEDULED");
        appointment.setConfirmationDatePatient(null);
        appointment.setConfirmationDateCaregiver(null);
        appointment.setUpdatedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment updateDoctorNotes(String id, String notes) {
        Appointment appointment = getAppointmentById(id);
        appointment.setDoctorNotes(notes);
        appointment.setUpdatedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }

    @Override
    public Appointment updateSimpleSummary(String id, String summary) {
        Appointment appointment = getAppointmentById(id);
        appointment.setSimpleSummary(summary);
        appointment.setUpdatedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }

    // ========== DELETE ==========

    @Override
    public void deleteAppointment(String id) {
        Appointment appointment = getAppointmentById(id);
        appointmentRepository.delete(appointment);
    }

    @Override
    public void deleteAppointmentsByPatient(String patientId) {
        userDirectoryService.getRequiredPatient(patientId);
        List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
        appointmentRepository.deleteAll(appointments);
    }

    // ========== BUSINESS LOGIC ==========

    @Override
    public long countAppointmentsByDoctorAndDate(String doctorId, LocalDateTime date) {
        userDirectoryService.getRequiredDoctor(doctorId);
        return appointmentRepository.countByDoctorAndDateTime(doctorId, date);
    }

    @Override
    public DoctorWorkloadStatsDto getDoctorWorkloadStats(String doctorId) {
        userDirectoryService.getRequiredDoctor(doctorId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = now.toLocalDate().atTime(LocalTime.MAX);
        LocalDateTime startOfWeek = now.toLocalDate().minusDays(6).atStartOfDay();

        long todayCount = appointmentRepository.countTodayByDoctorId(doctorId, startOfDay, endOfDay);
        long upcomingCount = appointmentRepository.countUpcomingByDoctorId(doctorId, now);
        long totalPatients = appointmentRepository.countDistinctPatientsByDoctorId(doctorId);
        long weeklyCount = appointmentRepository.countByDoctorIdAndRange(doctorId, startOfWeek, endOfDay.plusNanos(1));
        long completedCount = appointmentRepository.countByDoctorIdAndStatus(doctorId, "COMPLETED");
        long cancelledCount = appointmentRepository.countByDoctorIdAndStatus(doctorId, "CANCELLED");
        long missedCount = appointmentRepository.countByDoctorIdAndStatus(doctorId, "MISSED");
        long completedPast = appointmentRepository.countCompletedPastByDoctorId(doctorId, now);
        long pastNonCancelled = appointmentRepository.countPastNonCancelledByDoctorId(doctorId, now);

        long completionRate = pastNonCancelled == 0
                ? 0
                : Math.round((completedPast * 100.0) / pastNonCancelled);

        return new DoctorWorkloadStatsDto(
                doctorId,
                todayCount,
                upcomingCount,
                totalPatients,
                weeklyCount,
                completedCount,
                cancelledCount,
                missedCount,
                completionRate
        );
    }

    @Override
    public List<DoctorTrendPointDto> getDoctorWorkloadTrend(String doctorId, LocalDate fromDate, int days) {
        userDirectoryService.getRequiredDoctor(doctorId);

        LocalDate startDate = fromDate != null ? fromDate : LocalDate.now().minusDays(days - 1L);
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = startDate.plusDays(days).atStartOfDay();

        Map<LocalDate, Long> countsByDay = appointmentRepository.countDailyTrendByDoctorId(doctorId, startDateTime, endDateTime)
                .stream()
                .collect(Collectors.toMap(
                        row -> LocalDate.parse(row[0].toString()),
                        row -> ((Number) row[1]).longValue()
                ));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE");

        return startDate.datesUntil(startDate.plusDays(days))
                .map(day -> new DoctorTrendPointDto(
                        day.format(formatter),
                        countsByDay.getOrDefault(day, 0L)
                ))
                .toList();
    }

    @Override
    public List<Appointment> getAppointmentsNeedingReminder(LocalDateTime reminderTime) {
        LocalDateTime reminderWindowStart = reminderTime.minusHours(24);
        LocalDateTime reminderWindowEnd = reminderTime.plusHours(1);

        return appointmentRepository.findByStartDateTimeBetween(reminderWindowStart, reminderWindowEnd)
                .stream()
                .filter(a -> a.getStatus().equals("SCHEDULED") || a.getStatus().equals("CONFIRMED_BY_PATIENT"))
                .toList();
    }

    @Override
    public int markMissedAppointments(LocalDateTime now) {
        List<Appointment> overdueAppointments = appointmentRepository.findByStatusInAndEndDateTimeBefore(
                Set.of("SCHEDULED", "CONFIRMED_BY_PATIENT", "CONFIRMED_BY_CAREGIVER", "IN_PROGRESS"),
                now
        );

        overdueAppointments.forEach(appointment -> {
            appointment.setStatus("MISSED");
            appointment.setUpdatedAt(now);
        });

        appointmentRepository.saveAll(overdueAppointments);
        return overdueAppointments.size();
    }

    @Override
    public void sendReminders() {
        List<Appointment> appointmentsNeedingReminder = getAppointmentsNeedingReminder(LocalDateTime.now());

        for (Appointment appointment : appointmentsNeedingReminder) {
            System.out.println("Sending reminder for appointment: " + appointment.getAppointmentId());
        }
    }

    private void validateAndPrepareAppointment(Appointment appointment, String existingAppointmentId) {
        if (appointment.getStartDateTime() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Appointment start time is required");
        }

        if (!appointment.getStartDateTime().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "Appointment must be scheduled in the future");
        }

        if (appointment.getConsultationType() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Consultation type is required");
        }

        if (!appointment.getConsultationType().isActive()) {
            throw new ResponseStatusException(BAD_REQUEST, "Consultation type is inactive");
        }

        if (appointment.getConsultationType().isRequiresCaregiver()
                && (appointment.getCaregiverId() == null || appointment.getCaregiverId().isBlank())) {
            throw new ResponseStatusException(BAD_REQUEST, "This consultation type requires a caregiver");
        }

        if (appointment.getConsultationType().isRequiresCaregiver()
                && "NONE".equalsIgnoreCase(appointment.getCaregiverPresence())) {
            throw new ResponseStatusException(BAD_REQUEST, "Caregiver presence cannot be NONE for this consultation type");
        }

appointment.setEndDateTime(appointment.getStartDateTime()
                .plusMinutes(appointment.getConsultationType().getDefaultDurationMinutes()));

        if (!appointment.getEndDateTime().isAfter(appointment.getStartDateTime())) {
            throw new ResponseStatusException(BAD_REQUEST, "Appointment end time must be after start time");
        }

// Skip availability validation for now (requires proper availability setup)
        // if (hasDoctorAvailability(appointment.getDoctorId()) && !isWithinDoctorAvailability(appointment)) {
        //     throw new ResponseStatusException(BAD_REQUEST,
        //         "Appointment is outside the doctor's availability. Selected day: " + appointment.getStartDateTime().getDayOfWeek());
        // }

        long overlaps = existingAppointmentId == null
                ? appointmentRepository.countOverlappingAppointments(
                appointment.getDoctorId(), appointment.getStartDateTime(), appointment.getEndDateTime())
                : appointmentRepository.countOverlappingAppointmentsExcludingId(
                appointment.getDoctorId(), existingAppointmentId, appointment.getStartDateTime(), appointment.getEndDateTime());

        if (overlaps > 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Doctor already has an overlapping appointment");
        }
    }

    private boolean hasDoctorAvailability(String doctorId) {
        return !availabilityRepository.findByDoctorId(doctorId).isEmpty();
    }

    private boolean isWithinDoctorAvailability(Appointment appointment) {
        return availabilityRepository.findValidByDoctorAndDate(appointment.getDoctorId(), appointment.getStartDateTime().toLocalDate())
                .stream()
                .filter(a -> !a.isBlocked())
                .filter(a -> a.getDayOfWeek() == appointment.getStartDateTime().getDayOfWeek())
                .anyMatch(a -> !appointment.getStartDateTime().toLocalTime().isBefore(a.getStartTime())
                        && !appointment.getEndDateTime().toLocalTime().isAfter(a.getEndTime()));
    }

    private void ensureMutable(Appointment appointment) {
        if (isTerminalStatus(appointment.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Terminal appointments cannot be modified");
        }
    }

    private boolean isTerminalStatus(String status) {
        return "COMPLETED".equals(status) || "CANCELLED".equals(status) || "MISSED".equals(status);
    }

    private void validateStatusTransition(String currentStatus, String nextStatus, Appointment appointment) {
        if (currentStatus == null || currentStatus.equals(nextStatus)) {
            return;
        }

        switch (nextStatus) {
            case "SCHEDULED" -> throw new ResponseStatusException(BAD_REQUEST, "Use reschedule to move an appointment back to scheduled");
            case "CONFIRMED_BY_PATIENT" -> {
                if (!"SCHEDULED".equals(currentStatus)) {
                    throw new ResponseStatusException(BAD_REQUEST, "Patient confirmation is only allowed from scheduled status");
                }
            }
            case "CONFIRMED_BY_CAREGIVER" -> {
                if (!"CONFIRMED_BY_PATIENT".equals(currentStatus)) {
                    throw new ResponseStatusException(BAD_REQUEST, "Caregiver confirmation requires patient confirmation first");
                }
                if (appointment.getCaregiverId() == null || appointment.getCaregiverId().isBlank()) {
                    throw new ResponseStatusException(BAD_REQUEST, "Cannot caregiver-confirm an appointment without a caregiver");
                }
            }
            case "IN_PROGRESS" -> {
                if (!("CONFIRMED_BY_PATIENT".equals(currentStatus) || "CONFIRMED_BY_CAREGIVER".equals(currentStatus))) {
                    throw new ResponseStatusException(BAD_REQUEST, "Only confirmed appointments can start");
                }
            }
            case "COMPLETED" -> {
                if (!("IN_PROGRESS".equals(currentStatus) || "CONFIRMED_BY_PATIENT".equals(currentStatus) || "CONFIRMED_BY_CAREGIVER".equals(currentStatus))) {
                    throw new ResponseStatusException(BAD_REQUEST, "Only active or confirmed appointments can be completed");
                }
            }
            case "CANCELLED" -> {
                if (isTerminalStatus(currentStatus)) {
                    throw new ResponseStatusException(BAD_REQUEST, "Terminal appointments cannot be cancelled");
                }
            }
            case "MISSED" -> {
                if (!("SCHEDULED".equals(currentStatus) || "CONFIRMED_BY_PATIENT".equals(currentStatus) || "CONFIRMED_BY_CAREGIVER".equals(currentStatus) || "IN_PROGRESS".equals(currentStatus))) {
                    throw new ResponseStatusException(BAD_REQUEST, "Only pending or active appointments can be marked missed");
                }
            }
            default -> throw new ResponseStatusException(BAD_REQUEST, "Unsupported appointment status transition");
        }
    }
}
