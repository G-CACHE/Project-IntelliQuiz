package com.intelliquiz.api.backup.internal.domain.events;

/**
 * Domain event published when a database restore completes successfully.
 */
public record BackupRestoredEvent(Long backupId, String filename, Long restoredByUserId) {}
