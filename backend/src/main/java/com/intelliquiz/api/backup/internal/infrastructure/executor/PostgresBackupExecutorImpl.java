package com.intelliquiz.api.backup.internal.infrastructure.executor;

import com.intelliquiz.api.shared.exceptions.BackupException;
import com.intelliquiz.api.backup.internal.domain.ports.PostgresBackupExecutor;
import com.intelliquiz.api.backup.internal.infrastructure.config.BackupProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Implementation of PostgresBackupExecutor using pg_dump and psql commands.
 * Works both in Docker containers (where pg_dump is available) and on host machines.
 */
@Component
public class PostgresBackupExecutorImpl implements PostgresBackupExecutor {

    private static final Logger logger = LoggerFactory.getLogger(PostgresBackupExecutorImpl.class);
    private static final int COMMAND_TIMEOUT_MINUTES = 30;

    private final BackupProperties backupProperties;

    public PostgresBackupExecutorImpl(BackupProperties backupProperties) {
        this.backupProperties = backupProperties;
    }

    @Override
    public long createDump(Path outputPath) {
        // Ensure backup directory exists
        try {
            Files.createDirectories(outputPath.getParent());
        } catch (IOException e) {
            throw new BackupException("Failed to create backup directory", e);
        }

        logger.info("Starting database backup to: {}", outputPath);

        if (backupProperties.isUseDockerExec()) {
            return createDumpViaDocker(outputPath);
        } else {
            return createDumpLocally(outputPath);
        }
    }

    /**
     * Runs pg_dump inside the Docker container, then copies the dump file to the host.
     * This avoids client/server version mismatch since the container ships its own pg_dump.
     */
    private long createDumpViaDocker(Path outputPath) {
        String containerName = backupProperties.getDockerContainerName();
        String containerDumpPath = "/tmp/" + outputPath.getFileName();

        // Step 1: Run pg_dump inside the container
        List<String> dumpCommand = new ArrayList<>();
        dumpCommand.add("docker");
        dumpCommand.add("exec");
        dumpCommand.add("-e");
        dumpCommand.add("PGPASSWORD=" + backupProperties.getPostgresPassword());
        dumpCommand.add(containerName);
        dumpCommand.add("pg_dump");
        dumpCommand.add("-h");
        dumpCommand.add("localhost");
        dumpCommand.add("-p");
        dumpCommand.add("5432"); // Internal container port is always 5432
        dumpCommand.add("-U");
        dumpCommand.add(backupProperties.getPostgresUsername());
        dumpCommand.add("-d");
        dumpCommand.add(backupProperties.getPostgresDatabase());
        dumpCommand.add("-f");
        dumpCommand.add(containerDumpPath);
        dumpCommand.add("--clean");
        dumpCommand.add("--if-exists");

        logger.debug("Docker pg_dump command: {}", String.join(" ", dumpCommand));
        executeProcess(dumpCommand, null, "pg_dump (docker exec)");

        // Step 2: Copy the dump file from the container to the host
        List<String> copyCommand = List.of(
                "docker", "cp",
                containerName + ":" + containerDumpPath,
                outputPath.toString()
        );
        logger.debug("Docker cp command: {}", String.join(" ", copyCommand));
        executeProcess(copyCommand, null, "docker cp");

        // Step 3: Clean up the dump file inside the container
        List<String> cleanupCommand = List.of(
                "docker", "exec", containerName, "rm", "-f", containerDumpPath
        );
        executeProcess(cleanupCommand, null, "docker rm temp dump");

        if (!Files.exists(outputPath)) {
            throw new BackupException("Backup file was not created after docker cp");
        }

        try {
            long fileSize = Files.size(outputPath);
            logger.info("Backup completed successfully via Docker. File size: {} bytes", fileSize);
            return fileSize;
        } catch (IOException e) {
            throw new BackupException("Failed to read backup file size", e);
        }
    }

    /**
     * Runs pg_dump on the local host directly (original behavior).
     * Requires a locally installed pg_dump version >= the server version.
     */
    private long createDumpLocally(Path outputPath) {
        List<String> command = buildPgDumpCommand(outputPath);
        logger.debug("Local pg_dump command: {}", String.join(" ", command));

        executeProcess(command, backupProperties.getPostgresPassword(), "pg_dump (local)");

        if (!Files.exists(outputPath)) {
            throw new BackupException("Backup file was not created");
        }

        try {
            long fileSize = Files.size(outputPath);
            logger.info("Backup completed successfully. File size: {} bytes", fileSize);
            return fileSize;
        } catch (IOException e) {
            throw new BackupException("Failed to read backup file size", e);
        }
    }

    @Override
    public void restoreFromDump(Path backupPath) {
        if (!Files.exists(backupPath)) {
            throw new BackupException("Backup file does not exist: " + backupPath);
        }

        logger.info("Starting database restore from: {}", backupPath);

        if (backupProperties.isUseDockerExec()) {
            restoreViaDocker(backupPath);
        } else {
            restoreLocally(backupPath);
        }
    }

