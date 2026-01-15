# Requirements Document

## Introduction

This feature automates the Docker container rebuild and restart process after a `git pull` operation. When developers pull new changes from the repository, the system will automatically stop running containers, rebuild images with the new code, and restart the services - eliminating manual steps and ensuring everyone runs the latest code.

## Glossary

- **Git_Hook**: A script that Git executes automatically before or after events such as commit, push, or merge
- **Post_Merge_Hook**: A Git hook that runs after a successful `git pull` that results in a merge
- **Docker_Compose**: A tool for defining and running multi-container Docker applications
- **Automation_Script**: The Python script that orchestrates the stop, build, and run workflow

## Requirements

### Requirement 1: Git Post-Merge Hook

**User Story:** As a developer, I want the Docker rebuild process to trigger automatically after I pull changes, so that I don't have to remember to run manual commands.

#### Acceptance Criteria

1. WHEN a `git pull` results in new changes being merged, THE Post_Merge_Hook SHALL execute the Automation_Script
2. WHEN a `git pull` results in "Already up to date", THE Post_Merge_Hook SHALL NOT execute (no merge event occurs)
3. THE Post_Merge_Hook SHALL be a shell script compatible with Windows (Git Bash), macOS, and Linux
4. WHEN the Post_Merge_Hook executes, THE Post_Merge_Hook SHALL display a notification that automation is starting

### Requirement 2: Smart Change Detection

**User Story:** As a developer, I want the system to only rebuild Docker containers when relevant files change, so that I don't waste time on unnecessary rebuilds.

#### Acceptance Criteria

1. WHEN changes are detected in backend source files (backend/**), THE Automation_Script SHALL trigger a full rebuild
2. WHEN changes are detected in Docker configuration files (Dockerfile, docker-compose.yml), THE Automation_Script SHALL trigger a full rebuild
3. WHEN changes are detected ONLY in frontend files, documentation, or scripts, THE Automation_Script SHALL skip the rebuild and notify the user
4. THE Automation_Script SHALL compare the list of changed files against a configurable pattern list

### Requirement 3: Docker Container Lifecycle Management

**User Story:** As a developer, I want the automation to properly stop, rebuild, and restart containers, so that I always have a clean environment with the latest code.

#### Acceptance Criteria

1. WHEN a rebuild is triggered, THE Automation_Script SHALL first stop all running project containers using `docker-compose down`
2. WHEN stopping containers, THE Automation_Script SHALL preserve database volumes to prevent data loss
3. WHEN containers are stopped, THE Automation_Script SHALL rebuild images using `docker-compose build`
4. WHEN images are rebuilt, THE Automation_Script SHALL start containers using `docker-compose up -d`
5. WHEN containers are started, THE Automation_Script SHALL wait for health checks to pass before reporting success

### Requirement 4: Manual Override Options

**User Story:** As a developer, I want to be able to skip or force the automation, so that I have control when needed.

#### Acceptance Criteria

1. WHEN a developer sets the environment variable `SKIP_DOCKER_REBUILD=1`, THE Automation_Script SHALL skip the rebuild process
2. THE Automation_Script SHALL support a `--force` flag to rebuild even when no relevant changes are detected
3. THE Automation_Script SHALL support a `--skip-pull` flag to rebuild without pulling code (for manual triggers)

### Requirement 5: Status Reporting and Logging

**User Story:** As a developer, I want clear feedback about what the automation is doing, so that I can understand the process and troubleshoot issues.

#### Acceptance Criteria

1. WHEN the automation runs, THE Automation_Script SHALL display progress messages for each step
2. WHEN an error occurs, THE Automation_Script SHALL display a clear error message and the failing step
3. WHEN the automation completes successfully, THE Automation_Script SHALL display service URLs and connection details
4. THE Automation_Script SHALL log all operations to a file for troubleshooting

### Requirement 6: Hook Installation Helper

**User Story:** As a developer, I want an easy way to install the Git hook, so that I can set up the automation quickly.

#### Acceptance Criteria

1. THE Automation_Script SHALL provide an `--install-hook` command to install the post-merge hook
2. WHEN installing the hook, THE Automation_Script SHALL check if a hook already exists and prompt before overwriting
3. THE Automation_Script SHALL provide an `--uninstall-hook` command to remove the hook
4. WHEN the hook is installed, THE Automation_Script SHALL verify the hook is executable
