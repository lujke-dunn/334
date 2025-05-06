package com.servicemanagement.service;

import com.servicemanagement.models.ServiceCategory;
import com.servicemanagement.models.ServiceListing;
import com.servicemanagement.models.ServiceStatus;
import com.servicemanagement.repository.ServiceListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ServiceListingService {

    private final ServiceListingRepository serviceListingRepository;

    // Find a service by ID
    public Optional<ServiceListing> findById(Long id) {
        return serviceListingRepository.findById(id);
    }

    // Find active service by ID
    public Optional<ServiceListing> findActiveServiceById(Long id) {
        return serviceListingRepository.findByIdAndStatus(id, ServiceStatus.ACTIVE);
    }

    // Get service by ID or throw exception - reusable helper method
    private ServiceListing getServiceById(Long id) {
        return serviceListingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Service with ID " + id + " not found"));
    }

    // Save a new service listing
    @Transactional
    public ServiceListing save(ServiceListing serviceListing) {
        // Set defaults for new listings
        if (serviceListing.getId() == null) {
            initializeNewService(serviceListing);
        }
        return serviceListingRepository.save(serviceListing);
    }


    private void initializeNewService(ServiceListing service) {
        service.setStatus(ServiceStatus.PENDING);
        service.setCompletedBookings(0);
        service.setReviewCount(0);
        service.setAverageRating(0.0);
        service.setFeatured(false);
    }

    // Update an existing service
    @Transactional
    public ServiceListing update(ServiceListing serviceListing) {
        // Ensure the service exists
        getServiceById(serviceListing.getId());
        return serviceListingRepository.save(serviceListing);
    }

    // Get all services for a contractor
    public List<ServiceListing> getContractorServices(Long contractorId) {
        return serviceListingRepository.findByContractorIDAndStatus(contractorId, ServiceStatus.ACTIVE);
    }

    // Search for services by term
    public Page<ServiceListing> searchServices(String searchTerm, Pageable pageable) {
        return serviceListingRepository.searchByTitleOrDescription(searchTerm, ServiceStatus.ACTIVE, pageable);
    }

    // Get services by category
    public List<ServiceListing> getServicesByCategory(ServiceCategory category) {
        return serviceListingRepository.findByCategoryAndStatus(category, ServiceStatus.ACTIVE);
    }

    // Get services by location
    public Page<ServiceListing> getServicesByLocation(String location, Pageable pageable) {
        return serviceListingRepository.findByLocationContainingIgnoreCaseAndStatus(
                location, ServiceStatus.ACTIVE, pageable);
    }

    // Get services by price range
    public List<ServiceListing> getServicesByPriceRange(BigDecimal min, BigDecimal max) {
        if (min == null) min = BigDecimal.ZERO;
        if (max == null) max = new BigDecimal("999999.99"); // High default value

        if (min.compareTo(max) > 0) {
            throw new IllegalArgumentException("Minimum price cannot be greater than maximum price");
        }

        return serviceListingRepository.findByPriceBetweenAndStatus(min, max, ServiceStatus.ACTIVE);
    }

    // Get featured services
    public List<ServiceListing> getFeaturedServices() {
        return serviceListingRepository.findByFeaturedTrueAndStatus(ServiceStatus.ACTIVE);
    }

    // Get top rated services
    public List<ServiceListing> getTopRatedServices(int limit, int minReviews) {
        if (limit <= 0) limit = 10; // Default limit
        if (minReviews < 0) minReviews = 1; // Default min reviews

        return serviceListingRepository.findTopRatedServices(
            ServiceStatus.ACTIVE, minReviews, Pageable.ofSize(limit));
    }

    // Get services available on specific day
    public List<ServiceListing> getServicesAvailableOnDay(String day) {
        if (day == null || day.trim().isEmpty()) {
            throw new IllegalArgumentException("Day cannot be empty");
        }
        return serviceListingRepository.findByAvailableDay(day.toUpperCase(), ServiceStatus.ACTIVE);
    }

    // Find services within geographic radius
    public List<ServiceListing> getServicesNearby(Double latitude, Double longitude, Integer radiusKm) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude and longitude must be provided");
        }

        if (radiusKm == null || radiusKm <= 0) {
            radiusKm = 10; // Default radius in km
        }

        return serviceListingRepository.findServicesWithinRadius(
                latitude, longitude, radiusKm, ServiceStatus.ACTIVE.toString());
    }

    // Count services by contractor
    public long countContractorServices(Long contractorId) {
        return serviceListingRepository.countByContractorID(contractorId);
    }

    // Check if contractor has active services
    public boolean hasActiveServices(Long contractorId) {
        return serviceListingRepository.existsByContractorIDAndStatus(contractorId, ServiceStatus.ACTIVE);
    }

    // Get services with a specific status
    public List<ServiceListing> getServicesByStatus(ServiceStatus status) {
        return serviceListingRepository.findByStatus(status);
    }

    // Get services pending approval
    public List<ServiceListing> getPendingServices() {
        return getServicesByStatus(ServiceStatus.PENDING);
    }


    @Transactional
    protected ServiceListing updateServiceStatus(Long serviceId, ServiceStatus newStatus) {
        ServiceListing service = getServiceById(serviceId);
        service.setStatus(newStatus);
        return serviceListingRepository.save(service);
    }

    // Approve a pending service
    @Transactional
    public ServiceListing approveService(Long serviceId) {
        ServiceListing service = getServiceById(serviceId);

        if (service.getStatus() != ServiceStatus.PENDING) {
            throw new IllegalStateException("Only pending services can be approved");
        }

        return updateServiceStatus(serviceId, ServiceStatus.ACTIVE);
    }

    // Deactivate a service
    @Transactional
    public ServiceListing deactivateService(Long serviceId) {
        return updateServiceStatus(serviceId, ServiceStatus.INACTIVE);
    }

    // Reactivate a service
    @Transactional
    public ServiceListing reactivateService(Long serviceId) {
        ServiceListing service = getServiceById(serviceId);

        if (service.getStatus() != ServiceStatus.INACTIVE) {
            throw new IllegalStateException("Only inactive services can be reactivated");
        }

        return updateServiceStatus(serviceId, ServiceStatus.ACTIVE);
    }

    // Delete a service (soft delete)
    @Transactional
    public void deleteService(Long serviceId) {
        updateServiceStatus(serviceId, ServiceStatus.DELETED);
    }

    // Update service rating after a review
    @Transactional
    public ServiceListing updateServiceRating(Long serviceId, Integer rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        ServiceListing service = getServiceById(serviceId);
        service.updateRating(rating);
        return serviceListingRepository.save(service);
    }

    // Increment completed bookings for a service
    @Transactional
    public ServiceListing markServiceCompleted(Long serviceId) {
        ServiceListing service = getServiceById(serviceId);
        service.incrementCompletedBookings();
        return serviceListingRepository.save(service);
    }
}