package com.petapp.backend.dto;
import lombok.Data;
@Data
public class changePassword {
    private String email;
    private String oldPassword;
    private String newPassword;
}

