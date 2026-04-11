package com.example.medicalrecordservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserSummaryDto {

    private String userId;
    private String email;
    private String role;

    @JsonAlias({"verified", "isVerified"})
    private Boolean verified;
}
