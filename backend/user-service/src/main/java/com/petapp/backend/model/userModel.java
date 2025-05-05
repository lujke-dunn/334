package com.petapp.backend.model;
import jakarta.persistence.*;
import lombok.*;

// This is the User entity that maps to the "user" table in the database.
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class userModel {
    @Id @GeneratedValue
    private Long id; // Primary key, auto-generated

    @Column(unique = true)
    private String email; // User's unique email used for login

    private String password; // Hashed password stored securely

    private String name; // User's full name

    private String location; // City or area of the user

    @Enumerated(EnumType.STRING)
    private Role role; // Role of user: OWNER, PROVIDER, or ADMIN

    @Builder.Default
    private boolean active = true; // Status flag (can be used for banning later)

    private String refreshToken; // Store user's latest refresh token

}
