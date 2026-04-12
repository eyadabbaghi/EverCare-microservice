package tn.esprit.dailymeservice.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.dailymeservice.Model.DailyTask;

import java.time.LocalDateTime;
import java.util.List;

public interface DailyTaskRepository extends JpaRepository<DailyTask, Long> {

    List<DailyTask> findByPatientIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(String patientId, LocalDateTime since);

    List<DailyTask> findByPatientIdAndCreatedAtLessThanOrderByCreatedAtDesc(String patientId, LocalDateTime before);

    List<DailyTask> findByPatientIdAndCreatedAtBetweenOrderByCreatedAtAsc(String patientId, LocalDateTime start, LocalDateTime end);

    @Query("""
        select count(t)
        from DailyTask t
        where t.patientId = :patientId
          and t.createdAt >= :since
    """)
    long countActive(@Param("patientId") String patientId,
                     @Param("since") LocalDateTime since);

    @Query("""
        select count(t)
        from DailyTask t
        where t.patientId = :patientId
          and t.completed = true
          and t.createdAt >= :since
    """)
    long countCompletedActive(@Param("patientId") String patientId,
                              @Param("since") LocalDateTime since);

    @Query("""
        select count(t)
        from DailyTask t
        where t.patientId = :patientId
          and t.completed = false
          and t.createdAt < :before
    """)
    long countMissedHistory(@Param("patientId") String patientId,
                            @Param("before") LocalDateTime before);

    @Query("""
        select t.taskType, count(t)
        from DailyTask t
        where t.patientId = :patientId
          and t.createdAt >= :since
        group by t.taskType
    """)
    List<Object[]> countByTypeActive(@Param("patientId") String patientId,
                                     @Param("since") LocalDateTime since);

    @Query("""
        select t.title, t.notes
        from DailyTask t
        where t.patientId = :patientId
    """)
    List<Object[]> taskTexts(@Param("patientId") String patientId);

}
