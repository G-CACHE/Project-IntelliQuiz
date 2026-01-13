package com.intelliquiz.api.domain.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Status of a database backup operation.
 */
@Schema(description = "Backup operation status: IN_PROGRESS (backup running), SUCCESS (completed successfully), FAILED (operation failed)")
public enum BackupStatus {
    /**
     * Backup operation is currently in progress.
     */
    IN_PROGRESS,

    /**
     * Backup operation completed successfully.
     */
    SUCCESS,

    /**
     * Backup operation failed.
     */
    FAILED
}
