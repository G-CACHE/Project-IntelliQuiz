package com.intelliquiz.api.backup.internal.infrastructure.persistence;

import com.intelliquiz.api.backup.internal.domain.entities.BackupRecord;
import com.intelliquiz.api.backup.internal.domain.ports.BackupRecordRepository;
import com.intelliquiz.api.backup.internal.infrastructure.persistence.SpringBackupRecordRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of BackupRecordRepository port using Spring Data JPA.
 */
@Component
public class BackupRecordRepositoryImpl implements BackupRecordRepository {

    private final SpringBackupRecordRepository springBackupRecordRepository;

    public BackupRecordRepositoryImpl(SpringBackupRecordRepository springBackupRecordRepository) {
        this.springBackupRecordRepository = springBackupRecordRepository;
    }

    @Override
    public BackupRecord save(BackupRecord record) {
        return springBackupRecordRepository.save(record);
    }

    @Override
    public Optional<BackupRecord> findById(Long id) {
        return springBackupRecordRepository.findById(id);
    }

    @Override
    public List<BackupRecord> findAllByOrderByCreatedAtDesc() {
        return springBackupRecordRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public void delete(BackupRecord record) {
        springBackupRecordRepository.delete(record);
    }
}
