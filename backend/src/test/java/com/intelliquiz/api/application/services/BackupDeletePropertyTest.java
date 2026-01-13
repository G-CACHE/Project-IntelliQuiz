package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.BackupRecord;
import com.intelliquiz.api.domain.enums.BackupStatus;
import com.intelliquiz.api.domain.ports.BackupRecordRepository;
import com.intelliquiz.api.domain.ports.PostgresBackupExecutor;
import com.intelliquiz.api.infrastructure.config.BackupProperties;
import net.jqwik.api.*;
import net.jqwik.api.constraints.*;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.Mockito.*;

/**
 * Property-based tests for backup delete completeness.
 * Feature: database-backup-recovery
 */
class BackupDeletePropertyTest {

    /**
     * Property 8: Delete Removes Record and File
     * For any delete operation on a valid backup ID, after deletion completes:
     * the BackupRecord should no longer exist in the repository, and the
     * corresponding file should no longer exist on disk.
     * 
     * Validates: Requirements 5.1
     */
    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 8: Delete removes both record and file")
    void deleteRemovesBothRecordAndFile(
            @ForAll @LongRange(min = 1, max = 1000) long backupId,
            @ForAll @AlphaChars @StringLength(min = 5, max = 20) String filenameBase
    ) throws IOException {
        // Create temp directory for this test
        Path tempDir = Files.createTempDirectory("backup-test");
        
        try {
            String filename = filenameBase + ".sql";
            Path backupFile = tempDir.resolve(filename);
            Files.createFile(backupFile);
            
            // Setup mocks
            BackupRecordRepository repository = mock(BackupRecordRepository.class);
            PostgresBackupExecutor executor = mock(PostgresBackupExecutor.class);
            BackupProperties properties = new BackupProperties();
            properties.setDirectory(tempDir.toString());
            
            BackupRecord record = new BackupRecord(filename, LocalDateTime.now(), 1000L, BackupStatus.SUCCESS);
            record.setId(backupId);
            
            when(repository.findById(backupId)).thenReturn(Optional.of(record));
            
            BackupServiceImpl service = new BackupServiceImpl(repository, executor, properties);
            
            // Verify file exists before delete
            assert Files.exists(backupFile) : "File should exist before delete";
            
            // Act
            service.deleteBackup(backupId);
            
            // Assert - file should be deleted
            assert !Files.exists(backupFile) : "File should not exist after delete";
            
            // Assert - repository delete was called
            verify(repository).delete(record);
            
        } finally {
            // Cleanup temp directory
            Files.walk(tempDir)
                    .sorted((a, b) -> -a.compareTo(b))
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException ignored) {}
                    });
        }
    }

    /**
     * Property 8 (additional): Delete handles missing file gracefully
     * For any delete operation where the file doesn't exist on disk,
     * the record should still be deleted from the repository.
     * 
     * Validates: Requirements 5.2
     */
    @Property(tries = 20)
    @Label("Feature: database-backup-recovery, Property 8: Delete handles missing file gracefully")
    void deleteHandlesMissingFileGracefully(
            @ForAll @LongRange(min = 1, max = 1000) long backupId,
            @ForAll @AlphaChars @StringLength(min = 5, max = 20) String filenameBase
    ) throws IOException {
        Path tempDir = Files.createTempDirectory("backup-test");
        
        try {
            String filename = filenameBase + ".sql";
            // Note: We don't create the file - it doesn't exist
            
            BackupRecordRepository repository = mock(BackupRecordRepository.class);
            PostgresBackupExecutor executor = mock(PostgresBackupExecutor.class);
            BackupProperties properties = new BackupProperties();
            properties.setDirectory(tempDir.toString());
            
            BackupRecord record = new BackupRecord(filename, LocalDateTime.now(), 1000L, BackupStatus.SUCCESS);
            record.setId(backupId);
            
            when(repository.findById(backupId)).thenReturn(Optional.of(record));
            
            BackupServiceImpl service = new BackupServiceImpl(repository, executor, properties);
            
            // Act - should not throw even though file doesn't exist
            service.deleteBackup(backupId);
            
            // Assert - repository delete was still called
            verify(repository).delete(record);
            
        } finally {
            Files.deleteIfExists(tempDir);
        }
    }
}