    /**
     * Copies the dump file into the Docker container, then runs psql inside it.
     */
    private void restoreViaDocker(Path backupPath) {
        String containerName = backupProperties.getDockerContainerName();
        String containerDumpPath = "/tmp/" + backupPath.getFileName();

        // Step 1: Copy the dump file into the container
        List<String> copyCommand = List.of(
                "docker", "cp",
                backupPath.toString(),
                containerName + ":" + containerDumpPath
        );
        executeProcess(copyCommand, null, "docker cp (restore)");

        // Step 2: Run psql inside the container to restore
        // --single-transaction: wrap entire restore in one transaction (atomic)
        // -v ON_ERROR_STOP=1: stop on first error instead of silently continuing
        List<String> restoreCommand = new ArrayList<>();
        restoreCommand.add("docker");
        restoreCommand.add("exec");
        restoreCommand.add("-e");
        restoreCommand.add("PGPASSWORD=" + backupProperties.getPostgresPassword());
        restoreCommand.add(containerName);
        restoreCommand.add("psql");
        restoreCommand.add("-h");
        restoreCommand.add("localhost");
        restoreCommand.add("-p");
        restoreCommand.add("5432");
        restoreCommand.add("-U");
        restoreCommand.add(backupProperties.getPostgresUsername());
        restoreCommand.add("-d");
        restoreCommand.add(backupProperties.getPostgresDatabase());
        restoreCommand.add("--single-transaction");
        restoreCommand.add("-v");
        restoreCommand.add("ON_ERROR_STOP=1");
        restoreCommand.add("-f");
        restoreCommand.add(containerDumpPath);

        executeProcess(restoreCommand, null, "psql restore (docker exec)");

        // Step 3: Clean up the dump file inside the container
        List<String> cleanupCommand = List.of(
                "docker", "exec", containerName, "rm", "-f", containerDumpPath
        );
        executeProcess(cleanupCommand, null, "docker rm temp dump (restore)");

        logger.info("Restore completed successfully via Docker");
    }

    /**
     * Runs psql on the local host directly (original behavior).
     */
    private void restoreLocally(Path backupPath) {
        List<String> command = buildPsqlRestoreCommand(backupPath);
        executeProcess(command, backupProperties.getPostgresPassword(), "psql restore (local)");
        logger.info("Restore completed successfully");
    }

    private List<String> buildPgDumpCommand(Path outputPath) {
        List<String> command = new ArrayList<>();
        command.add("pg_dump");
        command.add("-h");
        command.add(backupProperties.getPostgresHost());
        command.add("-p");
        command.add(String.valueOf(backupProperties.getPostgresPort()));
        command.add("-U");
        command.add(backupProperties.getPostgresUsername());
        command.add("-d");
        command.add(backupProperties.getPostgresDatabase());
        command.add("-f");
        command.add(outputPath.toString());
        command.add("--clean");
        command.add("--if-exists");
        return command;
    }

    private List<String> buildPsqlRestoreCommand(Path backupPath) {
        List<String> command = new ArrayList<>();
        command.add("psql");
        command.add("-h");
        command.add(backupProperties.getPostgresHost());
        command.add("-p");
        command.add(String.valueOf(backupProperties.getPostgresPort()));
        command.add("-U");
        command.add(backupProperties.getPostgresUsername());
        command.add("-d");
        command.add(backupProperties.getPostgresDatabase());
        command.add("--single-transaction");
        command.add("-v");
        command.add("ON_ERROR_STOP=1");
        command.add("-f");
        command.add(backupPath.toString());
        return command;
    }

    /**
     * Executes a process, waits for completion, and throws on failure.
     * @param command       the command to run
     * @param pgPassword    if non-null, sets PGPASSWORD env var (for local commands)
     * @param operationName human-readable label for error messages
     */
    private void executeProcess(List<String> command, String pgPassword, String operationName) {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            if (pgPassword != null) {
                processBuilder.environment().put("PGPASSWORD", pgPassword);
            }
            processBuilder.redirectErrorStream(false);

            Process process = processBuilder.start();

            String errorOutput = readStream(process.getErrorStream());
            String stdOutput = readStream(process.getInputStream());

            boolean completed = process.waitFor(COMMAND_TIMEOUT_MINUTES, TimeUnit.MINUTES);

            if (!completed) {
                process.destroyForcibly();
                throw new BackupException(operationName + " timed out after " + COMMAND_TIMEOUT_MINUTES + " minutes");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                String errorMsg = errorOutput.isEmpty() ? stdOutput : errorOutput;
                throw new BackupException(operationName + " failed with exit code " + exitCode + ": " + errorMsg);
            }

        } catch (IOException e) {
            throw new BackupException("Failed to execute " + operationName + ": " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BackupException(operationName + " was interrupted", e);
        }
    }

    private String readStream(java.io.InputStream inputStream) throws IOException {
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }
        return output.toString();
    }
}
