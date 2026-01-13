package com.intelliquiz.api.domain.entities;

import com.intelliquiz.api.domain.enums.BackupStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Entity representing a database backup record.
 * Stores metadata about each backup operation including filename, status, and timestamps.
 */
@Entity
@Table(name = "backup_record")
public class BackupRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String filename;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BackupStatus status;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    @Column(name = "last_restored_at")
    private LocalDateTime lastRestoredAt;

    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    public BackupRecord() {
    }

    public BackupRecord(String filename, LocalDateTime createdAt, Long fileSizeBytes, BackupStatus status) {
        this.filename = filename;
        this.createdAt = createdAt;
        this.fileSizeBytes = fileSizeBytes;
        this.status = status;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public BackupStatus getStatus() {
        return status;
    }

    public void setStatus(BackupStatus status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public LocalDateTime getLastRestoredAt() {
        return lastRestoredAt;
    }

    public void setLastRestoredAt(LocalDateTime lastRestoredAt) {
        this.lastRestoredAt = lastRestoredAt;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }
}
