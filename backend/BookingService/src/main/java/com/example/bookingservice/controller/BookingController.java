package com.example.bookingservice.controller;

import com.example.bookingservice.dto.BookingRequest;
import com.example.bookingservice.dto.BookingResponse;
import com.example.bookingservice.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            Principal principal) {
        BookingResponse booking = bookingService.createBooking(request, principal.getName());
        return new ResponseEntity<>(booking, HttpStatus.CREATED);
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