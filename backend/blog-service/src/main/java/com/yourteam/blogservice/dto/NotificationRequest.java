package com.yourteam.blogservice.dto;

import lombok.Data;

@Data
public class NotificationRequest {
    private String activityId;
    private String action;
    private String details;
}