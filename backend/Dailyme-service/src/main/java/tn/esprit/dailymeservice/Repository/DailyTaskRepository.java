package tn.esprit.dailymeservice.Repository;

import tn.esprit.dailymeservice.Model.DailyTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DailyTaskRepository extends JpaRepository<DailyTask, Long> {
    List<DailyTask> findByPatientId(String patientId);
}
