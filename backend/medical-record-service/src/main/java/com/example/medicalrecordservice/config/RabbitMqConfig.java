package com.example.medicalrecordservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(RabbitMqProperties.class)
public class RabbitMqConfig {

    @Bean
    Queue medicalRecordQueue(RabbitMqProperties properties) {
        return new Queue(properties.queue(), true);
    }

    @Bean
    TopicExchange medicalRecordExchange(RabbitMqProperties properties) {
        return new TopicExchange(properties.exchange(), true, false);
    }

    @Bean
    Binding medicalRecordBinding(Queue medicalRecordQueue, TopicExchange medicalRecordExchange, RabbitMqProperties properties) {
        return BindingBuilder.bind(medicalRecordQueue)
                .to(medicalRecordExchange)
                .with(properties.routingKey());
    }

    @Bean
    Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, Jackson2JsonMessageConverter messageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter);
        return rabbitTemplate;
    }
}
