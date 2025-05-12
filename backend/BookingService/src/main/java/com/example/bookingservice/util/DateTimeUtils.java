package com.example.bookingservice.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

public class DateTimeUtils {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Format a LocalDateTime for display
     */
    public static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DATE_TIME_FORMATTER);
    }

    /**
     * Parse a string to LocalDateTime
     */
    public static LocalDateTime parseDateTime(String dateTimeString) {
        if (dateTimeString == null || dateTimeString.trim().isEmpty()) {
            return null;
        }
        return LocalDateTime.parse(dateTimeString, DATE_TIME_FORMATTER);
    }

    /**
     * Calculate duration between two times in minutes
     */
    public static long calculateDurationMinutes(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            return 0;
        }
        return ChronoUnit.MINUTES.between(start, end);
    }

    /**
     * Check if a time is within the next N hours
     */
    public static boolean isWithinNextNHours(LocalDateTime time, int hours) {
        if (time == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime futureTime = now.plusHours(hours);

        return time.isAfter(now) && time.isBefore(futureTime);
    }

    /**
     * Get a formatted time range string
     */
    public static String getTimeRangeString(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            return "";
        }

        return start.format(DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a")) +
                " - " +
                end.format(DateTimeFormatter.ofPattern("h:mm a"));
    }
}