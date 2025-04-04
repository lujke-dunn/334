package com.petapp.backend.util;

import com.petapp.backend.model.userModel;
import com.petapp.backend.model.Role;
import com.petapp.backend.repository.userRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MockUserLoader implements CommandLineRunner {

    private final userRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            for (int i = 1; i <= 100; i++) {
                Role role = (i % 2 == 0) ? Role.CUSTOMER : Role.CONTRACTOR;
                userRepository.save(userModel.builder()
                .email("User" + i + "@example.com")
                .password(passwordEncoder.encode("User" + i))
                .name("User" + i)
                .location("City" + i)
                .role(role)
                .build());
        }
        System.out.println("✅ Loaded 100 mock users into the database.");
    }
    }
}