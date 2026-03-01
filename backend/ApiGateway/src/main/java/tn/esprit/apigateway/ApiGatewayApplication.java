package tn.esprit.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient


public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("appointment-service", r -> r
                        .path("/EverCare/appointments/**",
                                "/EverCare/availabilities/**",
                                "/EverCare/consultation-types/**",
                                "/EverCare/medicaments/**",
                                "/EverCare/prescriptions/**")
                        .uri("lb://APPOINTMENT-SERVICE"))
                .route("activities-service", r -> r
                        .path("/EverCare/activities/**",
                                "/EverCare/admin/activities/**")
                        .uri("lb://ACTIVITIES-SERVICE"))
                .route("communication-service", r -> r
                        .path("/api/calls/**",
                                "/api/conversations/**")
                        .uri("lb://COMMUNICATION-SERVICE"))
                .route("medical-record-service", r -> r
                        .path("/api/medical-records/**")
                        .uri("lb://MEDICAL-RECORD-SERVICE"))
                .route("notification-service", r -> r
                        .path("/EverCare/api/notifications/**")   // Added route
                        .uri("lb://NOTIFICATION-SERVICE"))
                .build();
    }





}