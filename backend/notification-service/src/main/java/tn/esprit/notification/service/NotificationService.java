package tn.esprit.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.notification.dto.NotificationRequest;
import tn.esprit.notification.entity.Notification;
import tn.esprit.notification.repository.NotificationRepository;

@Service
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void sendNotification(NotificationRequest request) {
        Notification notification = new Notification();
        notification.setActivityId(request.getActivityId());
        notification.setAction(request.getAction());
        notification.setDetails(request.getDetails());

        notificationRepository.save(notification);
        log.info("Notification saved for activity {} with action {}", request.getActivityId(), request.getAction());
    }
}
