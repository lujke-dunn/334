package com.petapp.backend.controller;

import java.util.HashMap;
import java.util.UUID;
import java.util.Map;

import com.petapp.backend.model.userModel;
import com.petapp.backend.repository.userRepository;
import com.petapp.backend.util.jwtUtil;
import com.petapp.backend.dto.signup;
import com.petapp.backend.dto.login;
import com.petapp.backend.dto.changePassword;
import com.petapp.backend.dto.RefreshToken;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final userRepository userRepository;
    private final jwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public Map<String, String> signup(@RequestBody signup request) {
        userModel user = userModel.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .name(request.getName())
            .location(request.getLocation())
            .role(request.getRole())
            .build();

        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User registered successfully");
        return response;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody login request) {
        userModel user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String accessToken = jwtUtil.generateToken(user.getEmail());
        String refreshToken = UUID.randomUUID().toString();

        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);
        tokens.put("role", user.getRole().toString());
        return tokens;
    }

    @PostMapping("/refresh")
    public Map<String, String> refreshToken(@RequestBody RefreshToken request) {
        userModel user = userRepository.findByRefreshToken(request.getRefreshToken()).orElseThrow();
        String newAccessToken = jwtUtil.refreshToken(user.getEmail());

        Map<String, String> response = new HashMap<>();
        response.put("accessToken", newAccessToken);
        response.put("role", user.getRole().toString());
        return response;
    }

    @PostMapping("/change-password")
    public Map<String, String> changePassword(@RequestBody changePassword request) {
        userModel user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Password changed successfully");
        return response;
    }
}
