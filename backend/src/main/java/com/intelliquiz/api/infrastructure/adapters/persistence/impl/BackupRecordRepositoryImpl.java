package com.intelliquiz.api.infrastructure.adapters.persistence.impl;

import com.intelliquiz.api.domain.entities.BackupRecord;
import com.intelliquiz.api.domain.ports.BackupRecordRepository;
import com.intelliquiz.api.infrastructure.adapters.persistence.spring.SpringBackupRecordRepository;
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
