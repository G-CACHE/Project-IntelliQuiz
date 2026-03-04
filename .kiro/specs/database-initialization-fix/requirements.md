# Requirements Document: Database Initialization Fix

## Introduction

The database initialization process fails when teammates run `run_docker_prod.py` followed by `verify_db_setup.py`. The backup SQL file contains a corrupted header that prevents PostgreSQL from loading the schema and data. This causes the database to start with missing tables (like `game_session`) and empty data, breaking the application setup.

## Glossary

- **Backup File**: `database/backup_intelliquiz.sql` - PostgreSQL dump containing schema and data
- **Docker Image**: `gm1026/intelliquiz-db:latest` - Pre-built PostgreSQL container image
- **Initialization Script**: `database/init-db.sh` - Script that runs when PostgreSQL container starts
- **Dockerfile**: `database/Dockerfile` - Container definition that copies backup file
- **Verification Script**: `verify_db_setup.py` - Script that checks if database is properly initialized

## Requirements

### Requirement 1: Fix Corrupted Backup File

**User Story:** As a team member, I want the backup SQL file to be valid, so that the database initializes correctly when I run the production setup.

#### Acceptance Criteria

1. WHEN the PostgreSQL container starts, THE Backup_File SHALL contain valid SQL syntax without corrupted headers
2. WHEN the backup file is loaded, THE Database_Loader SHALL successfully execute all SQL statements without errors
3. WHEN the database initialization completes, THE Database SHALL contain all required tables (users, quizzes, questions, teams, submissions, game_session, etc.)
4. WHEN the database initialization completes, THE Database SHALL contain all required data (users, quizzes, teams, etc.)

### Requirement 2: Ensure Backup File Integrity

**User Story:** As a developer, I want to ensure the backup file is properly formatted, so that it can be reliably used for database initialization.

#### Acceptance Criteria

1. WHEN the backup file is examined, THE Backup_File SHALL start with valid PostgreSQL dump headers (e.g., `-- PostgreSQL database dump`)
2. WHEN the backup file is examined, THE Backup_File SHALL NOT contain any corrupted or binary data in the header section
3. WHEN the backup file is loaded into PostgreSQL, THE Database_Loader SHALL report success without warnings or errors

### Requirement 3: Verify Database Initialization Success

**User Story:** As a team member, I want to verify that the database is properly initialized, so that I know the setup is complete and correct.

#### Acceptance Criteria

1. WHEN `verify_db_setup.py` is run after setup, THE Verification_Script SHALL report that all required tables exist
2. WHEN `verify_db_setup.py` is run after setup, THE Verification_Script SHALL report that the `game_session` table is found
3. WHEN `verify_db_setup.py` is run after setup, THE Verification_Script SHALL report that all tables contain expected data (non-zero row counts for populated tables)

### Requirement 4: Document Database Setup Process

**User Story:** As a new team member, I want clear documentation on how the database initialization works, so that I can troubleshoot issues if they arise.

#### Acceptance Criteria

1. THE Documentation SHALL explain how the backup file is used during container initialization
2. THE Documentation SHALL explain the role of the Dockerfile and init-db.sh script
3. THE Documentation SHALL provide troubleshooting steps if database initialization fails
4. THE Documentation SHALL include commands to verify database status and view initialization logs

