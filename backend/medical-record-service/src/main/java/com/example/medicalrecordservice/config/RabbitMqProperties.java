package com.example.medicalrecordservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rabbitmq.medical-record")
public record RabbitMqProperties(
        String exchange,
        String queue,
        String routingKey
) {
}
