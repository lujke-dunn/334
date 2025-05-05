package com.servicemanagement.repository;

// models imports
import com.servicemanagement.models.ServiceCategory;
import com.servicemanagement.models.ServiceListing;
import com.servicemanagement.models.ServiceStatus;

// spring repository
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

//math
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceListingRepository extends JpaRepository<ServiceListing, Long> {
    // find all active service listings by a contractor
    List<ServiceListing> findByContractorIDAndStatus(Long contractorId, ServiceStatus status);

    // find all service listing by service category and status.
    List<ServiceListing> findByCategoryAndStatus(ServiceCategory category, ServiceStatus status);

    // find active services by location with pagination
    Page<ServiceListing> findByLocationContainingIgnoreCaseAndStatus(
            String location, ServiceStatus status, Pageable pageable);

    // find active services within price range
    List<ServiceListing> findByPriceBetweenAndStatus(
            BigDecimal minPrice, BigDecimal maxPrice, ServiceStatus status);

    // search for services by title or description containing the search term
    @Query("SELECT s FROM ServiceListing s WHERE " +
            "(LOWER(s.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(s.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))" +
            "AND s.status = :status")
    Page<ServiceListing> searchByTitleOrDescription(
            @Param("searchTerm") String searchTerm,
            @Param("status") ServiceStatus status,
            Pageable pageable);

    // find active featured services
    List<ServiceListing> findByFeaturedTrueAndStatus(ServiceStatus status);

    // Find top-rated services (with minimum number of reviews).
    @Query("SELECT s FROM ServiceListing s WHERE s.status = :status " +
            "AND s.reviewCount >= :minReviews " +
            "ORDER BY s.averageRating DESC")
    List<ServiceListing> findTopRatedServices(
            @Param("status") ServiceStatus status,
            @Param("minReviews") Integer minReviews,
            Pageable pageable
    );

    // Find services with availability on a specific day.
    @Query("SELECT s FROM ServiceListing s JOIN s.availableDays d " +
            "WHERE d = :day AND s.status = :status")
    List<ServiceListing> findByAvailableDay(
            @Param("day") String day,
            @Param("status") ServiceStatus status
    );

    // find services within a geographical radius
    // using haversine formula
    @Query(value =
            "SELECT * FROM service_listings s " +
                    "WHERE s.status = :status " +
                    "AND (6371 * acos(cos(radians(:latitude)) * cos(radians(s.latitude)) * " +
                    "cos(radians(s.longitude) - radians(:longitude)) + " +
                    "sin(radians(:latitude)) * sin(radians(s.latitude)))) <= :radius",
            nativeQuery = true
    )
    List<ServiceListing> findServicesWithinRadius(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radius") Integer radiusInKm,
            @Param("status") String status
    );

    // Count services by contractor
    long countByContractorID(Long contractorId);

    // find services by id and ensure is active
    Optional<ServiceListing> findByIdAndStatus(Long id, ServiceStatus status);

    // check if contractor has active services
    boolean existsByContractorIDAndStatus(Long contractorId, ServiceStatus status);

    // find services needing approval (if they have a PENDING status)
    List<ServiceListing> findByStatus(ServiceStatus status);
}