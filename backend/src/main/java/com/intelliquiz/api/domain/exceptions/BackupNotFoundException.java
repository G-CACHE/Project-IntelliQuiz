package com.intelliquiz.api.domain.exceptions;

/**
 * Exception thrown when a backup record is not found.
 */
public class BackupNotFoundException extends RuntimeException {

    public BackupNotFoundException(Long id) {
        super("Backup not found with id: " + id);
    }
}
