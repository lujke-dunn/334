package com.servicemanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class ServiceManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceManagementApplication.class, args);
    }

    /**
     * RestTemplate bean for making HTTP requests to other services
     * (useful for inter-service communication)
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}