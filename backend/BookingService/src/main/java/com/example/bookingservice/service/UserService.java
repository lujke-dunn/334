package com.example.bookingservice.service;

import com.example.bookingservice.dto.UserInfo;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private final RestTemplate restTemplate;
    private final String userServiceUrl;

    // Mock data for testing - in production, this would be removed
    private final Map<String, UserInfo> mockUsers = new HashMap<>();

    public UserService(
            RestTemplate restTemplate,
            @Value("${service.user-service.url}") String userServiceUrl) {
        this.restTemplate = restTemplate;
        this.userServiceUrl = userServiceUrl;

        // Initialize mock data
        initMockData();
    }

    private void initMockData() {
        // Add mock customers
        mockUsers.put("customer1@example.com",
                UserInfo.builder().id(1L).name("Customer One").email("customer1@example.com").role("CUSTOMER").build());
        mockUsers.put("customer2@example.com",
                UserInfo.builder().id(2L).name("Customer Two").email("customer2@example.com").role("CUSTOMER").build());

        // Add mock contractors
        mockUsers.put("contractor1@example.com",
                UserInfo.builder().id(3L).name("Contractor One").email("contractor1@example.com").role("CONTRACTOR").build());
        mockUsers.put("contractor2@example.com",
                UserInfo.builder().id(4L).name("Contractor Two").email("contractor2@example.com").role("CONTRACTOR").build());

        // Add mock admin
        mockUsers.put("admin@example.com",
                UserInfo.builder().id(5L).name("Admin User").email("admin@example.com").role("ADMIN").build());
    }

    public Long getUserIdFromEmail(String email) {
        try {
            // Call user service to get user ID from email
            ResponseEntity<UserInfo> response = restTemplate.getForEntity(
                    userServiceUrl + "/api/users/by-email?email=" + email,
                    UserInfo.class
            );

            if (response.getBody() == null) {
                throw new EntityNotFoundException("User not found with email: " + email);
            }

            return response.getBody().getId();
        } catch (Exception e) {
            // Log the error
            System.err.println("Error fetching user ID for email " + email + ": " + e.getMessage());

            // Fall back to mock data during development
            UserInfo user = mockUsers.get(email);
            if (user == null) {
                throw new EntityNotFoundException("User not found with email: " + email);
            }
            return user.getId();
        }
    }

    public String getUserRoleFromEmail(String email) {
        try {
            // Call user service to get user role from email
            ResponseEntity<UserInfo> response = restTemplate.getForEntity(
                    userServiceUrl + "/api/users/by-email?email=" + email,
                    UserInfo.class
            );

            if (response.getBody() == null) {
                throw new EntityNotFoundException("User not found with email: " + email);
            }

            return response.getBody().getRole();
        } catch (Exception e) {
            // Log the error
            System.err.println("Error fetching user role for email " + email + ": " + e.getMessage());

            // Fall back to mock data during development
            UserInfo user = mockUsers.get(email);
            if (user == null) {
                return getMockUserRole(email);
            }
            return user.getRole();
        }
    }

    public UserInfo getUserById(Long userId) {
        try {
            // Call user service to get user by ID
            ResponseEntity<UserInfo> response = restTemplate.getForEntity(
                    userServiceUrl + "/api/users/" + userId,
                    UserInfo.class
            );

            if (response.getBody() == null) {
                throw new EntityNotFoundException("User not found with id: " + userId);
            }

            return response.getBody();
        } catch (Exception e) {
            // Log the error
            System.err.println("Error fetching user with ID " + userId + ": " + e.getMessage());

            // Fall back to mock data during development
            for (UserInfo user : mockUsers.values()) {
                if (user.getId().equals(userId)) {
                    return user;
                }
            }
            return createMockUser(userId);
        }
    }

    public UserInfo getUserByEmail(String email) {
        try {
            // Call user service to get user by email
            ResponseEntity<UserInfo> response = restTemplate.getForEntity(
                    userServiceUrl + "/api/users/by-email?email=" + email,
                    UserInfo.class
            );

            if (response.getBody() == null) {
                throw new EntityNotFoundException("User not found with email: " + email);
            }

            return response.getBody();
        } catch (Exception e) {
            // Log the error
            System.err.println("Error fetching user with email " + email + ": " + e.getMessage());

            // Fall back to mock data during development
            UserInfo user = mockUsers.get(email);
            if (user != null) {
                return user;
            }

            Long mockId = getMockUserId(email);
            return createMockUser(mockId);
        }
    }

    public List<SimpleGrantedAuthority> getUserAuthorities(String email) {
        try {
            // Call user service to get user's authorities
            String role = getUserRoleFromEmail(email);
            return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
        } catch (Exception e) {
            // Log the error
            System.err.println("Error fetching authorities for email " + email + ": " + e.getMessage());

            // Fall back to basic user role during development
            return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
        }
    }

    public List<UserInfo> getAllContractors() {
        try {
            // Call user service to get all contractors
            ResponseEntity<UserInfo[]> response = restTemplate.getForEntity(
                    userServiceUrl + "/api/users/contractors",
                    UserInfo[].class
            );

            if (response.getBody() == null) {
                return Collections.emptyList();
            }

            return List.of(response.getBody());
        } catch (Exception e) {
            // Log the error
            System.err.println("Error fetching all contractors: " + e.getMessage());

            // Return mock contractors during development
            return mockUsers.values().stream()
                    .filter(u -> "CONTRACTOR".equals(u.getRole()))
                    .toList();
        }
    }

    public void sendUserNotification(Long userId, String message, String subject) {
        try {
            // Create notification payload
            NotificationRequest notification = new NotificationRequest(userId, subject, message);

            // Send notification to user service
            restTemplate.postForEntity(
                    userServiceUrl + "/api/notifications/send",
                    notification,
                    Void.class
            );
        } catch (Exception e) {
            // Log the error
            System.err.println("Error sending notification to user " + userId + ": " + e.getMessage());
        }
    }

    // Helper class for notification requests
    private static class NotificationRequest {
        private final Long userId;
        private final String subject;
        private final String message;

        public NotificationRequest(Long userId, String subject, String message) {
            this.userId = userId;
            this.subject = subject;
            this.message = message;
        }

        public Long getUserId() {
            return userId;
        }

        public String getSubject() {
            return subject;
        }

        public String getMessage() {
            return message;
        }
    }

    // Helper methods for creating mock data during development

    private Long getMockUserId(String email) {
        // Simple deterministic way to generate consistent IDs from emails
        return (long) (email.hashCode() & 0x7fffffff) % 100 + 1;
    }

    private String getMockUserRole(String email) {
        if (email.contains("contractor")) {
            return "CONTRACTOR";
        } else if (email.contains("admin")) {
            return "ADMIN";
        } else {
            return "CUSTOMER";
        }
    }

    private UserInfo createMockUser(Long userId) {
        String role = userId % 2 == 0 ? "CUSTOMER" : "CONTRACTOR";
        String namePrefix = role.equals("CUSTOMER") ? "Customer" : "Contractor";

        return UserInfo.builder()
                .id(userId)
                .name(namePrefix + " " + userId)
                .email(namePrefix.toLowerCase() + userId + "@example.com")
                .role(role)
                .location("Mock Location")
                .build();
    }
}