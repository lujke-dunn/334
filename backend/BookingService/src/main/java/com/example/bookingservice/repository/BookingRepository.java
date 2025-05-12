package com.example.bookingservice.repository;

import com.example.bookingservice.model.Booking;
import com.example.bookingservice.model.BookingStatus;
import com.example.bookingservice.model.DisputeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Find bookings by customer
    List<Booking> findByCustomerId(Long customerId);

    // Find bookings by customer with pagination
    Page<Booking> findByCustomerId(Long customerId, Pageable pageable);

    // Find bookings by contractor
    List<Booking> findByContractorId(Long contractorId);

    // Find bookings by contractor with pagination
    Page<Booking> findByContractorId(Long contractorId, Pageable pageable);

    // Find bookings by service
    List<Booking> findByServiceId(Long serviceId);

    // Find bookings by status
    List<Booking> findByStatus(BookingStatus status);

    // Find customer's bookings by status
    List<Booking> findByCustomerIdAndStatus(Long customerId, BookingStatus status);

    // Find contractor's bookings by status
    List<Booking> findByContractorIdAndStatus(Long contractorId, BookingStatus status);

    // Security checks
    boolean existsByIdAndContractorId(Long id, Long contractorId);
    boolean existsByIdAndCustomerId(Long id, Long customerId);

    // Find upcoming bookings for a customer (confirmed and not yet started)
    @Query("SELECT b FROM Booking b WHERE b.customerId = :customerId " +
            "AND b.status = 'CONFIRMED' AND b.startTime > :now")
    List<Booking> findUpcomingBookingsForCustomer(
            @Param("customerId") Long customerId,
            @Param("now") LocalDateTime now);

    // Find upcoming bookings for a contractor
    @Query("SELECT b FROM Booking b WHERE b.contractorId = :contractorId " +
            "AND b.status = 'CONFIRMED' AND b.startTime > :now")
    List<Booking> findUpcomingBookingsForContractor(
            @Param("contractorId") Long contractorId,
            @Param("now") LocalDateTime now);

    // Check if contractor has conflicting bookings
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE " +
            "b.contractorId = :contractorId AND " +
            "b.status = 'CONFIRMED' AND " +
            "((b.startTime BETWEEN :startTime AND :endTime) OR " +
            "(b.endTime BETWEEN :startTime AND :endTime) OR " +
            "(:startTime BETWEEN b.startTime AND b.endTime))")
    boolean hasConflictingBookings(
            @Param("contractorId") Long contractorId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    // Find bookings with disputes
    List<Booking> findByHasDisputeTrue();

    // Find bookings with disputes by status
    List<Booking> findByHasDisputeTrueAndDisputeStatus(DisputeStatus disputeStatus);

    // Find bookings by status and scheduled time
    List<Booking> findByStatusAndStartTimeBetween(
            BookingStatus status,
            LocalDateTime startTime,
            LocalDateTime endTime);

    // Find bookings that should have ended but still have status CONFIRMED
    List<Booking> findByStatusAndEndTimeBefore(
            BookingStatus status,
            LocalDateTime cutoffTime);

    // Find all upcoming bookings for a specific contractor within a date range
    @Query("SELECT b FROM Booking b WHERE " +
            "b.contractorId = :contractorId AND " +
            "b.status = 'CONFIRMED' AND " +
            "b.startTime BETWEEN :startDate AND :endDate " +
            "ORDER BY b.startTime ASC")
    List<Booking> findUpcomingBookingsInDateRange(
            @Param("contractorId") Long contractorId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Count bookings by status for a customer
    long countByCustomerIdAndStatus(Long customerId, BookingStatus status);

    // Count bookings by status for a contractor
    long countByContractorIdAndStatus(Long contractorId, BookingStatus status);
}