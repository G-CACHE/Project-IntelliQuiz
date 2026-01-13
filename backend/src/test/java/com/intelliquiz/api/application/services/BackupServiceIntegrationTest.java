package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.BackupRecord;
import com.intelliquiz.api.domain.entities.User;
import com.intelliquiz.api.domain.enums.BackupStatus;
import com.intelliquiz.api.domain.enums.SystemRole;
import com.intelliquiz.api.domain.ports.BackupRecordRepository;
import com.intelliquiz.api.domain.ports.PostgresBackupExecutor;
import com.intelliquiz.api.infrastructure.config.BackupProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Integration tests for BackupService.
 * Tests backup creation, restore, and delete operations.
 */
class BackupServiceIntegrationTest {

    @TempDir
    Path tempDir;

    private BackupRecordRepository backupRecordRepository;
    private PostgresBackupExecutor postgresBackupExecutor;
    private BackupProperties backupProperties;
    private BackupServiceImpl backupService;
    private User superAdmin;

    @BeforeEach
    void setUp() {
        backupRecordRepository = mock(BackupRecordRepository.class);
        postgresBackupExecutor = mock(PostgresBackupExecutor.class);
        backupProperties = new BackupProperties();
        backupProperties.setDirectory(tempDir.toString());
        
        backupService = new BackupServiceImpl(
                backupRecordRepository,
                postgresBackupExecutor,
                backupProperties
        );
        
        superAdmin = new User("superadmin", "password123", SystemRole.SUPER_ADMIN);
    }

    @Test
    void createBackup_shouldCreateRecordWithSuccessStatus() {
        // Arrange
        when(postgresBackupExecutor.createDump(any(Path.class))).thenReturn(1024L);
        when(backupRecordRepository.save(any(BackupRecord.class)))
                .thenAnswer(invocation -> {
                    BackupRecord record = invocation.getArgument(0);
                    record.setId(1L);
                    return record;
                });

        // Act
        BackupRecord result = backupService.createBackup(superAdmin);

        // Assert
        assertNotNull(result);
        assertEquals(BackupStatus.SUCCESS, result.getStatus());
        assertEquals(1024L, result.getFileSizeBytes());
        assertNotNull(result.getFilename());
        assertTrue(result.getFilename().startsWith("intelliquiz_backup_"));
        assertTrue(result.getFilename().endsWith(".sql"));
        verify(postgresBackupExecutor).createDump(any(Path.class));
        verify(backupRecordRepository, times(2)).save(any(BackupRecord.class));
    }

    @Test
    void createBackup_shouldCreateRecordWithFailedStatusOnError() {
        // Arrange
        when(postgresBackupExecutor.createDump(any(Path.class)))
                .thenThrow(new RuntimeException("pg_dump failed"));
        when(backupRecordRepository.save(any(BackupRecord.class)))
                .thenAnswer(invocation -> {
                    BackupRecord record = invocation.getArgument(0);
                    record.setId(1L);
                    return record;
                });

        // Act
        BackupRecord result = backupService.createBackup(superAdmin);

        // Assert
        assertNotNull(result);
        assertEquals(BackupStatus.FAILED, result.getStatus());
        assertNotNull(result.getErrorMessage());
    }

    @Test
    void listBackups_shouldReturnBackupsInDescendingOrder() {
        // Arrange
        List<BackupRecord> records = new ArrayList<>();
        BackupRecord older = new BackupRecord("backup1.sql", LocalDateTime.now().minusDays(1), 1000L, BackupStatus.SUCCESS);
        BackupRecord newer = new BackupRecord("backup2.sql", LocalDateTime.now(), 2000L, BackupStatus.SUCCESS);
        records.add(newer);
        records.add(older);
        
        when(backupRecordRepository.findAllByOrderByCreatedAtDesc()).thenReturn(records);

        // Act
        List<BackupRecord> result = backupService.listBackups();

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.get(0).getCreatedAt().isAfter(result.get(1).getCreatedAt()));
    }

    @Test
    void deleteBackup_shouldRemoveRecordAndFile() throws Exception {
        // Arrange
        String filename = "test_backup.sql";
        Path backupFile = tempDir.resolve(filename);
        Files.createFile(backupFile);
        
        BackupRecord record = new BackupRecord(filename, LocalDateTime.now(), 1000L, BackupStatus.SUCCESS);
        record.setId(1L);
        
        when(backupRecordRepository.findById(1L)).thenReturn(Optional.of(record));

        // Act
        backupService.deleteBackup(1L);

        // Assert
        verify(backupRecordRepository).delete(record);
        assertFalse(Files.exists(backupFile));
    }

    @Test
    void restoreFromBackup_shouldCreatePreRestoreBackup() throws Exception {
        // Arrange
        String filename = "test_backup.sql";
        Path backupFile = tempDir.resolve(filename);
        Files.createFile(backupFile);
        
        BackupRecord record = new BackupRecord(filename, LocalDateTime.now().minusHours(1), 1000L, BackupStatus.SUCCESS);
        record.setId(1L);
        
        when(backupRecordRepository.findById(1L)).thenReturn(Optional.of(record));
        when(postgresBackupExecutor.createDump(any(Path.class))).thenReturn(2000L);
        when(backupRecordRepository.save(any(BackupRecord.class)))
                .thenAnswer(invocation -> {
                    BackupRecord r = invocation.getArgument(0);
                    if (r.getId() == null) r.setId(2L);
                    return r;
                });

        // Act
        BackupRecord result = backupService.restoreFromBackup(1L, superAdmin);

        // Assert
        assertNotNull(result.getLastRestoredAt());
        verify(postgresBackupExecutor).createDump(any(Path.class)); // Pre-restore backup
        verify(postgresBackupExecutor).restoreFromDump(backupFile);
    }

    @Test
    void generateBackupFilename_shouldMatchExpectedPattern() {
        // Act
        String filename = backupService.generateBackupFilename();

        // Assert
        assertTrue(filename.matches("intelliquiz_backup_\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}\\.sql"));
    }
}
