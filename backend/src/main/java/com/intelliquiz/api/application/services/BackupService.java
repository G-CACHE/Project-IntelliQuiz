package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.BackupRecord;
import com.intelliquiz.api.domain.entities.User;
import org.springframework.core.io.Resource;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for database backup and recovery operations.
 */
public interface BackupService {

    /**
     * Creates a new database backup.
     *
     * @param createdBy the user creating the backup
     * @return the created backup record
     */
    BackupRecord createBackup(User createdBy);

    /**
     * Lists all backup records ordered by creation time descending.
     *
     * @return list of backup records
     */
    List<BackupRecord> listBackups();

    /**
     * Gets a backup record by ID.
     *
     * @param id the backup ID
     * @return optional containing the backup record if found
     */
    Optional<BackupRecord> getBackup(Long id);

    /**
     * Downloads a backup file as a resource.
     *
     * @param id the backup ID
     * @return the backup file as a resource
     */
    Resource downloadBackup(Long id);

    /**
     * Restores the database from a backup.
     *
     * @param id the backup ID to restore from
     * @param restoredBy the user performing the restore
     * @return the updated backup record
     */
    BackupRecord restoreFromBackup(Long id, User restoredBy);

    /**
     * Deletes a backup record and its associated file.
     *
     * @param id the backup ID to delete
     */
    void deleteBackup(Long id);

    /**
     * Generates a backup filename based on the current timestamp.
     *
     * @return the generated filename
     */
    String generateBackupFilename();
}
