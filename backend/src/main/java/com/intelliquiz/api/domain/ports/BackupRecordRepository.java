package com.intelliquiz.api.domain.ports;

import com.intelliquiz.api.domain.entities.BackupRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for BackupRecord entity operations.
 */
@Repository
public interface BackupRecordRepository extends JpaRepository<BackupRecord, Long> {

    /**
     * Find all backup records ordered by creation timestamp descending (newest first).
     *
     * @return list of backup records ordered by createdAt descending
     */
    List<BackupRecord> findAllByOrderByCreatedAtDesc();
}
