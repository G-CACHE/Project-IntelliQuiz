package com.intelliquiz.api.backup;

import com.intelliquiz.api.backup.dto.BackupRecordDto;
import com.intelliquiz.api.backup.internal.application.services.BackupService;
import com.intelliquiz.api.backup.internal.domain.entities.BackupRecord;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Public facade for the Backup module.
 * All cross-module access to backup operations should go through this facade.
 */
@Service
public class BackupFacade {

    private final BackupService backupService;

    public BackupFacade(BackupService backupService) {
        this.backupService = backupService;
    }

    /**
     * Create a new database backup.
     */
    public BackupRecordDto createBackup(Long createdByUserId) {
        BackupRecord record = backupService.createBackup(createdByUserId);
        return toDto(record);
    }

    /**
     * Restore the database from a backup (with saga compensation).
     */
    public BackupRecordDto restoreFromBackup(Long backupId, Long restoredByUserId) {
        BackupRecord record = backupService.restoreFromBackup(backupId, restoredByUserId);
        return toDto(record);
    }

    /**
     * List all backups ordered by creation time descending.
     */
    public List<BackupRecordDto> listBackups() {
        return backupService.listBackups().stream()
                .map(this::toDto)
                .toList();
    }

    private BackupRecordDto toDto(BackupRecord record) {
        return new BackupRecordDto(
                record.getId(),
                record.getFilename(),
                record.getCreatedAt(),
                record.getFileSizeBytes(),
                record.getStatus(),
                record.getErrorMessage(),
                record.getLastRestoredAt(),
                record.getCreatedByUserId()
        );
    }
}
