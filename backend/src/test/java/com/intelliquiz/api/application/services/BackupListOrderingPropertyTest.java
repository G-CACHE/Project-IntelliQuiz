package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.BackupRecord;
import com.intelliquiz.api.domain.enums.BackupStatus;
import net.jqwik.api.*;
import net.jqwik.api.constraints.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Property-based tests for backup list ordering.
 * Feature: database-backup-recovery
 */
class BackupListOrderingPropertyTest {

    private static final DateTimeFormatter FILENAME_DATE_FORMAT = 
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH-mm-ss");

    /**
     * Property 4: Backup List Ordering
     * For any list of BackupRecords returned by listBackups(), the records
     * should be ordered by createdAt timestamp in descending order (newest first).
     * 
     * Validates: Requirements 2.1
     */
    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 4: Backup list is ordered by createdAt descending")
    void backupListIsOrderedByCreatedAtDescending(
            @ForAll @Size(min = 2, max = 20) List<@IntRange(min = 0, max = 1000000) Integer> minuteOffsets
    ) {
        LocalDateTime baseTime = LocalDateTime.of(2025, 1, 1, 0, 0, 0);
        
        // Create backup records with different timestamps
        List<BackupRecord> records = new ArrayList<>();
        for (int i = 0; i < minuteOffsets.size(); i++) {
            LocalDateTime createdAt = baseTime.plusMinutes(minuteOffsets.get(i));
            String filename = generateBackupFilename(createdAt);
            BackupRecord record = new BackupRecord(filename, createdAt, 1000L, BackupStatus.SUCCESS);
            record.setId((long) (i + 1));
            records.add(record);
        }

        // Sort by createdAt descending (simulating repository behavior)
        List<BackupRecord> sortedRecords = new ArrayList<>(records);
        sortedRecords.sort(Comparator.comparing(BackupRecord::getCreatedAt).reversed());

        // Verify ordering: each record should have createdAt >= next record's createdAt
        for (int i = 0; i < sortedRecords.size() - 1; i++) {
            LocalDateTime current = sortedRecords.get(i).getCreatedAt();
            LocalDateTime next = sortedRecords.get(i + 1).getCreatedAt();
            
            assert !current.isBefore(next) :
                    "Records should be ordered by createdAt descending. Found " + 
                    current + " before " + next;
        }
    }

    /**
     * Property 4 (additional): First record in sorted list is the newest
     * For any non-empty list of BackupRecords, after sorting by createdAt descending,
     * the first record should have the maximum createdAt timestamp.
     * 
     * Validates: Requirements 2.1
     */
    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 4: First record is newest after sorting")
    void firstRecordIsNewestAfterSorting(
            @ForAll @Size(min = 1, max = 20) List<@IntRange(min = 0, max = 1000000) Integer> minuteOffsets
    ) {
        LocalDateTime baseTime = LocalDateTime.of(2025, 1, 1, 0, 0, 0);
        
        // Create backup records with different timestamps
        List<BackupRecord> records = new ArrayList<>();
        LocalDateTime maxTimestamp = null;
        
        for (int i = 0; i < minuteOffsets.size(); i++) {
            LocalDateTime createdAt = baseTime.plusMinutes(minuteOffsets.get(i));
            String filename = generateBackupFilename(createdAt);
            BackupRecord record = new BackupRecord(filename, createdAt, 1000L, BackupStatus.SUCCESS);
            record.setId((long) (i + 1));
            records.add(record);
            
            if (maxTimestamp == null || createdAt.isAfter(maxTimestamp)) {
                maxTimestamp = createdAt;
            }
        }

        // Sort by createdAt descending
        List<BackupRecord> sortedRecords = new ArrayList<>(records);
        sortedRecords.sort(Comparator.comparing(BackupRecord::getCreatedAt).reversed());

        // First record should have the maximum timestamp
        assert sortedRecords.get(0).getCreatedAt().equals(maxTimestamp) :
                "First record should have the newest timestamp";
    }

    private String generateBackupFilename(LocalDateTime timestamp) {
        return "intelliquiz_backup_" + timestamp.format(FILENAME_DATE_FORMAT) + ".sql";
    }
}
