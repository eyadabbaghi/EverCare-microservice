package tn.esprit.dailymeservice.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.dailymeservice.Dto.DailyTaskDTO;
import tn.esprit.dailymeservice.Model.DailyTask;
import tn.esprit.dailymeservice.Repository.DailyTaskRepository;

import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyTaskService {

    private final DailyTaskRepository dailyTaskRepository;

    private static final DateTimeFormatter F24 = DateTimeFormatter.ofPattern("HH:mm");
    private static final long HISTORY_CUTOFF_HOURS = 24;

    private LocalTime parseTime(String s) {
        if (s == null || s.trim().isEmpty()) return null;
        if (s.matches("^\\d{2}:\\d{2}:\\d{2}$")) s = s.substring(0, 5);
        return LocalTime.parse(s, F24);
    }

    @Transactional
    public DailyTaskDTO createTask(DailyTaskDTO dto) {
        DailyTask task = mapToEntity(dto);
        DailyTask saved = dailyTaskRepository.save(task);
        return mapToDTO(saved);
    }

    public List<DailyTaskDTO> getTasksByPatientId(String patientId) {
        return dailyTaskRepository.findByPatientIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
                        patientId,
                        historyCutoff()
                )
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<DailyTaskDTO> getHistoryByPatientId(String patientId) {
        return dailyTaskRepository.findByPatientIdAndCreatedAtLessThanOrderByCreatedAtDesc(
                        patientId,
                        historyCutoff()
                )
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public DailyTaskDTO updateTask(Long id, DailyTaskDTO dto) {
        DailyTask task = dailyTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setTitle(dto.getTitle());
        task.setTaskType(dto.getTaskType());
        task.setScheduledTime(parseTime(dto.getScheduledTime()));
        task.setNotes(dto.getNotes());

        DailyTask saved = dailyTaskRepository.save(task);
        return mapToDTO(saved);
    }

    @Transactional
    public DailyTaskDTO setCompleted(Long id, boolean completed) {
        DailyTask task = dailyTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setCompleted(completed);
        DailyTask saved = dailyTaskRepository.save(task);
        return mapToDTO(saved);
    }

    @Transactional
    public void deleteTask(Long id) {
        dailyTaskRepository.deleteById(id);
    }

    @Transactional
    public void archiveExpiredTasks() {
        // Temporary implementation
        // Add your archive logic here later
        List<DailyTask> tasks = dailyTaskRepository.findAll();

        for (DailyTask task : tasks) {
            if (!task.isCompleted()) {
                task.setCompleted(true);
            }
        }

        dailyTaskRepository.saveAll(tasks);
    }

    private DailyTask mapToEntity(DailyTaskDTO dto) {
        DailyTask task = new DailyTask();
        task.setPatientId(dto.getPatientId());
        task.setTitle(dto.getTitle());
        task.setTaskType(dto.getTaskType());
        task.setScheduledTime(parseTime(dto.getScheduledTime()));
        task.setCompleted(dto.isCompleted());
        task.setNotes(dto.getNotes());
        return task;
    }

    private DailyTaskDTO mapToDTO(DailyTask entity) {
        DailyTaskDTO dto = new DailyTaskDTO();
        dto.setId(entity.getId());
        dto.setPatientId(entity.getPatientId());
        dto.setTitle(entity.getTitle());
        dto.setTaskType(entity.getTaskType());
        dto.setScheduledTime(entity.getScheduledTime() == null ? null : entity.getScheduledTime().format(F24));
        dto.setCompleted(entity.isCompleted());
        dto.setNotes(entity.getNotes());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setCompletedAt(entity.getCompletedAt());
        boolean archived = entity.getCreatedAt() != null && entity.getCreatedAt().isBefore(historyCutoff());
        dto.setArchived(archived);
        dto.setArchivedAt(archived ? (entity.getUpdatedAt() != null ? entity.getUpdatedAt() : entity.getCreatedAt()) : null);
        return dto;
    }

    private LocalDateTime historyCutoff() {
        return LocalDateTime.now().minusHours(HISTORY_CUTOFF_HOURS);
    }
}
