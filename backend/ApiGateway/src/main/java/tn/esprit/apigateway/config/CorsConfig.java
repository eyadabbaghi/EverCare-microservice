package tn.esprit.apigateway.config;

 // Ajuste le package selon ton projet

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();

        // Allow Angular frontend
        corsConfig.setAllowedOrigins(Arrays.asList("http://localhost:4200"));

        // Cache CORS preflight response for 1 hour
        corsConfig.setMaxAge(3600L);

        // Allow HTTP methods needed
        corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Allow all headers (essential for auth and Content-Type)
        corsConfig.setAllowedHeaders(Arrays.asList("*"));

        // Important for browser to accept the response
        corsConfig.setAllowCredentials(true);

        // Expose headers so frontend can access them
        corsConfig.setExposedHeaders(Arrays.asList("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}