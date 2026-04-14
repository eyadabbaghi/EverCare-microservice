package tn.esprit.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.http.HttpHeaders;
import reactor.core.publisher.Mono;

import java.util.Arrays;

@Configuration
public class CorsConfig {

@Bean
public CorsWebFilter corsWebFilter() {
CorsConfiguration corsConfig = new CorsConfiguration();

corsConfig.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
corsConfig.setMaxAge(3600L);
corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
corsConfig.setAllowedHeaders(Arrays.asList("*"));
corsConfig.setAllowCredentials(true);
corsConfig.setExposedHeaders(Arrays.asList("Authorization"));

UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
source.registerCorsConfiguration("/**", corsConfig);

return new CorsWebFilter(source);
}

@Bean
public GlobalFilter removeCorsHeadersFilter() {
return (exchange, chain) -> {
return chain.filter(exchange).then(Mono.fromRunnable(() -> {
var response = exchange.getResponse();
var headers = response.getHeaders();
headers.remove(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);
headers.remove(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS);
headers.remove(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS);
headers.remove(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS);
headers.remove(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS);
headers.remove(HttpHeaders.ACCESS_CONTROL_MAX_AGE);
}));
};
}
}