package tn.esprit.dailymeservice.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.dailymeservice.Model.DailyTask;

import java.time.LocalDateTime;
import java.util.List;

public interface DailyTaskRepository extends JpaRepository<DailyTask, Long> {

    List<DailyTask> findByPatientId(String patientId);

    @Query("""
        select count(t)
        from DailyTask t
        where t.patientId = :patientId
    """)
    long countActive(@Param("patientId") String patientId);

    @Query("""
        select count(t)
        from DailyTask t
        where t.patientId = :patientId
          and t.completed = true
    """)
    long countCompletedActive(@Param("patientId") String patientId);

    @Query("""
        select count(t)
        from DailyTask t
        where t.patientId = :patientId
          and t.completed = false
          and t.createdAt >= :since
    """)
    long countMissedHistory(@Param("patientId") String patientId,
                            @Param("since") LocalDateTime since);

    @Query("""
        select t.taskType, count(t)
        from DailyTask t
        where t.patientId = :patientId
        group by t.taskType
    """)
    List<Object[]> countByTypeActive(@Param("patientId") String patientId);

    @Query("""
        select t.title, t.notes
        from DailyTask t
        where t.patientId = :patientId
    """)
    List<Object[]> taskTexts(@Param("patientId") String patientId);

    @Query("""
        select function('date', t.createdAt),
               sum(case when t.completed = true then 1 else 0 end),
               count(t)
        from DailyTask t
        where t.patientId = :patientId
          and t.createdAt between :start and :end
        group by function('date', t.createdAt)
        order by function('date', t.createdAt)
    """)
    List<Object[]> completionByDay(@Param("patientId") String patientId,
                                   @Param("start") LocalDateTime start,
                                   @Param("end") LocalDateTime end);
}