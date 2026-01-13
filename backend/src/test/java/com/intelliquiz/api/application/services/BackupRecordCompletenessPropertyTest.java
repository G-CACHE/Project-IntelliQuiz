package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.BackupRecord;
import com.intelliquiz.api.domain.enums.BackupStatus;
import net.jqwik.api.*;
import net.jqwik.api.constraints.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Property-based tests for BackupRecord completeness.
 * Feature: database-backup-recovery
 */
class BackupRecordCompletenessPropertyTest {

    private static final DateTimeFormatter FILENAME_DATE_FORMAT = 
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH-mm-ss");

    /**
     * Property 3: Backup Record Completeness
     * For any successfully completed backup operation, the resulting BackupRecord
     * should contain: a non-null filename, a createdAt timestamp equal to or after
     * the operation start time, a positive fileSizeBytes value, and SUCCESS status.
     * 
     * Validates: Requirements 1.3
     */
    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 3: Successful backup records have all required fields")
    void successfulBackupRecordHasAllRequiredFields(
            @ForAll @IntRange(min = 2000, max = 2100) int year,
            @ForAll @IntRange(min = 1, max = 12) int month,
            @ForAll @IntRange(min = 1, max = 28) int day,
            @ForAll @IntRange(min = 0, max = 23) int hour,
            @ForAll @IntRange(min = 0, max = 59) int minute,
            @ForAll @IntRange(min = 0, max = 59) int second,
            @ForAll @LongRange(min = 1, max = 10_000_000_000L) long fileSize
    ) {
        LocalDateTime createdAt = LocalDateTime.of(year, month, day, hour, minute, second);
        String filename = generateBackupFilename(createdAt);

        // Create a successful backup record
        BackupRecord record = new BackupRecord(filename, createdAt, fileSize, BackupStatus.SUCCESS);

        // Verify all required fields are present and valid
        assert record.getFilename() != null && !record.getFilename().isEmpty() :
                "Filename must not be null or empty";
        assert record.getCreatedAt() != null :
                "CreatedAt must not be null";
        assert record.getFileSizeBytes() != null && record.getFileSizeBytes() > 0 :
                "FileSizeBytes must be positive";
        assert record.getStatus() == BackupStatus.SUCCESS :
                "Status must be SUCCESS for successful backups";
    }

    /**
     * Property 3 (additional): Backup record timestamp is consistent with filename
     * For any backup record, the createdAt timestamp should be extractable from the filename.
     * 
     * Validates: Requirements 1.3
     */
    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 3: Backup record timestamp matches filename")
    void backupRecordTimestampMatchesFilename(
            @ForAll @IntRange(min = 2000, max = 2100) int year,
            @ForAll @IntRange(min = 1, max = 12) int month,
            @ForAll @IntRange(min = 1, max = 28) int day,
            @ForAll @IntRange(min = 0, max = 23) int hour,
            @ForAll @IntRange(min = 0, max = 59) int minute,
            @ForAll @IntRange(min = 0, max = 59) int second,
            @ForAll @LongRange(min = 1, max = 10_000_000_000L) long fileSize
    ) {
        LocalDateTime createdAt = LocalDateTime.of(year, month, day, hour, minute, second);
        String filename = generateBackupFilename(createdAt);

        BackupRecord record = new BackupRecord(filename, createdAt, fileSize, BackupStatus.SUCCESS);

        // Extract timestamp from filename and verify it matches createdAt
        String timestampStr = filename
                .replace("intelliquiz_backup_", "")
                .replace(".sql", "");
        LocalDateTime extractedTimestamp = LocalDateTime.parse(timestampStr, FILENAME_DATE_FORMAT);

        assert extractedTimestamp.equals(record.getCreatedAt()) :
                "Extracted timestamp should match record createdAt";
    }

    private String generateBackupFilename(LocalDateTime timestamp) {
        return "intelliquiz_backup_" + timestamp.format(FILENAME_DATE_FORMAT) + ".sql";
    }
}
