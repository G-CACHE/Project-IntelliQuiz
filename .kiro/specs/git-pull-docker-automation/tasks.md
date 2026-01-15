# Implementation Plan: Git Pull Docker Automation

## Overview

This plan implements the automated Docker rebuild system triggered by Git pull operations. We'll create a single Python script that consolidates existing functionality and adds change detection, then create a Git hook to trigger it automatically.

## Tasks

- [x] 1. Create the core Docker automation script
  - [x] 1.1 Create `docker_automation.py` with base class structure and CLI argument parsing
    - Create the main script file with argparse setup
    - Define the DockerAutomation class with __init__ method
    - Add configuration dataclass for settings
    - _Requirements: 4.2, 4.3_

  - [x] 1.2 Implement Docker prerequisite checks
    - Add check_docker_installed method
    - Add check_docker_daemon method  
    - Add check_docker_compose method
    - Reuse logic from existing setup_and_run_docker.py
    - _Requirements: 5.1, 5.2_

  - [x] 1.3 Implement container lifecycle methods
    - Add stop_containers method using `docker-compose down` (without -v flag)
    - Add build_containers method using `docker-compose build`
    - Add start_containers method using `docker-compose up -d`
    - Add wait_for_health method with timeout
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Implement change detection logic
  - [x] 2.1 Create the pattern matching module
    - Define REBUILD_PATTERNS list (backend/**, Dockerfile, docker-compose.yml, pom.xml)
    - Define SKIP_PATTERNS list (frontend/**, *.md, document/**)
    - Implement file_matches_pattern function using fnmatch
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Implement get_changed_files method
    - Use `git diff --name-only HEAD@{1} HEAD` to get changed files after merge
    - Handle case where this is first pull (no HEAD@{1})
    - Return list of changed file paths
    - _Requirements: 2.1_

  - [x] 2.3 Implement should_rebuild decision logic
    - Check each changed file against rebuild patterns
    - Return True if any file matches rebuild pattern
    - Return False if all files match only skip patterns
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.4 Write property tests for pattern matching
    - **Property 1: Rebuild Pattern Matching**
    - **Property 2: Skip Pattern Exclusivity**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 3. Implement override mechanisms
  - [x] 3.1 Add environment variable check for SKIP_DOCKER_REBUILD
    - Check os.environ for SKIP_DOCKER_REBUILD
    - If set to "1", skip rebuild and notify user
    - _Requirements: 4.1_

  - [x] 3.2 Implement --force flag handling
    - When force=True, bypass should_rebuild check
    - Always proceed with rebuild
    - _Requirements: 4.2_

  - [x] 3.3 Write property tests for override mechanisms
    - **Property 3: Environment Variable Override**
    - **Property 4: Force Flag Override**
    - **Validates: Requirements 4.1, 4.2**

- [x] 4. Implement Git hook management
  - [x] 4.1 Create install_hook method
    - Generate hook script content
    - Write to .git/hooks/post-merge
    - Set executable permissions (chmod +x on Unix, icacls on Windows)
    - Check for existing hook and prompt if exists
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 4.2 Create uninstall_hook method
    - Check if hook exists
    - Remove the hook file
    - Confirm removal to user
    - _Requirements: 6.3_

  - [x] 4.3 Create the post-merge hook script template
    - Write portable bash script
    - Include notification message
    - Call docker_automation.py with --post-merge flag
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 5. Implement logging and status reporting
  - [x] 5.1 Add logging to file
    - Create log file at docker_automation.log
    - Log all operations with timestamps
    - Log errors with full details
    - _Requirements: 5.4_

  - [x] 5.2 Implement status display methods
    - Add progress messages for each step
    - Add success message with service URLs
    - Add error messages with step identification
    - Reuse display logic from existing scripts
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. Implement main workflow orchestration
  - [x] 6.1 Create the main run method
    - Check for SKIP_DOCKER_REBUILD environment variable
    - Get changed files (if post-merge mode)
    - Determine if rebuild needed (or force)
    - Execute: stop → build → start → health check
    - Display final status
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2_

  - [x] 6.2 Wire up CLI to run method
    - Parse arguments
    - Handle --install-hook and --uninstall-hook
    - Handle --rebuild, --stop, --logs modes
    - Call appropriate methods
    - _Requirements: 4.2, 4.3, 6.1, 6.3_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integration and documentation
  - [x] 8.1 Test end-to-end workflow manually
    - Install hook using --install-hook
    - Make a test change and pull
    - Verify automation triggers
    - Test --force and SKIP_DOCKER_REBUILD
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.2_

  - [x] 8.2 Update README or create usage documentation
    - Document installation steps
    - Document CLI options
    - Document environment variables
    - _Requirements: 6.1_

## Notes

- All tasks are required including property-based tests
- The script consolidates functionality from run_docker.py and setup_and_run_docker.py
- Volume preservation is critical - never use `docker-compose down -v`
- The hook must work on Windows (Git Bash), macOS, and Linux
