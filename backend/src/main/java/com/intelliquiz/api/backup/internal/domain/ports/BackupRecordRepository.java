package com.intelliquiz.api.backup.internal.domain.ports;

import com.intelliquiz.api.backup.internal.domain.entities.BackupRecord;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for BackupRecord persistence operations.
 * Clean domain port — no Spring Data dependency.
 */
public interface BackupRecordRepository {

    BackupRecord save(BackupRecord record);

    Optional<BackupRecord> findById(Long id);

    /**
     * Find all backup records ordered by creation timestamp descending (newest first).
     *
     * @return list of backup records ordered by createdAt descending
     */
    List<BackupRecord> findAllByOrderByCreatedAtDesc();

    void delete(BackupRecord record);
}
