package com.example.bookingservice.model;

public enum BookingStatus {
    PENDING,      // Initial state, awaiting confirmation
    CONFIRMED,    // Booking has been confirmed
    COMPLETED,    // Service has been delivered
    CANCELLED,    // Booking was cancelled
    NO_SHOW       // Customer or Contractor didn't show up
}