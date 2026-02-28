package com.intelliquiz.api.backup.internal.application.services;

import com.intelliquiz.api.backup.internal.domain.entities.BackupRecord;
import com.intelliquiz.api.backup.internal.domain.events.BackupCreatedEvent;
import com.intelliquiz.api.backup.internal.domain.events.BackupRestoredEvent;
import com.intelliquiz.api.shared.enums.BackupStatus;
import com.intelliquiz.api.shared.exceptions.BackupException;
import com.intelliquiz.api.shared.exceptions.BackupFileNotFoundException;
import com.intelliquiz.api.shared.exceptions.BackupNotFoundException;
import com.intelliquiz.api.backup.internal.domain.ports.BackupRecordRepository;
import com.intelliquiz.api.backup.internal.domain.ports.PostgresBackupExecutor;
import com.intelliquiz.api.backup.internal.infrastructure.config.BackupProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Implementation of BackupService for database backup and recovery operations.
 */
@Service
public class BackupServiceImpl implements BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupServiceImpl.class);
    private static final String FILENAME_PREFIX = "intelliquiz_backup_";
    private static final String FILENAME_SUFFIX = ".sql";
    private static final DateTimeFormatter FILENAME_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH-mm-ss");

    private final BackupRecordRepository backupRecordRepository;
    private final PostgresBackupExecutor postgresBackupExecutor;
    private final BackupProperties backupProperties;
    private final ApplicationEventPublisher eventPublisher;

    public BackupServiceImpl(BackupRecordRepository backupRecordRepository,
                             PostgresBackupExecutor postgresBackupExecutor,
                             BackupProperties backupProperties,
                             ApplicationEventPublisher eventPublisher) {
        this.backupRecordRepository = backupRecordRepository;
        this.postgresBackupExecutor = postgresBackupExecutor;
        this.backupProperties = backupProperties;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public BackupRecord createBackup(Long createdByUserId) {
        LocalDateTime now = LocalDateTime.now();
        String filename = generateBackupFilename(now);
        Path backupPath = getBackupPath(filename);

        BackupRecord record = new BackupRecord();
        record.setFilename(filename);
        record.setCreatedAt(now);
        record.setStatus(BackupStatus.IN_PROGRESS);
        record.setFileSizeBytes(0L);
        record.setCreatedByUserId(createdByUserId);
        record = backupRecordRepository.save(record);

        try {
            long fileSize = postgresBackupExecutor.createDump(backupPath);
            record.setFileSizeBytes(fileSize);
            record.setStatus(BackupStatus.SUCCESS);
            logger.info("Backup created successfully: {}", filename);
        } catch (Exception e) {
            record.setStatus(BackupStatus.FAILED);
            record.setErrorMessage(e.getMessage());
            logger.error("Backup failed: {}", e.getMessage(), e);
        }

        record = backupRecordRepository.save(record);

        if (record.getStatus() == BackupStatus.SUCCESS) {
            eventPublisher.publishEvent(new BackupCreatedEvent(record.getId(), record.getFilename(), createdByUserId));
        }

        return record;
    }

    @Override
    public List<BackupRecord> listBackups() {
        return backupRecordRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public Optional<BackupRecord> getBackup(Long id) {
        return backupRecordRepository.findById(id);
    }

    @Override
    public Resource downloadBackup(Long id) {
        BackupRecord record = backupRecordRepository.findById(id)
                .orElseThrow(() -> new BackupNotFoundException(id));

        Path backupPath = getBackupPath(record.getFilename());

        if (!Files.exists(backupPath)) {
            throw new BackupFileNotFoundException(record.getFilename());
        }

        try {
            Resource resource = new UrlResource(backupPath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new BackupFileNotFoundException(record.getFilename());
            }
        } catch (MalformedURLException e) {
            throw new BackupException("Failed to read backup file: " + record.getFilename(), e);
        }
    }

    @Override
    @Transactional
    public BackupRecord restoreFromBackup(Long id, Long restoredByUserId) {
        BackupRecord record = backupRecordRepository.findById(id)
                .orElseThrow(() -> new BackupNotFoundException(id));

        Path backupPath = getBackupPath(record.getFilename());

        if (!Files.exists(backupPath)) {
            throw new BackupFileNotFoundException(record.getFilename());
        }

        // ── Saga: safety backup → try restore → compensate on failure ──
        logger.info("Creating pre-restore safety backup before restoring from: {}", record.getFilename());
        BackupRecord safetyBackup = createBackup(restoredByUserId);

        try {
            postgresBackupExecutor.restoreFromDump(backupPath);
            logger.info("Database restored successfully from: {}", record.getFilename());
        } catch (Exception e) {
            // Compensation: re-restore from the safety backup
            logger.error("Restore failed, compensating by re-restoring safety backup: {}", safetyBackup.getFilename(), e);
            try {
                Path safetyPath = getBackupPath(safetyBackup.getFilename());
                postgresBackupExecutor.restoreFromDump(safetyPath);
                logger.info("Compensation successful — safety backup restored");
            } catch (Exception compensationEx) {
                logger.error("CRITICAL: Compensation also failed! Database may be inconsistent.", compensationEx);
            }
            throw new BackupException("Restore failed and was compensated from safety backup", e);
        }

        // Update record with restore timestamp
        record.setLastRestoredAt(LocalDateTime.now());
        record = backupRecordRepository.save(record);

        eventPublisher.publishEvent(new BackupRestoredEvent(record.getId(), record.getFilename(), restoredByUserId));

        return record;
    }

    @Override
    @Transactional
    public void deleteBackup(Long id) {
        BackupRecord record = backupRecordRepository.findById(id)
                .orElseThrow(() -> new BackupNotFoundException(id));

        Path backupPath = getBackupPath(record.getFilename());

        // Delete file if it exists
        try {
            if (Files.exists(backupPath)) {
                Files.delete(backupPath);
                logger.info("Deleted backup file: {}", record.getFilename());
            }
        } catch (IOException e) {
            logger.warn("Failed to delete backup file: {}. Continuing with record deletion.", record.getFilename(), e);
        }

        // Delete record
        backupRecordRepository.delete(record);
        logger.info("Deleted backup record: {}", id);
    }

    @Override
    public String generateBackupFilename() {
        return generateBackupFilename(LocalDateTime.now());
    }

    /**
     * Generates a backup filename for a specific timestamp.
     */
    public String generateBackupFilename(LocalDateTime timestamp) {
        return FILENAME_PREFIX + timestamp.format(FILENAME_DATE_FORMAT) + FILENAME_SUFFIX;
    }

    private Path getBackupPath(String filename) {
        return Paths.get(backupProperties.getDirectory(), filename);
    }
}
