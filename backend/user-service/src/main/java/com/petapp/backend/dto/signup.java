package com.petapp.backend.dto;
import com.petapp.backend.model.Role;
import lombok.Data;
// Used to collect data from the frontend when a user signs up
@Data
public class signup {
    private String email;     // User's email
    private String password;  // Raw password to be hashed
    private String name;      // User's name
    private String location;  // City or location
    private Role role;        // Selected role at signup
}

