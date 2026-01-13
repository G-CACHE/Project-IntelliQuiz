package com.intelliquiz.api.presentation.dto;

import com.intelliquiz.api.domain.entities.BackupRecord;
import com.intelliquiz.api.domain.enums.BackupStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for BackupRecord entity.
 */
@Schema(description = "Database backup record information")
public record BackupRecordDTO(
        @Schema(description = "Unique identifier of the backup")
        Long id,

        @Schema(description = "Backup filename")
        String filename,

        @Schema(description = "Timestamp when the backup was created")
        LocalDateTime createdAt,

        @Schema(description = "Size of the backup file in bytes")
        Long fileSizeBytes,

        @Schema(description = "Status of the backup operation")
        BackupStatus status,

        @Schema(description = "Error message if backup failed")
        String errorMessage,

        @Schema(description = "Timestamp when this backup was last used for restore")
        LocalDateTime lastRestoredAt,

        @Schema(description = "Username of the user who created the backup")
        String createdByUsername
) {
    /**
     * Creates a DTO from a BackupRecord entity.
     *
     * @param record the backup record entity
     * @return the DTO representation
     */
    public static BackupRecordDTO fromEntity(BackupRecord record) {
        return new BackupRecordDTO(
                record.getId(),
                record.getFilename(),
                record.getCreatedAt(),
                record.getFileSizeBytes(),
                record.getStatus(),
                record.getErrorMessage(),
                record.getLastRestoredAt(),
                record.getCreatedBy() != null ? record.getCreatedBy().getUsername() : null
        );
    }
}
