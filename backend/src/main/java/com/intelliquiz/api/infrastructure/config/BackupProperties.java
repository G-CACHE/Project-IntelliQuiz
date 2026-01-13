package com.intelliquiz.api.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for database backup operations.
 */
@Component
@ConfigurationProperties(prefix = "backup")
public class BackupProperties {

    private String directory = "/app/backups";
    private String postgresHost = "db";
    private int postgresPort = 5432;
    private String postgresDatabase = "intelliquiz";
    private String postgresUsername = "postgres";
    private String postgresPassword = "mysecretpassword";

    public String getDirectory() {
        return directory;
    }

    public void setDirectory(String directory) {
        this.directory = directory;
    }

    public String getPostgresHost() {
        return postgresHost;
    }

    public void setPostgresHost(String postgresHost) {
        this.postgresHost = postgresHost;
    }

    public int getPostgresPort() {
        return postgresPort;
    }

    public void setPostgresPort(int postgresPort) {
        this.postgresPort = postgresPort;
    }

    public String getPostgresDatabase() {
        return postgresDatabase;
    }

    public void setPostgresDatabase(String postgresDatabase) {
        this.postgresDatabase = postgresDatabase;
    }

    public String getPostgresUsername() {
        return postgresUsername;
    }

    public void setPostgresUsername(String postgresUsername) {
        this.postgresUsername = postgresUsername;
    }

    public String getPostgresPassword() {
        return postgresPassword;
    }

    public void setPostgresPassword(String postgresPassword) {
        this.postgresPassword = postgresPassword;
    }
}
