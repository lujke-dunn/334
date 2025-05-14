package com.example.bookingservice.service;

import com.example.bookingservice.dto.BookingRequest;
import com.example.bookingservice.dto.BookingResponse;
import com.example.bookingservice.dto.ServiceInfo;
import com.example.bookingservice.dto.UserInfo;
import com.example.bookingservice.exception.BookingException;
import com.example.bookingservice.exception.ConflictException;
import com.example.bookingservice.model.Booking;
import com.example.bookingservice.model.BookingStatus;
import com.example.bookingservice.model.DisputeStatus;
import com.example.bookingservice.model.PaymentStatus;
import com.example.bookingservice.repository.BookingRepository;
import com.example.bookingservice.security.SecurityService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserService userService;
    private final ServiceInfoService serviceInfoService;
    private final SecurityService securityService;
    private final NotificationService notificationService;

    @Transactional
    public BookingResponse createBooking(BookingRequest request, String userEmail) {
        Long customerId = userService.getUserIdFromEmail(userEmail);
        UserInfo customerInfo = userService.getUserByEmail(userEmail);

        // Verify user is a customer
        if (!"CUSTOMER".equalsIgnoreCase(customerInfo.getRole())) {
            throw new AccessDeniedException("Only customers can create bookings");
        }

        // Validate booking times
        validateBookingTimes(request.getStartTime(), request.getEndTime());

        // Check if contractor has conflicting bookings
        boolean hasConflict = bookingRepository.hasConflictingBookings(
                request.getContractorId(),
                request.getStartTime(),
                request.getEndTime()
        );

        if (hasConflict) {
            throw new ConflictException("Contractor is not available during the requested time slot");
        }

        // Get contractor information
        UserInfo contractorInfo = userService.getUserById(request.getContractorId());

        // Verify the user is a contractor
        if (!"CONTRACTOR".equalsIgnoreCase(contractorInfo.getRole())) {
            throw new BookingException("Selected user is not a contractor");
        }

        // Get service information
        ServiceInfo serviceInfo = serviceInfoService.getServiceById(request.getServiceId());

        // Verify service belongs to this contractor
        if (!serviceInfo.getContractorID().equals(request.getContractorId())) {
            throw new BookingException("The selected service does not belong to the selected contractor");
        }

        // Create booking entity
        Booking booking = Booking.builder()
                .customerId(customerId)
                .customerName(customerInfo.getName())
                .customerEmail(customerInfo.getEmail())
                .contractorId(request.getContractorId())
                .contractorName(contractorInfo.getName())
                .contractorEmail(contractorInfo.getEmail())
                .serviceId(request.getServiceId())
                .serviceName(serviceInfo.getName())
                .serviceDescription(serviceInfo.getDescription())
                .serviceCategory(serviceInfo.getCategory())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .location(request.getLocation())
                .price(request.getPrice())
                .notes(request.getNotes())
                .specialRequirements(request.getSpecialRequirements())
                .specialRequirementsAcknowledged(false)
                .status(BookingStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .cancelledByCustomer(false)
                .cancelledByContractor(false)
                .customerNoShow(false)
                .contractorNoShow(false)
                .hasDispute(false)
                .build();

        // Save booking
        Booking savedBooking = bookingRepository.save(booking);

        // Notify contractor of new booking
        notificationService.notifyNewBooking(savedBooking);

        return mapToResponse(savedBooking);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long bookingId, String userEmail) {
        Booking booking = getBookingByIdAndVerifyAccess(bookingId, userEmail);
        return mapToResponse(booking);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getBookingsForCustomerEmail(String email, Pageable pageable) {
        Long customerId = userService.getUserIdFromEmail(email);
        verifyUserIsCustomer(email);

        Page<Booking> bookings = bookingRepository.findByCustomerId(customerId, pageable);
        return bookings.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getBookingsForContractorEmail(String email, Pageable pageable) {
        Long contractorId = userService.getUserIdFromEmail(email);
        verifyUserIsContractor(email);

        Page<Booking> bookings = bookingRepository.findByContractorId(contractorId, pageable);
        return bookings.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getCustomerBookingsByStatus(String email, String statusString) {
        Long customerId = userService.getUserIdFromEmail(email);
        verifyUserIsCustomer(email);

        BookingStatus status = parseBookingStatus(statusString);
        List<Booking> bookings = bookingRepository.findByCustomerIdAndStatus(customerId, status);
        return bookings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getContractorBookingsByStatus(String email, String statusString) {
        Long contractorId = userService.getUserIdFromEmail(email);
        verifyUserIsContractor(email);

        BookingStatus status = parseBookingStatus(statusString);
        List<Booking> bookings = bookingRepository.findByContractorIdAndStatus(contractorId, status);
        return bookings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse acceptBooking(Long bookingId, String contractorEmail) {
        Long contractorId = userService.getUserIdFromEmail(contractorEmail);
        verifyUserIsContractor(contractorEmail);

        Booking booking = getBookingById(bookingId);

        // Verify this booking belongs to the contractor
        if (!booking.getContractorId().equals(contractorId)) {
            throw new AccessDeniedException("You don't have permission to accept this booking");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingException("Only pending bookings can be accepted");
        }

        // Recheck for conflicts (in case new bookings were made meanwhile)
        boolean hasConflict = bookingRepository.hasConflictingBookings(
                booking.getContractorId(),
                booking.getStartTime(),
                booking.getEndTime()
        );

        if (hasConflict) {
            throw new ConflictException("You now have a conflicting booking during this time slot");
        }

        booking.setStatus(BookingStatus.CONFIRMED);

        // Acknowledge special requirements if any
        if (booking.getSpecialRequirements() != null && !booking.getSpecialRequirements().isEmpty()) {
            booking.setSpecialRequirementsAcknowledged(true);
        }

        Booking savedBooking = bookingRepository.save(booking);

        // Notify customer
        notificationService.notifyBookingAccepted(savedBooking);

        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse rejectBooking(Long bookingId, String reason, String contractorEmail) {
        Long contractorId = userService.getUserIdFromEmail(contractorEmail);
        verifyUserIsContractor(contractorEmail);

        Booking booking = getBookingById(bookingId);

        // Verify this booking belongs to the contractor
        if (!booking.getContractorId().equals(contractorId)) {
            throw new AccessDeniedException("You don't have permission to reject this booking");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BookingException("Only pending bookings can be rejected");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledByContractor(true);
        booking.setCancelledByCustomer(false);
        booking.setCancellationReason(reason);
        booking.setCancellationTime(LocalDateTime.now());

        Booking savedBooking = bookingRepository.save(booking);

        // Notify customer
        notificationService.notifyBookingRejected(savedBooking);

        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId, String reason, String userEmail) {
        Long userId = userService.getUserIdFromEmail(userEmail);
        Booking booking = getBookingByIdAndVerifyAccess(bookingId, userEmail);

        boolean isCustomer = booking.getCustomerId().equals(userId);

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BookingException("Only pending or confirmed bookings can be cancelled");
        }

        LocalDateTime now = LocalDateTime.now();

        // Apply cancellation policy for customer cancellations of confirmed bookings
        if (isCustomer && booking.getStatus() == BookingStatus.CONFIRMED) {
            long hoursUntilBooking = ChronoUnit.HOURS.between(now, booking.getStartTime());

            // Apply late cancellation fee if cancelling less than 24 hours before
            if (hoursUntilBooking < 24) {
                // Apply late cancellation fee (50% of booking price)
                booking.setCancellationFee(booking.getPrice().multiply(new BigDecimal("0.5")));
                booking.setCancellationFeePaid(false);
            }
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledByCustomer(isCustomer);
        booking.setCancelledByContractor(!isCustomer);
        booking.setCancellationReason(reason);
        booking.setCancellationTime(now);

        Booking savedBooking = bookingRepository.save(booking);

        // Notify the other party
        if (isCustomer) {
            notificationService.notifyBookingCancelledByCustomer(savedBooking);
        } else {
            notificationService.notifyBookingCancelledByContractor(savedBooking);
        }

        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse startService(Long bookingId, String contractorEmail) {
        Long contractorId = userService.getUserIdFromEmail(contractorEmail);
        verifyUserIsContractor(contractorEmail);

        Booking booking = getBookingById(bookingId);

        // Verify this booking belongs to the contractor
        if (!booking.getContractorId().equals(contractorId)) {
            throw new AccessDeniedException("You don't have permission to start this service");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BookingException("Only confirmed bookings can be started");
        }

        booking.setActualStartTime(LocalDateTime.now());

        Booking savedBooking = bookingRepository.save(booking);

        // Notify customer that service has started
        notificationService.notifyServiceStarted(savedBooking);

        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse completeBooking(Long bookingId, String contractorEmail) {
        Long contractorId = userService.getUserIdFromEmail(contractorEmail);
        verifyUserIsContractor(contractorEmail);

        Booking booking = getBookingById(bookingId);

        // Verify this booking belongs to the contractor
        if (!booking.getContractorId().equals(contractorId)) {
            throw new AccessDeniedException("You don't have permission to complete this booking");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BookingException("Only confirmed bookings can be marked as completed");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setActualEndTime(LocalDateTime.now());

        // If service has no actual start time, set it to the scheduled start time
        if (booking.getActualStartTime() == null) {
            booking.setActualStartTime(booking.getStartTime());
        }

        Booking savedBooking = bookingRepository.save(booking);

        // Notify customer to leave a review
        notificationService.notifyServiceCompleted(savedBooking);

        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse reportNoShow(Long bookingId, boolean customerNoShow, String reporterEmail) {
        Long reporterId = userService.getUserIdFromEmail(reporterEmail);
        Booking booking = getBookingByIdAndVerifyAccess(bookingId, reporterEmail);

        boolean isCustomerReporting = booking.getCustomerId().equals(reporterId);
        boolean isContractorReporting = booking.getContractorId().equals(reporterId);

        if (!isCustomerReporting && !isContractorReporting) {
            throw new AccessDeniedException("You don't have permission to report a no-show for this booking");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BookingException("Only confirmed bookings can be reported as no-show");
        }

        // Validate that customer is reporting contractor no-show or vice versa
        if (isCustomerReporting && customerNoShow) {
            throw new BookingException("Customers cannot report themselves as no-show");
        }

        if (isContractorReporting && !customerNoShow) {
            throw new BookingException("Contractors cannot report themselves as no-show");
        }

        booking.setStatus(BookingStatus.NO_SHOW);
        booking.setCustomerNoShow(customerNoShow);
        booking.setContractorNoShow(!customerNoShow);
        booking.setNoShowReportedBy(reporterId);
        booking.setNoShowReportTime(LocalDateTime.now());

        Booking savedBooking = bookingRepository.save(booking);

        // Notify the other party
        if (customerNoShow) {
            notificationService.notifyCustomerNoShow(savedBooking);
        } else {
            notificationService.notifyContractorNoShow(savedBooking);
        }

        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse addCustomerReview(Long bookingId, Integer rating, String review, String customerEmail) {
        Long customerId = userService.getUserIdFromEmail(customerEmail);
        verifyUserIsCustomer(customerEmail);

        Booking booking = getBookingById(bookingId);

        // Verify this booking belongs to the customer
        if (!booking.getCustomerId().equals(customerId)) {
            throw new AccessDeniedException("You don't have permission to review this booking");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BookingException("Only completed bookings can be reviewed");
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            throw new BookingException("Rating must be between 1 and 5");
        }

        booking.setCustomerRating(rating);
        booking.setCustomerReview(review);
        booking.setReviewDate(LocalDateTime.now());

        Booking savedBooking = bookingRepository.save(booking);

        // Update service rating in the service management service
        serviceInfoService.updateServiceRating(booking.getServiceId(), rating);

        // Notify contractor of new review
        notificationService.notifyNewReview(savedBooking);

        return mapToResponse(savedBooking);
    }

    @Transactional
    public BookingResponse reportDispute(Long bookingId, String reason, String userEmail) {
        Long userId = userService.getUserIdFromEmail(userEmail);
        Booking booking = getBookingByIdAndVerifyAccess(bookingId, userEmail);

        // Cannot report dispute for cancelled bookings
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BookingException("Cannot report dispute for cancelled bookings");
        }

        // Check if dispute already exists
        if (booking.getHasDispute() != null && booking.getHasDispute()) {
            throw new BookingException("A dispute has already been reported for this booking");
        }

        booking.setHasDispute(true);
        booking.setDisputeReason(reason);
        booking.setDisputeReportedBy(userId);
        booking.setDisputeTime(LocalDateTime.now());
        booking.setDisputeStatus(DisputeStatus.REPORTED);

        Booking savedBooking = bookingRepository.save(booking);

        // Notify both parties and admin
        notificationService.notifyDisputeReported(savedBooking);

        return mapToResponse(savedBooking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsWithDisputes(String adminEmail) {
        // Verify user is admin
        if (!securityService.isUserAdmin(adminEmail)) {
            throw new AccessDeniedException("Only administrators can view disputed bookings");
        }

        List<Booking> bookings = bookingRepository.findByHasDisputeTrue();
        return bookings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Helper methods

    private Booking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found with id: " + bookingId));
    }

    private Booking getBookingByIdAndVerifyAccess(Long bookingId, String userEmail) {
        Booking booking = getBookingById(bookingId);
        Long userId = userService.getUserIdFromEmail(userEmail);

        // Check if user is customer or contractor for this booking
        boolean isCustomer = booking.getCustomerId().equals(userId);
        boolean isContractor = booking.getContractorId().equals(userId);
        boolean isAdmin = securityService.isUserAdmin(userEmail);

        if (!isCustomer && !isContractor && !isAdmin) {
            throw new AccessDeniedException("You don't have permission to access this booking");
        }

        return booking;
    }

    private void validateBookingTimes(LocalDateTime startTime, LocalDateTime endTime) {
        LocalDateTime now = LocalDateTime.now();

        // Validate that start time is in the future
        if (startTime.isBefore(now)) {
            throw new BookingException("Booking start time must be in the future");
        }

        // Validate that end time is after start time
        if (endTime.isBefore(startTime) || endTime.isEqual(startTime)) {
            throw new BookingException("Booking end time must be after start time");
        }

        // Validate that the booking is not too short (at least 15 minutes)
        long minutes = ChronoUnit.MINUTES.between(startTime, endTime);
        if (minutes < 15) {
            throw new BookingException("Booking duration must be at least 15 minutes");
        }

        // Validate that the booking is not too far in the future (e.g., max 3 months)
        if (startTime.isAfter(now.plusMonths(3))) {
            throw new BookingException("Bookings can only be made up to 3 months in advance");
        }
    }

    private void verifyUserIsCustomer(String email) {
        if (!securityService.isUserCustomer(email)) {
            throw new AccessDeniedException("This operation requires a customer account");
        }
    }

    private void verifyUserIsContractor(String email) {
        if (!securityService.isUserContractor(email)) {
            throw new AccessDeniedException("This operation requires a contractor account");
        }
    }

    private BookingStatus parseBookingStatus(String statusString) {
        try {
            return BookingStatus.valueOf(statusString.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BookingException("Invalid booking status: " + statusString);
        }
    }

    // Map Entity to DTO
    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .customerId(booking.getCustomerId())
                .customerName(booking.getCustomerName())
                .customerEmail(booking.getCustomerEmail())
                .contractorId(booking.getContractorId())
                .contractorName(booking.getContractorName())
                .contractorEmail(booking.getContractorEmail())
                .serviceId(booking.getServiceId())
                .serviceName(booking.getServiceName())
                .serviceDescription(booking.getServiceDescription())
                .serviceCategory(booking.getServiceCategory())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .actualStartTime(booking.getActualStartTime())
                .actualEndTime(booking.getActualEndTime())
                .location(booking.getLocation())
                .price(booking.getPrice())
                .notes(booking.getNotes())
                .specialRequirements(booking.getSpecialRequirements())
                .status(booking.getStatus())
                .paymentStatus(booking.getPaymentStatus())
                .cancelledByCustomer(booking.getCancelledByCustomer())
                .cancelledByContractor(booking.getCancelledByContractor())
                .cancellationReason(booking.getCancellationReason())
                .cancellationTime(booking.getCancellationTime())
                .cancellationFee(booking.getCancellationFee())
                .customerNoShow(booking.getCustomerNoShow())
                .contractorNoShow(booking.getContractorNoShow())
                .customerRating(booking.getCustomerRating())
                .customerReview(booking.getCustomerReview())
                .reviewDate(booking.getReviewDate())
                .hasDispute(booking.getHasDispute())
                .disputeReason(booking.getDisputeReason())
                .disputeStatus(booking.getDisputeStatus())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}