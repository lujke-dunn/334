package com.example.bookingservice.model;

public enum PaymentStatus {
    PENDING,     // Payment not yet processed
    PAID,        // Payment completed
    REFUNDED,    // Payment was refunded
    FAILED       // Payment processing failed
}