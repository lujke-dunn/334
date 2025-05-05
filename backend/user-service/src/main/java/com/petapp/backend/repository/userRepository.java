package com.petapp.backend.repository;


import com.petapp.backend.model.userModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Repository interface for accessing user data from the database
public interface userRepository extends JpaRepository<userModel, Long> {

    // Custom method to find a user by email
    Optional<userModel> findByEmail(String email);
    Optional<userModel> findByRefreshToken(String refreshToken);
}

