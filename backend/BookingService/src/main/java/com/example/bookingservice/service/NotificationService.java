package com.example.bookingservice.service;

import com.example.bookingservice.model.Booking;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {
    // In a real application, this would send actual notifications via email/SMS/push

    public void notifyNewBooking(Booking booking) {
        System.out.println("NOTIFICATION: New booking request #" + booking.getId() +
                " for contractor " + booking.getContractorId() +
                " (" + booking.getContractorEmail() + ")");
        // Send email/push notification to contractor
    }

    public void notifyBookingAccepted(Booking booking) {
        System.out.println("NOTIFICATION: Booking #" + booking.getId() +
                " accepted by contractor " + booking.getContractorId() +
                " for " + booking.getStartTime());
        // Send email/push notification to customer
    }

    public void notifyBookingRejected(Booking booking) {
        System.out.println("NOTIFICATION: Booking #" + booking.getId() +
                " rejected by contractor. Reason: " + booking.getCancellationReason());
        // Send email/push notification to customer
    }

    public void notifyBookingCancelledByCustomer(Booking booking) {
        System.out.println("NOTIFICATION: Booking #" + booking.getId() +
                " cancelled by customer. Reason: " + booking.getCancellationReason());
        // Send email/push notification to contractor
    }

    public void notifyBookingCancelledByContractor(Booking booking) {
        System.out.println("NOTIFICATION: Booking #" + booking.getId() +
                " cancelled by contractor. Reason: " + booking.getCancellationReason());
        // Send email/push notification to customer
    }

    public void notifyServiceStarted(Booking booking) {
        System.out.println("NOTIFICATION: Service for booking #" + booking.getId() +
                " has been started by contractor " + booking.getContractorId());
        // Send email/push notification to customer
    }

    public void notifyServiceCompleted(Booking booking) {
        System.out.println("NOTIFICATION: Service for booking #" + booking.getId() +
                " has been completed. Please leave a review.");
        // Send email/push notification to customer
    }

    public void notifyUpcomingBooking(Booking booking, long hoursRemaining) {
        System.out.println("NOTIFICATION: Reminder - Your booking #" + booking.getId() +
                " is scheduled in " + hoursRemaining + " hours");
        // Send reminder to both parties
    }

    public void notifyCustomerNoShow(Booking booking) {
        System.out.println("NOTIFICATION: Customer no-show reported for booking #" + booking.getId() +
                " by contractor " + booking.getContractorId());
        // Send notification to customer
    }

    public void notifyContractorNoShow(Booking booking) {
        System.out.println("NOTIFICATION: Contractor no-show reported for booking #" + booking.getId() +
                " by customer " + booking.getCustomerId());
        // Send notification to contractor
    }

    public void notifyNewReview(Booking booking) {
        System.out.println("NOTIFICATION: New review received for booking #" + booking.getId() +
                " - Rating: " + booking.getCustomerRating() +
                ", Comment: " + booking.getCustomerReview());
        // Send notification to contractor
    }

    public void notifyDisputeReported(Booking booking) {
        System.out.println("NOTIFICATION: Dispute reported for booking #" + booking.getId() +
                " - Reason: " + booking.getDisputeReason());
        // Send notification to both parties and admin
    }

    public void notifyPaymentProcessed(Booking booking) {
        System.out.println("NOTIFICATION: Payment processed for booking #" + booking.getId() +
                " - Amount: " + booking.getPrice());
        // Send notification to both parties
    }

    public void notifyRefundProcessed(Booking booking) {
        System.out.println("NOTIFICATION: Refund processed for booking #" + booking.getId() +
                " - Amount: " + booking.getPrice());
        // Send notification to customer
    }
}