package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.BackupRecord;
import com.intelliquiz.api.domain.entities.User;
import com.intelliquiz.api.domain.enums.BackupStatus;
import com.intelliquiz.api.domain.exceptions.BackupException;
import com.intelliquiz.api.domain.exceptions.BackupFileNotFoundException;
import com.intelliquiz.api.domain.exceptions.BackupNotFoundException;
import com.intelliquiz.api.domain.ports.BackupRecordRepository;
import com.intelliquiz.api.domain.ports.PostgresBackupExecutor;
import com.intelliquiz.api.infrastructure.config.BackupProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public BackupServiceImpl(BackupRecordRepository backupRecordRepository,
                             PostgresBackupExecutor postgresBackupExecutor,
                             BackupProperties backupProperties) {
        this.backupRecordRepository = backupRecordRepository;
        this.postgresBackupExecutor = postgresBackupExecutor;
        this.backupProperties = backupProperties;
    }

    @Override
    @Transactional
    public BackupRecord createBackup(User createdBy) {
        LocalDateTime now = LocalDateTime.now();
        String filename = generateBackupFilename(now);
        Path backupPath = getBackupPath(filename);

        BackupRecord record = new BackupRecord();
        record.setFilename(filename);
        record.setCreatedAt(now);
        record.setStatus(BackupStatus.IN_PROGRESS);
        record.setFileSizeBytes(0L);
        record.setCreatedBy(createdBy);
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

        return backupRecordRepository.save(record);
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
    public BackupRecord restoreFromBackup(Long id, User restoredBy) {
        BackupRecord record = backupRecordRepository.findById(id)
                .orElseThrow(() -> new BackupNotFoundException(id));

        Path backupPath = getBackupPath(record.getFilename());

        if (!Files.exists(backupPath)) {
            throw new BackupFileNotFoundException(record.getFilename());
        }

        // Create pre-restore safety backup
        logger.info("Creating pre-restore safety backup before restoring from: {}", record.getFilename());
        createBackup(restoredBy);

        // Perform restore
        postgresBackupExecutor.restoreFromDump(backupPath);

        // Update record with restore timestamp
        record.setLastRestoredAt(LocalDateTime.now());
        return backupRecordRepository.save(record);
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
