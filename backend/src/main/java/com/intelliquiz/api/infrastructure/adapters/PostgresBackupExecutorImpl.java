package com.intelliquiz.api.infrastructure.adapters;

import com.intelliquiz.api.domain.exceptions.BackupException;
import com.intelliquiz.api.domain.ports.PostgresBackupExecutor;
import com.intelliquiz.api.infrastructure.config.BackupProperties;
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

        List<String> command = buildPgDumpCommand(outputPath);
        
        logger.info("Starting database backup to: {}", outputPath);
        logger.debug("Backup command: {}", String.join(" ", command));
        
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.environment().put("PGPASSWORD", backupProperties.getPostgresPassword());
            processBuilder.redirectErrorStream(false);
            
            Process process = processBuilder.start();
            
            // Read stderr for errors
            String errorOutput = readStream(process.getErrorStream());
            String stdOutput = readStream(process.getInputStream());
            
            boolean completed = process.waitFor(COMMAND_TIMEOUT_MINUTES, TimeUnit.MINUTES);
            
            if (!completed) {
                process.destroyForcibly();
                throw new BackupException("Backup operation timed out after " + COMMAND_TIMEOUT_MINUTES + " minutes");
            }
            
            int exitCode = process.exitValue();
            if (exitCode != 0) {
                String errorMsg = errorOutput.isEmpty() ? stdOutput : errorOutput;
                throw new BackupException("pg_dump failed with exit code " + exitCode + ": " + errorMsg);
            }
            
            if (!Files.exists(outputPath)) {
                throw new BackupException("Backup file was not created");
            }
            
            long fileSize = Files.size(outputPath);
            logger.info("Backup completed successfully. File size: {} bytes", fileSize);
            
            return fileSize;
            
        } catch (IOException e) {
            throw new BackupException("Failed to execute pg_dump command: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BackupException("Backup operation was interrupted", e);
        }
    }

    @Override
    public void restoreFromDump(Path backupPath) {
        if (!Files.exists(backupPath)) {
            throw new BackupException("Backup file does not exist: " + backupPath);
        }
        
        List<String> command = buildPsqlRestoreCommand(backupPath);
        
        logger.info("Starting database restore from: {}", backupPath);
        
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.environment().put("PGPASSWORD", backupProperties.getPostgresPassword());
            processBuilder.redirectErrorStream(false);
            
            Process process = processBuilder.start();
            
            // Read stderr for errors
            String errorOutput = readStream(process.getErrorStream());
            String stdOutput = readStream(process.getInputStream());
            
            boolean completed = process.waitFor(COMMAND_TIMEOUT_MINUTES, TimeUnit.MINUTES);
            
            if (!completed) {
                process.destroyForcibly();
                throw new BackupException("Restore operation timed out after " + COMMAND_TIMEOUT_MINUTES + " minutes");
            }
            
            int exitCode = process.exitValue();
            if (exitCode != 0) {
                String errorMsg = errorOutput.isEmpty() ? stdOutput : errorOutput;
                throw new BackupException("psql restore failed with exit code " + exitCode + ": " + errorMsg);
            }
            
            logger.info("Restore completed successfully");
            
        } catch (IOException e) {
            throw new BackupException("Failed to execute psql restore command: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BackupException("Restore operation was interrupted", e);
        }
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
        command.add("-f");
        command.add(backupPath.toString());
        return command;
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
