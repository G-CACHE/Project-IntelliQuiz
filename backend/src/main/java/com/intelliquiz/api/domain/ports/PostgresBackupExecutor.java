package com.intelliquiz.api.domain.ports;

import java.nio.file.Path;

/**
 * Interface for executing PostgreSQL backup and restore operations.
 */
public interface PostgresBackupExecutor {

    /**
     * Creates a PostgreSQL dump file.
     *
     * @param outputPath the path where the dump file will be created
     * @return the size of the created file in bytes
     * @throws com.intelliquiz.api.domain.exceptions.BackupException if the dump operation fails
     */
    long createDump(Path outputPath);

    /**
     * Restores the database from a dump file.
     *
     * @param backupPath the path to the backup file
     * @throws com.intelliquiz.api.domain.exceptions.BackupException if the restore operation fails
     */
    void restoreFromDump(Path backupPath);
}
