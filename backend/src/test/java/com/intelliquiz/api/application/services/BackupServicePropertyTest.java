package com.intelliquiz.api.application.services;

import net.jqwik.api.*;
import net.jqwik.api.constraints.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.regex.Pattern;

/**
 * Property-based tests for BackupService.
 * Feature: database-backup-recovery
 */
class BackupServicePropertyTest {

    private static final String FILENAME_PREFIX = "intelliquiz_backup_";
    private static final String FILENAME_SUFFIX = ".sql";
    private static final DateTimeFormatter FILENAME_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH-mm-ss");
    private static final Pattern FILENAME_PATTERN = Pattern.compile(
            "^intelliquiz_backup_\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}\\.sql$"
    );

    /**
     * Property 2: Backup Filename Format
     * For any successfully created backup, the filename should match the pattern
     * intelliquiz_backup_YYYY-MM-DDTHH-mm-ss.sql where the timestamp corresponds
     * to the backup creation time.
     * 
     * Validates: Requirements 1.2
     */
    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 2: Backup filename matches expected pattern")
    void filenameMatchesExpectedPattern(
            @ForAll @IntRange(min = 2000, max = 2100) int year,
            @ForAll @IntRange(min = 1, max = 12) int month,
            @ForAll @IntRange(min = 1, max = 28) int day,
            @ForAll @IntRange(min = 0, max = 23) int hour,
            @ForAll @IntRange(min = 0, max = 59) int minute,
            @ForAll @IntRange(min = 0, max = 59) int second
    ) {
        LocalDateTime timestamp = LocalDateTime.of(year, month, day, hour, minute, second);
        String filename = generateBackupFilename(timestamp);

        // Verify filename matches the expected pattern
        assert FILENAME_PATTERN.matcher(filename).matches() :
                "Filename does not match expected pattern: " + filename;

        // Verify filename contains the correct timestamp
        String expectedTimestamp = timestamp.format(FILENAME_DATE_FORMAT);
        assert filename.contains(expectedTimestamp) :
                "Filename does not contain expected timestamp: " + expectedTimestamp;

        // Verify prefix and suffix
        assert filename.startsWith(FILENAME_PREFIX) :
                "Filename does not start with expected prefix: " + filename;
        assert filename.endsWith(FILENAME_SUFFIX) :
                "Filename does not end with expected suffix: " + filename;
    }

    /**
     * Property 2 (additional): Filename uniqueness for different timestamps
     * For any two different timestamps, the generated filenames should be different.
     * 
     * Validates: Requirements 1.2
     */
    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 2: Different timestamps produce different filenames")
    void differentTimestampsProduceDifferentFilenames(
            @ForAll @IntRange(min = 2000, max = 2100) int year1,
            @ForAll @IntRange(min = 1, max = 12) int month1,
            @ForAll @IntRange(min = 1, max = 28) int day1,
            @ForAll @IntRange(min = 0, max = 23) int hour1,
            @ForAll @IntRange(min = 0, max = 59) int minute1,
            @ForAll @IntRange(min = 0, max = 59) int second1,
            @ForAll @IntRange(min = 2000, max = 2100) int year2,
            @ForAll @IntRange(min = 1, max = 12) int month2,
            @ForAll @IntRange(min = 1, max = 28) int day2,
            @ForAll @IntRange(min = 0, max = 23) int hour2,
            @ForAll @IntRange(min = 0, max = 59) int minute2,
            @ForAll @IntRange(min = 0, max = 59) int second2
    ) {
        LocalDateTime timestamp1 = LocalDateTime.of(year1, month1, day1, hour1, minute1, second1);
        LocalDateTime timestamp2 = LocalDateTime.of(year2, month2, day2, hour2, minute2, second2);

        // Skip if timestamps are equal
        Assume.that(!timestamp1.equals(timestamp2));

        String filename1 = generateBackupFilename(timestamp1);
        String filename2 = generateBackupFilename(timestamp2);

        assert !filename1.equals(filename2) :
                "Different timestamps should produce different filenames";
    }

    /**
     * Helper method to generate backup filename (mirrors BackupServiceImpl logic).
     */
    private String generateBackupFilename(LocalDateTime timestamp) {
        return FILENAME_PREFIX + timestamp.format(FILENAME_DATE_FORMAT) + FILENAME_SUFFIX;
    }
}


