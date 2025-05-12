package com.example.bookingservice.config;

import com.example.bookingservice.security.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class RestTemplateConfig {

    private final JwtService jwtService;

    public RestTemplateConfig(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Bean
    @Primary  // This makes it the default RestTemplate to be injected
    public RestTemplate authRestTemplate() {  // Renamed from restTemplate to authRestTemplate
        RestTemplate restTemplate = new RestTemplate();

        // Add interceptor for service-to-service authentication using JWT
        List<ClientHttpRequestInterceptor> interceptors = new ArrayList<>();
        interceptors.add((request, body, execution) -> {
            // Use a service account token for service-to-service communication
            String serviceAccountEmail = "booking-service@petapp.internal";

            // Create and add the JWT token
            String token = jwtService.generateServiceToken(serviceAccountEmail);
            request.getHeaders().setBearerAuth(token);

            return execution.execute(request, body);
        });

        restTemplate.setInterceptors(interceptors);
        return restTemplate;
    }
}