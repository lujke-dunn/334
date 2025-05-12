package com.example.bookingservice.security;

import com.example.bookingservice.repository.BookingRepository;
import com.example.bookingservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service  // This annotation is crucial to register as a Spring bean
@RequiredArgsConstructor
public class SecurityService {
    private final UserService userService;
    private final BookingRepository bookingRepository;

    public boolean isUserAdmin(String email) {
        String role = userService.getUserRoleFromEmail(email);
        return "ADMIN".equalsIgnoreCase(role);
    }

    public boolean isUserCustomer(String email) {
        String role = userService.getUserRoleFromEmail(email);
        return "CUSTOMER".equalsIgnoreCase(role);
    }

    public boolean isUserContractor(String email) {
        String role = userService.getUserRoleFromEmail(email);
        return "CONTRACTOR".equalsIgnoreCase(role);
    }

    public boolean isOwnerOfBooking(Long bookingId, String email) {
        Long userId = userService.getUserIdFromEmail(email);
        return bookingRepository.existsByIdAndCustomerId(bookingId, userId) ||
                bookingRepository.existsByIdAndContractorId(bookingId, userId);
    }

    public boolean isContractorForBooking(Long bookingId, String email) {
        Long contractorId = userService.getUserIdFromEmail(email);
        return bookingRepository.existsByIdAndContractorId(bookingId, contractorId);
    }

    public boolean isCustomerForBooking(Long bookingId, String email) {
        Long customerId = userService.getUserIdFromEmail(email);
        return bookingRepository.existsByIdAndCustomerId(bookingId, customerId);
    }
}