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
				// User service routes - user-node-service has /EverCare global prefix
				.route("user-service-auth", r -> r
						.path("/EverCare/auth/**")
						.uri("lb://USER-NODE-SERVICE"))
				.route("user-service-users", r -> r
						.path("/EverCare/users/**")
						.uri("lb://USER-NODE-SERVICE"))
				// Appointment service has /EverCare context-path
				.route("appointment-service", r -> r
						.path("/EverCare/appointments/**",
								"/EverCare/availabilities/**",
								"/EverCare/consultation-types/**",
								"/EverCare/medicaments/**",
								"/EverCare/prescriptions/**")
						.uri("lb://APPOINTMENT-SERVICE"))
				// Activities service - needs path rewrite (no EverCare prefix)
				.route("activities-service", r -> r
						.path("/EverCare/activities/**", "/EverCare/admin/activities/**")
						.filters(f -> f.rewritePath("/EverCare/(?<segment>.*)", "/${segment}"))
						.uri("lb://ACTIVITIES-SERVICE"))
				// Notification service - has /api/notifications base path
				.route("notification-service", r -> r
						.path("/EverCare/api/notifications/**")
						.filters(f -> f.rewritePath("/EverCare/api/(?<segment>.*)", "/api/${segment}"))
						.uri("lb://NOTIFICATION-SERVICE"))
				// Communication service routes
				.route("communication-service", r -> r
						.path("/api/calls/**", "/api/conversations/**")
						.uri("lb://COMMUNICATION-SERVICE"))
				.route("medical-record-service", r -> r
						.path("/api/medical-records/**")
						.uri("lb://MEDICAL-RECORD-SERVICE"))
				.route("dailyme-service", r -> r
						.path("/api/daily-entries/**", "/api/dailyme-alerts/**", "/api/daily-tasks/**", "/api/journal/**", "/api/insights")
						.uri("lb://DAILYME-SERVICE"))
				.route("communication-websocket", r -> r
						.path("/ws-chat/**")
						.uri("lb://COMMUNICATION-SERVICE"))
				.route("communication-service-alt", r -> r
						.path("/communication-service/**")
						.filters(f -> f.rewritePath("/communication-service/(?<segment>.*)", "/${segment}"))
						.uri("lb://COMMUNICATION-SERVICE"))
				.build();
	}
}
