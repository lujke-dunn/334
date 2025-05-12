package com.example.bookingservice.service;

import com.example.bookingservice.model.Booking;
import com.example.bookingservice.model.BookingStatus;
import com.example.bookingservice.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduledTasksService {
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    @Value("${booking.reminder.hours:24,2}")
    private String reminderHours;

    @Scheduled(fixedRate = 3600000) // Run every hour
    @Transactional(readOnly = true)
    public void sendUpcomingBookingReminders() {
        LocalDateTime now = LocalDateTime.now();

        // Parse reminder hours from configuration
        List<Integer> hours = Arrays.stream(reminderHours.split(","))
                .map(String::trim)
                .map(Integer::parseInt)
                .collect(Collectors.toList());

        for (Integer hour : hours) {
            LocalDateTime startWindow = now.plusHours(hour - 1);
            LocalDateTime endWindow = now.plusHours(hour);

            List<Booking> bookings = bookingRepository.findByStatusAndStartTimeBetween(
                    BookingStatus.CONFIRMED, startWindow, endWindow);

            for (Booking booking : bookings) {
                long hoursRemaining = ChronoUnit.HOURS.between(now, booking.getStartTime());
                notificationService.notifyUpcomingBooking(booking, hoursRemaining);
            }
        }
    }

    @Scheduled(fixedRate = 3600000) // Run every hour
    @Transactional
    public void checkForMissedCompletions() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cutoff = now.minusHours(2);

        // Find bookings that should have been completed but weren't marked
        List<Booking> missedBookings = bookingRepository.findByStatusAndEndTimeBefore(
                BookingStatus.CONFIRMED, cutoff);

        for (Booking booking : missedBookings) {
            System.out.println("WARNING: Booking #" + booking.getId() +
                    " appears to be missed or not completed. Scheduled end time was: " +
                    booking.getEndTime());

            // Optionally auto-complete these bookings
            // booking.setStatus(BookingStatus.COMPLETED);
            // booking.setActualEndTime(booking.getEndTime());
            // bookingRepository.save(booking);

            // For now, we'll just log them for admin review
        }
    }

    @Scheduled(cron = "0 0 0 * * *") // Run at midnight every day
    @Transactional(readOnly = true)
    public void generateDailyReport() {
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);

        // Get all completed bookings from yesterday
        List<Booking> completedBookings = bookingRepository.findByStatusAndStartTimeBetween(
                BookingStatus.COMPLETED, yesterday, today);

        // Get all cancelled bookings from yesterday
        List<Booking> cancelledBookings = bookingRepository.findByStatusAndStartTimeBetween(
                BookingStatus.CANCELLED, yesterday, today);

        // Get all no-shows from yesterday
        List<Booking> noShowBookings = bookingRepository.findByStatusAndStartTimeBetween(
                BookingStatus.NO_SHOW, yesterday, today);

        // Calculate revenue and other metrics
        double totalRevenue = completedBookings.stream()
                .mapToDouble(b -> b.getPrice().doubleValue())
                .sum();

        double totalCancellationFees = cancelledBookings.stream()
                .filter(b -> b.getCancellationFee() != null)
                .mapToDouble(b -> b.getCancellationFee().doubleValue())
                .sum();

        // Log report - in a real app, this could be stored in a database or sent via email
        System.out.println("=== DAILY REPORT FOR " + yesterday.toLocalDate() + " ===");
        System.out.println("Total completed bookings: " + completedBookings.size());
        System.out.println("Total cancelled bookings: " + cancelledBookings.size());
        System.out.println("Total no-show bookings: " + noShowBookings.size());
        System.out.println("Total revenue: $" + totalRevenue);
        System.out.println("Total cancellation fees: $" + totalCancellationFees);
        System.out.println("====================================");
    }
}