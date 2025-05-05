package com.servicemanagement.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/*
* this entity represents a service which is offered by the contractor.
* these services can be booked by customers
*/
@Entity
@Table(name = "service_listings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer duration_minutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceCategory category;

    private long contractorID;

    @Column(nullable = false)
    private String contractorName;

    @Column(nullable = false)
    private String contractorEmail;

    private String location;
    private Double latitude;
    private Double longitude;
    private Integer serviceRadius; // kms

    // location service type ; at home, at facility, an emergency
    private Boolean inHomeService;
    private Boolean outHomeService;
    private Boolean EmergencyService;

    @ElementCollection
    @CollectionTable(name = "service_listing_availability", joinColumns = @JoinColumn(name = "service_listing_id"))
    private Set<String> availabileDays = new HashSet<>(); // contains, monday tuesday etc

    private String availableHoursStart;
    private String availableHoursEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceStatus status;

    // rating and metrics for a given service
    private Double averageRating;
    private Integer reviewCount;
    private Integer completedBookings;

    private Boolean featured;
    private LocalDateTime featuredUntilDate;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    // methods for extracting availability and adding availability

    public boolean isAvailableOn(String dayOfWeek) {
        return availabileDays.contains(dayOfWeek);
    }

    public void addAvailabilityDay(String dayOfWeek) {
        this.availabileDays.add(dayOfWeek.toUpperCase());
    }

    // methods to update ratings, and increment completed booking counter

    public void updateRating(Integer newRating) {
        if (reviewCount == null) reviewCount = 0;
        if (averageRating == null) averageRating = 0.0;

        double totalRating = averageRating * reviewCount;
        totalRating += newRating;
        reviewCount++;
        averageRating = totalRating / reviewCount;
    }

    public void incrementCompletedBookings() {
        if (this.completedBookings == null)  completedBookings = 0;
        this.completedBookings++;
    }

    // method to check if service is active
    public boolean isActive() {
        return status == ServiceStatus.ACTIVE;
    }





}
