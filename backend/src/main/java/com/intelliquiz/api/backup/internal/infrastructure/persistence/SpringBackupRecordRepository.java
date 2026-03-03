package com.intelliquiz.api.backup.internal.infrastructure.persistence;

import com.intelliquiz.api.backup.internal.domain.entities.BackupRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for BackupRecord entity.
 */
@Repository
public interface SpringBackupRecordRepository extends JpaRepository<BackupRecord, Long> {

    List<BackupRecord> findAllByOrderByCreatedAtDesc();
}
