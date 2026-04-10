package com.example.medicalrecordservice.client;

import com.example.medicalrecordservice.dto.UserSummaryDto;
import com.example.medicalrecordservice.exception.BadRequestException;
import com.example.medicalrecordservice.exception.IntegrationException;
import com.example.medicalrecordservice.exception.NotFoundException;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserServiceGateway {

    private final UserServiceClient userServiceClient;

    public UserSummaryDto getRequiredPatient(String patientId) {
        try {
            UserSummaryDto user = userServiceClient.getUserById(patientId);
            if (user == null) {
                throw new NotFoundException("Patient not found in User service");
            }
            if (!"PATIENT".equalsIgnoreCase(user.getRole())) {
                throw new BadRequestException("The linked user must have PATIENT role");
            }
            return user;
        } catch (FeignException.NotFound ex) {
            throw new NotFoundException("Patient not found in User service");
        } catch (FeignException.Forbidden | FeignException.Unauthorized ex) {
            throw new IntegrationException("Medical-record-service is not authorized to call User service");
        } catch (FeignException ex) {
            throw new IntegrationException("Unable to reach User service");
        }
    }
}
