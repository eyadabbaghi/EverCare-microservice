package tn.esprit.user.dto;

import lombok.Data;

@Data
public class InternalUserDto {

    private String userId;
    private String email;
    private String role;
    private boolean verified;
}
