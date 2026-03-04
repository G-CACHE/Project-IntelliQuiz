FROM postgres:18-alpine

# Copy the backup SQL file into the initialization directory
COPY backup_intelliquiz.sql /docker-entrypoint-initdb.d/

# Set proper permissions
RUN chmod 644 /docker-entrypoint-initdb.d/backup_intelliquiz.sql

# The postgres image will automatically run any .sql files in /docker-entrypoint-initdb.d/
# when the container starts for the first time
