package everCare.appointments.controllers;

import everCare.appointments.entities.Appointment;
import everCare.appointments.entities.ConsultationType;
import everCare.appointments.dtos.AppointmentResponseDTO;
import everCare.appointments.dtos.CreateAppointmentRequest;
import everCare.appointments.dtos.DoctorTrendPointDto;
import everCare.appointments.dtos.DoctorWorkloadStatsDto;
import everCare.appointments.dtos.UpdateAppointmentRequest;
import everCare.appointments.dtos.UserDto;
import everCare.appointments.services.AppointmentService;
import everCare.appointments.repositories.ConsultationTypeRepository;
import everCare.appointments.services.UserDirectoryService;
import everCare.appointments.exceptions.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final ConsultationTypeRepository consultationTypeRepository;
    private final UserDirectoryService userDirectoryService;

    // ========== CREATE WITH DTO ==========

    @PostMapping
    public ResponseEntity<AppointmentResponseDTO> createAppointment(@Valid @RequestBody CreateAppointmentRequest request) {
        Appointment appointment = new Appointment();

        if (request.getPatientId() != null) {
            appointment.setPatientId(request.getPatientId());
        } else {
            throw new ResourceNotFoundException("Patient ID is required");
        }

        if (request.getDoctorId() != null) {
            appointment.setDoctorId(request.getDoctorId());
        } else {
            throw new ResourceNotFoundException("Doctor ID is required");
        }

        if (request.getCaregiverId() != null && !request.getCaregiverId().isEmpty()) {
            appointment.setCaregiverId(request.getCaregiverId());
        }

        if (request.getConsultationTypeId() != null) {
            ConsultationType consultationType = consultationTypeRepository.findById(request.getConsultationTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Consultation type not found with id: " + request.getConsultationTypeId()));
            appointment.setConsultationType(consultationType);
        } else {
            throw new ResourceNotFoundException("Consultation type ID is required");
        }

        appointment.setStartDateTime(request.getStartDateTime());
        appointment.setEndDateTime(request.getEndDateTime());
        appointment.setStatus(request.getStatus() != null ? request.getStatus() : "SCHEDULED");
        appointment.setCaregiverPresence(request.getCaregiverPresence());
        appointment.setVideoLink(request.getVideoLink());
        appointment.setSimpleSummary(request.getSimpleSummary());
        appointment.setDoctorNotes(request.getDoctorNotes());
        appointment.setRecurring(request.isRecurring());
        appointment.setRecurrencePattern(request.getRecurrencePattern());

        Appointment createdAppointment = appointmentService.createAppointment(appointment);
        return new ResponseEntity<>(convertToDTO(createdAppointment), HttpStatus.CREATED);
    }

    // ========== READ ALL ==========

    @GetMapping
    public ResponseEntity<List<AppointmentResponseDTO>> getAllAppointments() {
        List<Appointment> appointments = appointmentService.getAllAppointments();
        List<AppointmentResponseDTO> dtos = appointments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ========== READ BY ID ==========

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponseDTO> getAppointmentById(@PathVariable String id) {
        Appointment appointment = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(convertToDTO(appointment));
    }

    // ========== READ BY PATIENT ==========

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByPatient(@PathVariable String patientId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByPatient(patientId);
        List<AppointmentResponseDTO> dtos = appointments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // ========== READ BY DOCTOR ==========

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByDoctor(@PathVariable String doctorId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctor(doctorId);
        List<AppointmentResponseDTO> dtos = appointments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ========== READ BY CAREGIVER ==========

    @GetMapping("/caregiver/{caregiverId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByCaregiver(@PathVariable String caregiverId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByCaregiver(caregiverId);
        List<AppointmentResponseDTO> dtos = appointments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ========== READ BY STATUS ==========

    @GetMapping("/status/{status}")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByStatus(@PathVariable String status) {
        List<Appointment> appointments = appointmentService.getAppointmentsByStatus(status);
        List<AppointmentResponseDTO> dtos = appointments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ========== READ BY DATE RANGE ==========

    @GetMapping("/date-range")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDateRange(start, end);
        List<AppointmentResponseDTO> dtos = appointments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ========== READ BY DOCTOR AND DATE RANGE ==========

    @GetMapping("/doctor/{doctorId}/date-range")
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByDoctorAndDateRange(
            @PathVariable String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctorAndDateRange(doctorId, start, end);
        List<AppointmentResponseDTO> dtos = appointments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ========== READ FUTURE APPOINTMENTS BY PATIENT ==========

    @GetMapping("/patient/{patientId}/future")
    public ResponseEntity<List<AppointmentResponseDTO>> getFutureAppointmentsByPatient(@PathVariable String patientId) {
        List<Appointment> appointments = appointmentService.getFutureAppointmentsByPatient(patientId);
        List<AppointmentResponseDTO> dtos = appointments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<AppointmentResponseDTO>> searchAppointments(
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String doctorId,
            @RequestParam(required = false) String caregiverId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String consultationTypeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "startDateTime") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

        Page<Appointment> appointments = appointmentService.searchAppointments(
                patientId,
                doctorId,
                caregiverId,
                status,
                startDate,
                endDate,
                consultationTypeId,
                pageable
        );

        List<AppointmentResponseDTO> content = appointments.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new PageImpl<>(content, pageable, appointments.getTotalElements()));
    }

    // ========== CHECK DOCTOR AVAILABILITY ==========

    @GetMapping("/check-availability")
    public ResponseEntity<Boolean> checkDoctorAvailability(
            @RequestParam String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTime) {
        boolean isAvailable = appointmentService.isDoctorAvailable(doctorId, dateTime);
        return ResponseEntity.ok(isAvailable);
    }

    // ========== UPDATE ==========

    @PutMapping("/{id}")
    public ResponseEntity<AppointmentResponseDTO> updateAppointment(
            @PathVariable String id,
            @Valid @RequestBody UpdateAppointmentRequest request) {
        Appointment appointment = new Appointment();

        appointment.setCaregiverId(request.getCaregiverId());
        appointment.setStartDateTime(request.getStartDateTime());
        appointment.setEndDateTime(request.getEndDateTime());
        appointment.setStatus(request.getStatus());
        appointment.setCaregiverPresence(request.getCaregiverPresence());
        appointment.setVideoLink(request.getVideoLink());
        appointment.setDoctorNotes(request.getDoctorNotes());
        appointment.setSimpleSummary(request.getSimpleSummary());
        if (request.getIsRecurring() != null) {
            appointment.setRecurring(request.getIsRecurring());
        }
        appointment.setRecurrencePattern(request.getRecurrencePattern());

        if (request.getConsultationTypeId() != null) {
            ConsultationType consultationType = consultationTypeRepository.findById(request.getConsultationTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Consultation type not found with id: " + request.getConsultationTypeId()));
            appointment.setConsultationType(consultationType);
        }

        Appointment updatedAppointment = appointmentService.updateAppointment(id, appointment);
        return ResponseEntity.ok(convertToDTO(updatedAppointment));
    }

    // ========== CONFIRM BY PATIENT ==========

    @PatchMapping("/{id}/confirm-patient")
    public ResponseEntity<AppointmentResponseDTO> confirmByPatient(@PathVariable String id) {
        Appointment confirmedAppointment = appointmentService.confirmByPatient(id);
        return ResponseEntity.ok(convertToDTO(confirmedAppointment));
    }

    // ========== CONFIRM BY CAREGIVER ==========

    @PatchMapping("/{id}/confirm-caregiver")
    public ResponseEntity<AppointmentResponseDTO> confirmByCaregiver(@PathVariable String id) {
        Appointment confirmedAppointment = appointmentService.confirmByCaregiver(id);
        return ResponseEntity.ok(convertToDTO(confirmedAppointment));
    }

    // ========== CANCEL APPOINTMENT ==========

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponseDTO> cancelAppointment(@PathVariable String id) {
        Appointment cancelledAppointment = appointmentService.cancelAppointment(id);
        return ResponseEntity.ok(convertToDTO(cancelledAppointment));
    }

    // ========== RESCHEDULE APPOINTMENT ==========

    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponseDTO> rescheduleAppointment(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newDateTime) {
        Appointment rescheduledAppointment = appointmentService.rescheduleAppointment(id, newDateTime);
        return ResponseEntity.ok(convertToDTO(rescheduledAppointment));
    }

    // ========== UPDATE DOCTOR NOTES ==========

    @PatchMapping("/{id}/notes")
    public ResponseEntity<AppointmentResponseDTO> updateDoctorNotes(
            @PathVariable String id,
            @RequestParam String notes) {
        Appointment updatedAppointment = appointmentService.updateDoctorNotes(id, notes);
        return ResponseEntity.ok(convertToDTO(updatedAppointment));
    }

    // ========== UPDATE SIMPLE SUMMARY ==========

    @PatchMapping("/{id}/summary")
    public ResponseEntity<AppointmentResponseDTO> updateSimpleSummary(
            @PathVariable String id,
            @RequestParam String summary) {
        Appointment updatedAppointment = appointmentService.updateSimpleSummary(id, summary);
        return ResponseEntity.ok(convertToDTO(updatedAppointment));
    }

    // ========== DELETE ==========

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable String id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }

    // ========== DELETE BY PATIENT ==========

    @DeleteMapping("/patient/{patientId}")
    public ResponseEntity<Void> deleteAppointmentsByPatient(@PathVariable String patientId) {
        appointmentService.deleteAppointmentsByPatient(patientId);
        return ResponseEntity.noContent().build();
    }

    // ========== COUNT BY DOCTOR AND DATE ==========

    @GetMapping("/count")
    public ResponseEntity<Long> countAppointmentsByDoctorAndDate(
            @RequestParam String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date) {
        long count = appointmentService.countAppointmentsByDoctorAndDate(doctorId, date);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats/doctor/{doctorId}")
    public ResponseEntity<DoctorWorkloadStatsDto> getDoctorWorkloadStats(@PathVariable String doctorId) {
        return ResponseEntity.ok(appointmentService.getDoctorWorkloadStats(doctorId));
    }

    @GetMapping("/stats/doctor/{doctorId}/trend")
    public ResponseEntity<List<DoctorTrendPointDto>> getDoctorWorkloadTrend(
            @PathVariable String doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(appointmentService.getDoctorWorkloadTrend(doctorId, fromDate, days));
    }

    // ========== TRIGGER REMINDERS ==========

    @PostMapping("/send-reminders")
    public ResponseEntity<String> sendReminders() {
        appointmentService.sendReminders();
        return ResponseEntity.ok("Reminders sent successfully");
    }

    // ========== HELPER METHOD TO CONVERT TO DTO ==========

    private AppointmentResponseDTO convertToDTO(Appointment appointment) {
        if (appointment == null) return null;

        AppointmentResponseDTO dto = new AppointmentResponseDTO();

        // Basic fields
        dto.setAppointmentId(appointment.getAppointmentId());
        dto.setStartDateTime(appointment.getStartDateTime());
        dto.setEndDateTime(appointment.getEndDateTime());
        dto.setStatus(appointment.getStatus());
        dto.setConfirmationDatePatient(appointment.getConfirmationDatePatient());
        dto.setConfirmationDateCaregiver(appointment.getConfirmationDateCaregiver());
        dto.setCaregiverPresence(appointment.getCaregiverPresence());
        dto.setVideoLink(appointment.getVideoLink());
        dto.setRecurring(appointment.isRecurring());
        dto.setRecurrencePattern(appointment.getRecurrencePattern());
        dto.setDoctorNotes(appointment.getDoctorNotes());
        dto.setSimpleSummary(appointment.getSimpleSummary());
        dto.setCreatedAt(appointment.getCreatedAt());
        dto.setUpdatedAt(appointment.getUpdatedAt());

        // Patient info - only primitive fields, no circular references
        dto.setPatientId(appointment.getPatientId());
        if (appointment.getPatientId() != null) {
            try {
                UserDto patient = userDirectoryService.getRequiredPatient(appointment.getPatientId());
                dto.setPatientName(patient.getName());
                dto.setPatientPhoto(patient.getProfilePicture());
            } catch (RuntimeException ignored) {
                dto.setPatientName(null);
                dto.setPatientPhoto(null);
            }
        }

        dto.setDoctorId(appointment.getDoctorId());
        if (appointment.getDoctorId() != null) {
            try {
                UserDto doctor = userDirectoryService.getRequiredDoctor(appointment.getDoctorId());
                dto.setDoctorName(doctor.getName());
                dto.setDoctorPhoto(doctor.getProfilePicture());
            } catch (RuntimeException ignored) {
                dto.setDoctorName(null);
                dto.setDoctorPhoto(null);
            }
        }

        dto.setCaregiverId(appointment.getCaregiverId());
        if (appointment.getCaregiverId() != null) {
            try {
                UserDto caregiver = userDirectoryService.getOptionalCaregiver(appointment.getCaregiverId());
                if (caregiver != null) {
                    dto.setCaregiverName(caregiver.getName());
                }
            } catch (RuntimeException ignored) {
                dto.setCaregiverName(null);
            }
        }

        // Consultation type info
        if (appointment.getConsultationType() != null) {
            dto.setConsultationTypeId(appointment.getConsultationType().getTypeId());
            dto.setConsultationTypeName(appointment.getConsultationType().getName());
        }

        return dto;
    }
}
