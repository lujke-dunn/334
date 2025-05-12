package com.example.bookingservice.service;

import com.example.bookingservice.dto.ServiceInfo;
import com.example.bookingservice.model.ServiceCategory;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

@Service
public class ServiceInfoService {

    private final RestTemplate restTemplate;
    private final String serviceManagementUrl;

    public ServiceInfoService(
            RestTemplate restTemplate,
            @Value("${service.management.url}") String serviceManagementUrl) {
        this.restTemplate = restTemplate;
        this.serviceManagementUrl = serviceManagementUrl;
    }

    public ServiceInfo getServiceById(Long serviceId) {
        try {
            // Make an actual API call to service management microservice
            ResponseEntity<ServiceInfo> response = restTemplate.getForEntity(
                    serviceManagementUrl + "/api/services/" + serviceId,
                    ServiceInfo.class
            );

            if (response.getBody() == null) {
                throw new EntityNotFoundException("Service not found with id: " + serviceId);
            }

            return response.getBody();
        } catch (Exception e) {
            // Log the error
            System.err.println("Error fetching service with ID " + serviceId + ": " + e.getMessage());

            // Fall back to mock data during development if needed
            return createMockService(serviceId);
        }
    }

    public void updateServiceRating(Long serviceId, Integer rating) {
        try {
            // Create request body with the rating
            RatingRequest ratingRequest = new RatingRequest(rating);

            // Make PUT request to update the service rating
            restTemplate.exchange(
                    serviceManagementUrl + "/api/services/" + serviceId + "/rating",
                    HttpMethod.PUT,
                    new HttpEntity<>(ratingRequest),
                    Void.class
            );
        } catch (Exception e) {
            // Log the error
            System.err.println("Error updating service rating for ID " + serviceId + ": " + e.getMessage());
        }
    }

    // Helper class for rating update request
    private static class RatingRequest {
        private final Integer rating;

        public RatingRequest(Integer rating) {
            this.rating = rating;
        }

        public Integer getRating() {
            return rating;
        }
    }

    // Fallback mock service for development/testing
    private ServiceInfo createMockService(Long serviceId) {
        return ServiceInfo.builder()
                .id(serviceId)
                .name("Mock Service " + serviceId)
                .description("Mock service description")
                .category(ServiceCategory.DOG_WALKING)
                .price(new BigDecimal("25.00"))
                .durationMinutes(60)
                .contractorId(1L)
                .contractorName("Mock Contractor")
                .contractorEmail("contractor@example.com")
                .build();
    }
}