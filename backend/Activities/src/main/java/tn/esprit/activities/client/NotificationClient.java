package tn.esprit.activities.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import tn.esprit.activities.dto.NotificationRequest;

@FeignClient(name = "notification-service", url = "${notification.service.url:http://localhost:8089/EverCare}")
public interface NotificationClient {

    @PostMapping("/api/notifications/send")
    void sendNotification(@RequestBody NotificationRequest request);
}
