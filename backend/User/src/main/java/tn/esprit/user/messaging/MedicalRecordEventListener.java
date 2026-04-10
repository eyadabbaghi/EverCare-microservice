package tn.esprit.user.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MedicalRecordEventListener {

    @RabbitListener(queues = "${app.rabbitmq.medical-record.queue}")
    public void handleMedicalRecordEvent(MedicalRecordEvent event) {
        log.info(
                "Received medical record event {} for patientId {} and recordId {}",
                event.getEventType(),
                event.getPatientId(),
                event.getRecordId()
        );
    }
}
