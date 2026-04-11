package tn.esprit.activities.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import tn.esprit.activities.dto.NotificationRequest;  // We'll create this DTO

@FeignClient(name = "notification-service")  // ✅ no path here
public interface NotificationClient {

    @PostMapping("/api/notifications/send")  // ✅ just this
    void sendNotification(@RequestBody NotificationRequest request);
}