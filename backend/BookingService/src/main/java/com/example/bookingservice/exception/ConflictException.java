package com.example.bookingservice.exception;

public class ConflictException extends BookingException {
    public ConflictException(String message) {
        super(message);
    }
}