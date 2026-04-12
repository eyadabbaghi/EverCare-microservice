package tn.esprit.dailymeservice.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.dailymeservice.Dto.UserServiceUserDto;

@Service
@RequiredArgsConstructor
public class UserServiceBridge {

    private static final String USER_BY_EMAIL_URL =
            "http://USER-SERVICE/EverCare/users/by-email?email={email}";

    private final RestTemplate restTemplate;

    public UserServiceUserDto getUserByEmail(String email, String authorizationHeader) {
        HttpHeaders headers = new HttpHeaders();
        if (authorizationHeader != null && !authorizationHeader.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
        }

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<UserServiceUserDto> response = restTemplate.exchange(
                    USER_BY_EMAIL_URL,
                    HttpMethod.GET,
                    requestEntity,
                    UserServiceUserDto.class,
                    email
            );

            if (response.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }

            return response.getBody();
        } catch (HttpStatusCodeException ex) {
            throw new ResponseStatusException(
                    HttpStatus.valueOf(ex.getStatusCode().value()),
                    ex.getResponseBodyAsString(),
                    ex
            );
        } catch (RestClientException ex) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "USER-SERVICE is unavailable",
                    ex
            );
        }
    }
}
