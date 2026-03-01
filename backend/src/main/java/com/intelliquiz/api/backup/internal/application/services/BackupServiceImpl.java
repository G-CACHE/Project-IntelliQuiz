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
import jakarta.persistence.EntityManager;
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
    private final EntityManager entityManager;

    public BackupServiceImpl(BackupRecordRepository backupRecordRepository,
                             PostgresBackupExecutor postgresBackupExecutor,
                             BackupProperties backupProperties,
                             ApplicationEventPublisher eventPublisher,
                             EntityManager entityManager) {
        this.backupRecordRepository = backupRecordRepository;
        this.postgresBackupExecutor = postgresBackupExecutor;
        this.backupProperties = backupProperties;
        this.eventPublisher = eventPublisher;
        this.entityManager = entityManager;
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
    public BackupRecord restoreFromBackup(Long id, Long restoredByUserId) {
        // Step 1: Validate backup exists and file is on disk
        BackupRecord record = backupRecordRepository.findById(id)
                .orElseThrow(() -> new BackupNotFoundException(id));

        Path backupPath = getBackupPath(record.getFilename());

        if (!Files.exists(backupPath)) {
            throw new BackupFileNotFoundException(record.getFilename());
        }

        // Step 2: Clear the Hibernate persistence context.
        // The restore runs psql externally (outside JDBC), so all managed entities
        // become stale once the DB is replaced.
        entityManager.clear();

        // Step 3: Execute the restore — drops all tables and recreates from dump
        try {
            postgresBackupExecutor.restoreFromDump(backupPath);
            logger.info("Database restored successfully from: {}", record.getFilename());
        } catch (Exception e) {
            logger.error("Restore failed from: {}", record.getFilename(), e);
            throw new BackupException("Restore failed: " + e.getMessage(), e);
        }

        // Step 4: Clear Hibernate again — the DB is now the restored state.
        entityManager.clear();

        // Step 5: Re-read the record from the restored DB (it may or may not exist
        // depending on whether the dump was taken before or after this record was created).
        BackupRecord restoredRecord = backupRecordRepository.findById(id).orElse(null);
        if (restoredRecord != null) {
            restoredRecord.setLastRestoredAt(LocalDateTime.now());
            restoredRecord = backupRecordRepository.save(restoredRecord);
        } else {
            // The restored DB predates this backup record — re-insert it
            record.setLastRestoredAt(LocalDateTime.now());
            restoredRecord = backupRecordRepository.save(record);
        }

        eventPublisher.publishEvent(new BackupRestoredEvent(
                restoredRecord.getId(), restoredRecord.getFilename(), restoredByUserId));

        return restoredRecord;
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
