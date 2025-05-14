package com.servicemanagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow all origins during development
        config.addAllowedOrigin("*");

        // Or be more specific and only allow your frontend origin:
        // config.addAllowedOrigin("http://localhost:3000");
        // config.addAllowedOrigin("http://localhost:5173");

        // Allow common HTTP methods
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("OPTIONS");

        // Allow common headers
        config.addAllowedHeader("Authorization");
        config.addAllowedHeader("Content-Type");
        config.addAllowedHeader("X-Requested-With");
        config.addAllowedHeader("X-Contractor-ID");
        config.addAllowedHeader("X-Contractor-Name");
        config.addAllowedHeader("X-Contractor-Email");

        // Allow cookies to be sent
        config.setAllowCredentials(false);

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}