package com.intelliquiz.api.infrastructure.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Initializes the backup directory on application startup.
 * Creates the directory if it doesn't exist and validates it is writable.
 */
@Component
public class BackupDirectoryInitializer implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(BackupDirectoryInitializer.class);

    private final BackupProperties backupProperties;

    public BackupDirectoryInitializer(BackupProperties backupProperties) {
        this.backupProperties = backupProperties;
    }

    @Override
    public void run(ApplicationArguments args) {
        Path backupDir = Paths.get(backupProperties.getDirectory());
        
        try {
            if (!Files.exists(backupDir)) {
                Files.createDirectories(backupDir);
                logger.info("Created backup directory: {}", backupDir.toAbsolutePath());
            }
            
            if (!Files.isWritable(backupDir)) {
                logger.warn("Backup directory is not writable: {}", backupDir.toAbsolutePath());
            } else {
                logger.info("Backup directory initialized: {}", backupDir.toAbsolutePath());
            }
        } catch (IOException e) {
            logger.error("Failed to create backup directory: {}", backupDir.toAbsolutePath(), e);
        }
    }
}
