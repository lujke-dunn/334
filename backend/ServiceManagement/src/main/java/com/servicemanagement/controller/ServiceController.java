package com.servicemanagement.controller;


import com.servicemanagement.dto.request.ServiceListingRequest;
import com.servicemanagement.dto.response.ServiceListingResponse;
import com.servicemanagement.dto.request.ServiceSearchRequest;
import com.servicemanagement.models.ServiceCategory;
import com.servicemanagement.models.ServiceListing;
import com.servicemanagement.models.ServiceStatus;
import com.servicemanagement.service.ServiceListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/services")
public class ServiceController {
    private final ServiceListingService serviceListingService;

    @GetMapping
    public ResponseEntity<List<ServiceListingResponse>> getAllServices() {
        List<ServiceListing> services = serviceListingService.getServicesByStatus(ServiceStatus.ACTIVE);
        List<ServiceListingResponse> response = services.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceListingResponse> getServiceById(@PathVariable Long id) {
        return serviceListingService.findActiveServiceById(id)
                .map(this::convertToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ServiceListingResponse> createService(
            @RequestBody ServiceListingRequest request,
            @RequestHeader("X-Contractor-ID") Long contractorId,
            @RequestHeader("X-Contractor-Name") String contractorName,
            @RequestHeader("X-Contractor-Email") String contractorEmail) {

        ServiceListing service = convertToEntity(request);
        service.setContractorID(contractorId);
        service.setContractorName(contractorName);
        service.setContractorEmail(contractorEmail);

        ServiceListing savedService = serviceListingService.save(service);
        return new ResponseEntity<>(convertToDto(savedService), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceListingResponse> updateService(
            @PathVariable Long id,
            @RequestBody ServiceListingRequest request,
            @RequestHeader("X-Contractor-ID") Long contractorID
    ) {
        Optional<ServiceListing> serviceOpt = serviceListingService.findById(id);
        if (serviceOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ServiceListing service = serviceOpt.get();
        if (service.getContractorID() != (contractorID)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        updateEntityFromDto(service, request);
        ServiceListing updatedService = serviceListingService.update(service);
        return ResponseEntity.ok(convertToDto(updatedService));

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(
            @PathVariable Long id,
            @RequestHeader("X-Contractor-ID") Long contractorId
    ) {
        return serviceListingService.findById(id)
                .map(service -> {
                    if (service.getContractorID() != contractorId) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).<Void>build();
                    }
                    serviceListingService.deleteService(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Search services
    @GetMapping("/search")
    public ResponseEntity<List<ServiceListingResponse>> searchServices(ServiceSearchRequest searchRequest) {
        // Create pageable
        Pageable pageable = PageRequest.of(
                searchRequest.getPage(),
                searchRequest.getPageSize(),
                Sort.Direction.fromString(searchRequest.getSortOrder()),
                searchRequest.getSortBy()
        );

        List<ServiceListing> results;

        // Determine search strategy based on provided parameters
        if (searchRequest.getSearchTerm() != null && !searchRequest.getSearchTerm().isEmpty()) {
            // Search by term
            Page<ServiceListing> resultPage = serviceListingService.searchServices(
                    searchRequest.getSearchTerm(), pageable);
            results = resultPage.getContent();
        } else if (searchRequest.getCategory() != null) {
            // Search by category
            results = serviceListingService.getServicesByCategory(searchRequest.getCategory());
        } else if (searchRequest.getLocation() != null && !searchRequest.getLocation().isEmpty()) {
            // Search by location
            Page<ServiceListing> resultPage = serviceListingService.getServicesByLocation(
                    searchRequest.getLocation(), pageable);
            results = resultPage.getContent();
        } else if (searchRequest.getLatitude() != null && searchRequest.getLongitude() != null) {
            // Search by radius
            results = serviceListingService.getServicesNearby(
                    searchRequest.getLatitude(),
                    searchRequest.getLongitude(),
                    searchRequest.getRadius());
        } else if (searchRequest.getFeaturedOnly()) {
            // Get featured services
            results = serviceListingService.getFeaturedServices();
        } else {
            // Default to all active services
            results = serviceListingService.getServicesByStatus(ServiceStatus.ACTIVE);
        }

        List<ServiceListingResponse> response = results.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // Get services by category
    @GetMapping("/category/{category}")
    public ResponseEntity<List<ServiceListingResponse>> getServicesByCategory(
            @PathVariable ServiceCategory category) {

        List<ServiceListing> services = serviceListingService.getServicesByCategory(category);
        List<ServiceListingResponse> response = services.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // Get featured services
    @GetMapping("/featured")
    public ResponseEntity<List<ServiceListingResponse>> getFeaturedServices() {
        List<ServiceListing> services = serviceListingService.getFeaturedServices();
        List<ServiceListingResponse> response = services.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // Get top rated services
    @GetMapping("/top-rated")
    public ResponseEntity<List<ServiceListingResponse>> getTopRatedServices(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "3") int minReviews) {

        List<ServiceListing> services = serviceListingService.getTopRatedServices(limit, minReviews);
        List<ServiceListingResponse> response = services.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // Get contractor services
    @GetMapping("/contractor/{contractorId}")
    public ResponseEntity<List<ServiceListingResponse>> getContractorServices(
            @PathVariable Long contractorId) {

        List<ServiceListing> services = serviceListingService.getContractorServices(contractorId);
        List<ServiceListingResponse> response = services.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }


    protected ServiceListingResponse convertToDto(ServiceListing service) {
        ServiceListingResponse dto = new ServiceListingResponse();
        dto.setId(service.getId());
        dto.setName(service.getName());
        dto.setTitle(service.getTitle());
        dto.setDescription(service.getDescription());
        dto.setPrice(service.getPrice());
        dto.setDurationMinutes(service.getDurationMinutes());
        dto.setCategory(service.getCategory());
        dto.setContractorID(service.getContractorID());
        dto.setContractorName(service.getContractorName());
        dto.setContractorEmail(service.getContractorEmail());
        dto.setLocation(service.getLocation());
        dto.setInHomeService(service.getInHomeService());
        dto.setOutHomeService(service.getOutHomeService());
        dto.setEmergencyService(service.getEmergencyService());
        dto.setAvailableDays(service.getAvailableDays());
        dto.setAvailableHoursStart(service.getAvailableHoursStart());
        dto.setAvailableHoursEnd(service.getAvailableHoursEnd());
        dto.setStatus(service.getStatus());
        dto.setAverageRating(service.getAverageRating());
        dto.setReviewCount(service.getReviewCount());
        dto.setCompletedBookings(service.getCompletedBookings());
        dto.setFeatured(service.getFeatured());
        dto.setCreatedAt(service.getCreatedAt());
        dto.setUpdatedAt(service.getUpdatedAt());
        return dto;
    }

    protected ServiceListing convertToEntity(ServiceListingRequest dto) {
        ServiceListing service = new ServiceListing();
        service.setName(dto.getName());
        service.setTitle(dto.getTitle());
        service.setDescription(dto.getDescription());
        service.setPrice(dto.getPrice());
        service.setDurationMinutes(dto.getDurationMinutes());
        service.setCategory(dto.getCategory());
        service.setLocation(dto.getLocation());
        service.setLatitude(dto.getLatitude());
        service.setLongitude(dto.getLongitude());
        service.setServiceRadius(dto.getServiceRadius());
        service.setInHomeService(dto.getInHomeService());
        service.setOutHomeService(dto.getOutHomeService());
        service.setEmergencyService(dto.getEmergencyService());

        if (dto.getAvailableDays() != null) {
            dto.getAvailableDays().forEach(service::addAvailabilityDay);
        }

        service.setAvailableHoursStart(dto.getAvailableHoursStart());
        service.setAvailableHoursEnd(dto.getAvailableHoursEnd());
        return service;
    }

    protected void updateEntityFromDto(ServiceListing service, ServiceListingRequest dto) {
        if (dto.getName() != null) service.setName(dto.getName());
        if (dto.getTitle() != null) service.setTitle(dto.getTitle());
        if (dto.getDescription() != null) service.setDescription(dto.getDescription());
        if (dto.getPrice() != null) service.setPrice(dto.getPrice());
        if (dto.getDurationMinutes() != null) service.setDurationMinutes(dto.getDurationMinutes());
        if (dto.getCategory() != null) service.setCategory(dto.getCategory());
        if (dto.getLocation() != null) service.setLocation(dto.getLocation());
        if (dto.getLatitude() != null) service.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) service.setLongitude(dto.getLongitude());
        if (dto.getServiceRadius() != null) service.setServiceRadius(dto.getServiceRadius());
        if (dto.getInHomeService() != null) service.setInHomeService(dto.getInHomeService());
        if (dto.getOutHomeService() != null) service.setOutHomeService(dto.getOutHomeService());
        if (dto.getEmergencyService() != null) service.setEmergencyService(dto.getEmergencyService());

        if (dto.getAvailableDays() != null) {
            service.getAvailableDays().clear();
            dto.getAvailableDays().forEach(service::addAvailabilityDay);
        }

        if (dto.getAvailableHoursStart() != null) service.setAvailableHoursStart(dto.getAvailableHoursStart());
        if (dto.getAvailableHoursEnd() != null) service.setAvailableHoursEnd(dto.getAvailableHoursEnd());
    }



}


