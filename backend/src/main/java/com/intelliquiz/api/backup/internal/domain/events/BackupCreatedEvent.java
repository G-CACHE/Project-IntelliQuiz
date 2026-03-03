package com.intelliquiz.api.backup.internal.domain.events;

/**
 * Domain event published when a backup is successfully created.
 */
public record BackupCreatedEvent(Long backupId, String filename, Long createdByUserId) {}
