package com.example.bookingservice.controller;


import com.example.bookingservice.dto.BookingRequest;
import com.example.bookingservice.dto.BookingResponse;
import com.example.bookingservice.dto.UserInfo;
import com.example.bookingservice.exception.BookingException;
import com.example.bookingservice.model.Booking;
import com.example.bookingservice.repository.BookingRepository;
import com.example.bookingservice.security.SecurityService;
import com.example.bookingservice.service.BookingService;
import com.example.bookingservice.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final UserService userService;
    private final SecurityService securityService;
    private final BookingRepository bookingRepository;


    @GetMapping("/debug/auth")
    public ResponseEntity<Map<String, Object>> debugAuth(Principal principal) {
        Map<String, Object> debug = new HashMap<>();

        try {
            String userEmail = principal.getName();
            debug.put("principalEmail", userEmail);
            debug.put("principalClass", principal.getClass().getSimpleName());

            // Test user service lookup
            try {
                Long userId = userService.getUserIdFromEmail(userEmail);
                debug.put("userId", userId);
            } catch (Exception e) {
                debug.put("userIdError", e.getMessage());
            }

            try {
                UserInfo userInfo = userService.getUserByEmail(userEmail);
                debug.put("userInfo", userInfo);
                debug.put("userRole", userInfo.getRole());
            } catch (Exception e) {
                debug.put("userInfoError", e.getMessage());
            }

            try {
                String role = userService.getUserRoleFromEmail(userEmail);
                debug.put("roleFromService", role);
            } catch (Exception e) {
                debug.put("roleError", e.getMessage());
            }

            // Test role checks
            try {
                boolean isCustomer = securityService.isUserCustomer(userEmail);
                boolean isContractor = securityService.isUserContractor(userEmail);
                boolean isAdmin = securityService.isUserAdmin(userEmail);

                debug.put("isCustomer", isCustomer);
                debug.put("isContractor", isContractor);
                debug.put("isAdmin", isAdmin);
            } catch (Exception e) {
                debug.put("roleCheckError", e.getMessage());
            }

            // Test database access if we have a userId
            try {
                Long userId = userService.getUserIdFromEmail(userEmail);
                List<Booking> customerBookings = bookingRepository.findByCustomerId(userId);
                debug.put("customerBookingsCount", customerBookings.size());

                List<Booking> contractorBookings = bookingRepository.findByContractorId(userId);
                debug.put("contractorBookingsCount", contractorBookings.size());
            } catch (Exception e) {
                debug.put("databaseError", e.getMessage());
            }

            debug.put("status", "SUCCESS");

        } catch (Exception e) {
            debug.put("status", "ERROR");
            debug.put("error", e.getMessage());
            debug.put("errorType", e.getClass().getSimpleName());
            debug.put("stackTrace", Arrays.toString(e.getStackTrace()));
        }

        return ResponseEntity.ok(debug);
    }

    // Also add this simple endpoint to bypass role checking
    @GetMapping("/debug/simple")
    public ResponseEntity<Map<String, Object>> debugSimple(Principal principal) {
        Map<String, Object> debug = new HashMap<>();
        debug.put("principalName", principal.getName());
        debug.put("timestamp", LocalDateTime.now());
        debug.put("message", "This endpoint works - authentication is OK");
        return ResponseEntity.ok(debug);
    }


    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            Principal principal) {
        try {
            System.out.println("=== BOOKING REQUEST DEBUG ===");
            System.out.println("ServiceId: " + request.getServiceId());
            System.out.println("ContractorId: " + request.getContractorId());
            System.out.println("StartTime: " + request.getStartTime());
            System.out.println("EndTime: " + request.getEndTime());
            System.out.println("Price: " + request.getPrice());
            System.out.println("Location: " + request.getLocation());
            System.out.println("Notes: " + request.getNotes());
            System.out.println("Principal: " + principal.getName());
            System.out.println("=============================");

            BookingResponse booking = bookingService.createBooking(request, principal.getName());
            return new ResponseEntity<>(booking, HttpStatus.CREATED);
        } catch (EntityNotFoundException e) {
            System.err.println("=== ENTITY NOT FOUND ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            System.err.println("=======================");
            throw e;
        } catch (BookingException e) {
            System.err.println("=== BOOKING EXCEPTION ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            System.err.println("========================");
            throw e;
        } catch (Exception e) {
            System.err.println("=== UNEXPECTED ERROR ===");
            System.err.println("Error type: " + e.getClass().getSimpleName());
            System.err.println("Error message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("========================");
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBooking(
            @PathVariable Long id,
            Principal principal) {
        BookingResponse booking = bookingService.getBookingById(id, principal.getName());
        return ResponseEntity.ok(booking);
    }

    @GetMapping("/customer")
    public ResponseEntity<Page<BookingResponse>> getCurrentCustomerBookings(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "startTime") String sort,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, sortDirection, sort);
        Page<BookingResponse> bookings = bookingService.getBookingsForCustomerEmail(principal.getName(), pageable);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/contractor")
    public ResponseEntity<Page<BookingResponse>> getCurrentContractorBookings(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "startTime") String sort,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, sortDirection, sort);
        Page<BookingResponse> bookings = bookingService.getBookingsForContractorEmail(principal.getName(), pageable);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/customer/{status}")
    public ResponseEntity<List<BookingResponse>> getCustomerBookingsByStatus(
            Principal principal,
            @PathVariable String status) {
        List<BookingResponse> bookings = bookingService.getCustomerBookingsByStatus(principal.getName(), status);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/contractor/{status}")
    public ResponseEntity<List<BookingResponse>> getContractorBookingsByStatus(
            Principal principal,
            @PathVariable String status) {
        List<BookingResponse> bookings = bookingService.getContractorBookingsByStatus(principal.getName(), status);
        return ResponseEntity.ok(bookings);
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<BookingResponse> acceptBooking(@PathVariable Long id, Principal principal) {
        BookingResponse booking = bookingService.acceptBooking(id, principal.getName());
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable Long id,
            @RequestBody Map<String, String> requestBody,
            Principal principal) {
        String reason = requestBody.getOrDefault("reason", "");
        BookingResponse booking = bookingService.rejectBooking(id, reason, principal.getName());
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @RequestBody Map<String, String> requestBody,
            Principal principal) {
        String reason = requestBody.getOrDefault("reason", "");
        BookingResponse booking = bookingService.cancelBooking(id, reason, principal.getName());
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<BookingResponse> completeBooking(
            @PathVariable Long id,
            Principal principal) {
        BookingResponse booking = bookingService.completeBooking(id, principal.getName());
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{id}/start")
    public ResponseEntity<BookingResponse> startService(
            @PathVariable Long id,
            Principal principal) {
        BookingResponse booking = bookingService.startService(id, principal.getName());
        return ResponseEntity.ok(booking);
    }

    @PostMapping("/{id}/no-show")
    public ResponseEntity<BookingResponse> reportNoShow(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> requestBody,
            Principal principal) {
        boolean customerNoShow = requestBody.getOrDefault("customerNoShow", false);
        BookingResponse booking = bookingService.reportNoShow(id, customerNoShow, principal.getName());
        return ResponseEntity.ok(booking);
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<BookingResponse> addReview(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestBody,
            Principal principal) {
        Integer rating = (Integer) requestBody.get("rating");
        String review = (String) requestBody.get("review");
        BookingResponse booking = bookingService.addCustomerReview(id, rating, review, principal.getName());
        return ResponseEntity.ok(booking);
    }

    @PostMapping("/{id}/dispute")
    public ResponseEntity<BookingResponse> reportDispute(
            @PathVariable Long id,
            @RequestBody Map<String, String> requestBody,
            Principal principal) {
        String reason = requestBody.getOrDefault("reason", "");
        BookingResponse booking = bookingService.reportDispute(id, reason, principal.getName());
        return ResponseEntity.ok(booking);
    }

    // Endpoint for admins to get bookings with disputes
    @GetMapping("/disputes")
    public ResponseEntity<List<BookingResponse>> getDisputedBookings(Principal principal) {
        List<BookingResponse> bookings = bookingService.getBookingsWithDisputes(principal.getName());
        return ResponseEntity.ok(bookings);
    }
}