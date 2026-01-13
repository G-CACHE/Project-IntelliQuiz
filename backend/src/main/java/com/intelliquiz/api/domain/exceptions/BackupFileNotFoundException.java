package com.intelliquiz.api.domain.exceptions;

/**
 * Exception thrown when a backup file is not found on disk.
 */
public class BackupFileNotFoundException extends RuntimeException {

    public BackupFileNotFoundException(String filename) {
        super("Backup file not found: " + filename);
    }
}
