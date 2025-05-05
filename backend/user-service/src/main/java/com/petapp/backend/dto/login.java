package com.petapp.backend.dto;
import lombok.Data;
// Used to collect login data from the frontend
@Data
public class login {
    private String email;     // User's email
    private String password;  // Password input to validate
}
