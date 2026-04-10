package everCare.appointments.controllers;

import everCare.appointments.entities.Availability;
import everCare.appointments.dtos.AvailabilityDTO;
import everCare.appointments.dtos.CreateAvailabilityRequest;
import everCare.appointments.dtos.UpdateAvailabilityRequest;
import everCare.appointments.dtos.UserDto;
import everCare.appointments.services.AvailabilityService;
import everCare.appointments.services.UserDirectoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/availabilities")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;
    private final UserDirectoryService userDirectoryService;

    // ========== CREATE ==========

    @PostMapping
    public ResponseEntity<AvailabilityDTO> createAvailability(@Valid @RequestBody CreateAvailabilityRequest request) {
        Availability availability = new Availability();
        availability.setDoctorId(request.getDoctorId());
        availability.setDayOfWeek(request.getDayOfWeek());
        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());
        availability.setValidFrom(request.getValidFrom());
        availability.setValidTo(request.getValidTo());
        availability.setRecurrence(request.getRecurrence());
        availability.setBlocked(request.isBlocked());
        availability.setBlockReason(request.getBlockReason());

        Availability createdAvailability = availabilityService.createAvailability(availability);
        return new ResponseEntity<>(convertToDTO(createdAvailability), HttpStatus.CREATED);
    }

    @PostMapping("/batch")
    public ResponseEntity<List<AvailabilityDTO>> createMultipleAvailabilities(@Valid @RequestBody List<CreateAvailabilityRequest> requests) {
        List<Availability> availabilities = requests.stream().map(this::toAvailability).toList();
        List<Availability> createdAvailabilities = availabilityService.createMultipleAvailabilities(availabilities);
        return new ResponseEntity<>(createdAvailabilities.stream().map(this::convertToDTO).toList(), HttpStatus.CREATED);
    }

    @PostMapping("/weekly")
    public ResponseEntity<AvailabilityDTO> createWeeklyAvailability(
            @RequestParam String doctorId,
            @RequestParam DayOfWeek dayOfWeek,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate validFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate validTo) {

        LocalTime start = LocalTime.parse(startTime);
        LocalTime end = LocalTime.parse(endTime);

        Availability availability = availabilityService.createWeeklyAvailability(
                doctorId, dayOfWeek, start, end, validFrom, validTo);

        return new ResponseEntity<>(convertToDTO(availability), HttpStatus.CREATED);
    }

    // ========== READ ALL ==========

    @GetMapping
    public ResponseEntity<List<AvailabilityDTO>> getAllAvailabilities() {
        List<Availability> availabilities = availabilityService.getAllAvailabilities();
        return ResponseEntity.ok(availabilities.stream().map(this::convertToDTO).toList());
    }

    // ========== READ BY ID ==========

    @GetMapping("/{id}")
    public ResponseEntity<AvailabilityDTO> getAvailabilityById(@PathVariable String id) {
        Availability availability = availabilityService.getAvailabilityById(id);
        return ResponseEntity.ok(convertToDTO(availability));
    }

    // ========== READ BY DOCTOR ==========

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AvailabilityDTO>> getAvailabilitiesByDoctor(@PathVariable String doctorId) {
        List<Availability> availabilities = availabilityService.getAvailabilitiesByDoctor(doctorId);
        return ResponseEntity.ok(availabilities.stream().map(this::convertToDTO).toList());
    }

    // ========== READ BY DOCTOR AND DAY ==========

    @GetMapping("/doctor/{doctorId}/day/{dayOfWeek}")
    public ResponseEntity<List<AvailabilityDTO>> getAvailabilitiesByDoctorAndDay(
            @PathVariable String doctorId,
            @PathVariable DayOfWeek dayOfWeek) {
        List<Availability> availabilities = availabilityService.getAvailabilitiesByDoctorAndDay(doctorId, dayOfWeek);
        return ResponseEntity.ok(availabilities.stream().map(this::convertToDTO).toList());
    }

    // ========== READ VALID FOR DATE ==========

    @GetMapping("/doctor/{doctorId}/valid")
    public ResponseEntity<List<AvailabilityDTO>> getValidAvailabilitiesForDate(
            @PathVariable String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Availability> availabilities = availabilityService.getValidAvailabilitiesForDate(doctorId, date);
        return ResponseEntity.ok(availabilities.stream().map(this::convertToDTO).toList());
    }

    // ========== READ BLOCKED SLOTS ==========

    @GetMapping("/doctor/{doctorId}/blocked")
    public ResponseEntity<List<AvailabilityDTO>> getBlockedSlots(@PathVariable String doctorId) {
        List<Availability> blockedSlots = availabilityService.getBlockedSlots(doctorId);
        return ResponseEntity.ok(blockedSlots.stream().map(this::convertToDTO).toList());
    }

    // ========== READ BY RECURRENCE ==========

    @GetMapping("/recurrence/{recurrence}")
    public ResponseEntity<List<AvailabilityDTO>> getAvailabilitiesByRecurrence(@PathVariable String recurrence) {
        List<Availability> availabilities = availabilityService.getAvailabilitiesByRecurrence(recurrence);
        return ResponseEntity.ok(availabilities.stream().map(this::convertToDTO).toList());
    }

    // ========== READ BY DOCTOR AND PERIOD ==========

    @GetMapping("/doctor/{doctorId}/period")
    public ResponseEntity<List<AvailabilityDTO>> getAvailabilitiesByDoctorAndPeriod(
            @PathVariable String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<Availability> availabilities = availabilityService.getAvailabilitiesByDoctorAndPeriod(doctorId, from, to);
        return ResponseEntity.ok(availabilities.stream().map(this::convertToDTO).toList());
    }

    // ========== UPDATE ==========

    @PutMapping("/{id}")
    public ResponseEntity<AvailabilityDTO> updateAvailability(
            @PathVariable String id,
            @Valid @RequestBody UpdateAvailabilityRequest request) {
        Availability availability = new Availability();
        availability.setDayOfWeek(request.getDayOfWeek());
        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());
        availability.setValidFrom(request.getValidFrom());
        availability.setValidTo(request.getValidTo());
        availability.setRecurrence(request.getRecurrence());
        if (request.getIsBlocked() != null) {
            availability.setBlocked(request.getIsBlocked());
        }
        availability.setBlockReason(request.getBlockReason());

        Availability updatedAvailability = availabilityService.updateAvailability(id, availability);
        return ResponseEntity.ok(convertToDTO(updatedAvailability));
    }

    // ========== BLOCK SLOT ==========

    @PatchMapping("/{id}/block")
    public ResponseEntity<AvailabilityDTO> blockSlot(
            @PathVariable String id,
            @RequestParam String reason) {
        Availability blockedAvailability = availabilityService.blockSlot(id, reason);
        return ResponseEntity.ok(convertToDTO(blockedAvailability));
    }

    // ========== UNBLOCK SLOT ==========

    @PatchMapping("/{id}/unblock")
    public ResponseEntity<AvailabilityDTO> unblockSlot(@PathVariable String id) {
        Availability unblockedAvailability = availabilityService.unblockSlot(id);
        return ResponseEntity.ok(convertToDTO(unblockedAvailability));
    }

    // ========== EXTEND VALIDITY ==========

    @PatchMapping("/{id}/extend")
    public ResponseEntity<AvailabilityDTO> extendValidity(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate newValidTo) {
        Availability extendedAvailability = availabilityService.extendValidity(id, newValidTo);
        return ResponseEntity.ok(convertToDTO(extendedAvailability));
    }

    // ========== CHECK SLOT AVAILABILITY ==========

    @GetMapping("/check")
    public ResponseEntity<Boolean> checkSlotAvailability(
            @RequestParam String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String time) {
        LocalTime slotTime = LocalTime.parse(time);
        boolean isAvailable = availabilityService.isSlotAvailable(doctorId, date, slotTime);
        return ResponseEntity.ok(isAvailable);
    }

    // ========== GET AVAILABLE TIME SLOTS ==========

    @GetMapping("/available-slots")
    public ResponseEntity<List<LocalTime>> getAvailableTimeSlots(
            @RequestParam String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam int durationMinutes) {
        List<LocalTime> availableSlots = availabilityService.getAvailableTimeSlots(doctorId, date, durationMinutes);
        return ResponseEntity.ok(availableSlots);
    }

    // ========== DELETE ==========

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAvailability(@PathVariable String id) {
        availabilityService.deleteAvailability(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/doctor/{doctorId}")
    public ResponseEntity<Void> deleteAvailabilitiesByDoctor(@PathVariable String doctorId) {
        availabilityService.deleteAvailabilitiesByDoctor(doctorId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/expired")
    public ResponseEntity<Void> deleteExpiredAvailabilities(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        availabilityService.deleteExpiredAvailabilities(date);
        return ResponseEntity.noContent().build();
    }

    private AvailabilityDTO convertToDTO(Availability availability) {
        AvailabilityDTO dto = new AvailabilityDTO();
        dto.setAvailabilityId(availability.getAvailabilityId());
        dto.setDoctorId(availability.getDoctorId());
        dto.setDayOfWeek(availability.getDayOfWeek());
        dto.setStartTime(availability.getStartTime());
        dto.setEndTime(availability.getEndTime());
        dto.setValidFrom(availability.getValidFrom());
        dto.setValidTo(availability.getValidTo());
        dto.setRecurrence(availability.getRecurrence());
        dto.setBlocked(availability.isBlocked());
        dto.setBlockReason(availability.getBlockReason());

        if (availability.getDoctorId() != null) {
            try {
                UserDto doctor = userDirectoryService.getRequiredDoctor(availability.getDoctorId());
                dto.setDoctorName(doctor.getName());
            } catch (RuntimeException ignored) {
                dto.setDoctorName(null);
            }
        }

        return dto;
    }

    private Availability toAvailability(CreateAvailabilityRequest request) {
        Availability availability = new Availability();
        availability.setDoctorId(request.getDoctorId());
        availability.setDayOfWeek(request.getDayOfWeek());
        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());
        availability.setValidFrom(request.getValidFrom());
        availability.setValidTo(request.getValidTo());
        availability.setRecurrence(request.getRecurrence());
        availability.setBlocked(request.isBlocked());
        availability.setBlockReason(request.getBlockReason());
        return availability;
    }
}
