package com.example.medicalrecordservice.client;

import com.example.medicalrecordservice.dto.UserSummaryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service-client", url = "${user.service.url}")
public interface UserServiceClient {

    @GetMapping("/users/external/{userId}")
    UserSummaryDto getUserById(@PathVariable("userId") String userId);
}
