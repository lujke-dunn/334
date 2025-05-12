package com.example.bookingservice.model;

public enum DisputeStatus {
    REPORTED,                // Dispute has been reported
    UNDER_REVIEW,           // Admin is reviewing the dispute
    RESOLVED_FOR_CUSTOMER,  // Resolved in customer's favor
    RESOLVED_FOR_CONTRACTOR, // Resolved in contractor's favor
    CLOSED                  // Closed without specific resolution
}