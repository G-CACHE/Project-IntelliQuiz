package com.intelliquiz.api.domain.exceptions;

/**
 * Exception thrown when a backup or restore operation fails.
 */
public class BackupException extends RuntimeException {

    public BackupException(String message) {
        super(message);
    }

    public BackupException(String message, Throwable cause) {
        super(message, cause);
    }
}
