package com.petapp.backend.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import com.petapp.backend.model.userModel;
import com.petapp.backend.repository.userRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final userRepository userRepository;

    @GetMapping("/users/by-email")
    public ResponseEntity<Map<String, Object>> getUserByEmail(@RequestParam String email) {
        Optional<userModel> userOpt = userRepository.findByEmail(email);

        return getMapResponseEntity(userOpt);
    }

    private ResponseEntity<Map<String, Object>> getMapResponseEntity(Optional<userModel> userOpt) {
        if (userOpt.isPresent()) {
            userModel user = userOpt.get();
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("location", user.getLocation());
            response.put("role", user.getRole().toString());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        Optional<userModel> userOpt = userRepository.findById(id);

        return getMapResponseEntity(userOpt);
    }
}