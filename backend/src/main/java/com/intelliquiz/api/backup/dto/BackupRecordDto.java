package com.intelliquiz.api.backup.dto;

import com.intelliquiz.api.shared.enums.BackupStatus;

import java.time.LocalDateTime;

/**
 * Public read-only DTO for cross-module backup record information.
 */
public record BackupRecordDto(
        Long id,
        String filename,
        LocalDateTime createdAt,
        Long fileSizeBytes,
        BackupStatus status,
        String errorMessage,
        LocalDateTime lastRestoredAt,
        Long createdByUserId
) {}
