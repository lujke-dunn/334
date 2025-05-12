package com.example.bookingservice.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.util.Properties;

@Configuration
public class DatabaseConfig {

    @Bean
    public DataSource dataSource() {
        final DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.sqlite.JDBC");
        dataSource.setUrl("jdbc:sqlite:booking.db");

        // SQLite configuration properties
        Properties properties = new Properties();
        properties.setProperty("foreign_keys", "true"); // Enable foreign key support
        dataSource.setConnectionProperties(properties);

        return dataSource;
    }

    @Bean
    public CommandLineRunner initDatabase(JdbcTemplate jdbcTemplate) {
        return args -> {
            System.out.println("Initializing Booking Service SQLite database...");

            // For SQLite, enable foreign keys explicitly
            jdbcTemplate.execute("PRAGMA foreign_keys = ON");
        };
    }
}