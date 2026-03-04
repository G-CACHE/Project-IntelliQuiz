# Requirements Document

## Introduction

This document specifies the requirements for a database seeder system that populates the IntelliQuiz database with realistic test data. The seeder will create users (including a specific superadmin), quizzes with questions, teams, submissions, and related data to support development and testing activities.

## Glossary

- **Seeder**: A script or tool that populates database tables with predefined or generated test data
- **Superadmin**: A user with SUPER_ADMIN system role having full system access
- **Quiz**: A collection of questions that can be assigned to users and played by teams
- **Question**: An individual quiz item with a correct answer, difficulty level, and point value
- **Team**: A group participating in a quiz with an access code and score tracking
- **Submission**: A team's answer to a specific question with grading information
- **Quiz_Assignment**: A relationship linking users to quizzes they can manage
- **Assignment_Permission**: Specific permissions granted to users for quiz assignments
- **BCrypt**: Password hashing algorithm used for secure password storage

## Requirements

### Requirement 1: Superadmin User Creation

**User Story:** As a system administrator, I want a specific superadmin user created with known credentials, so that I can access the system for testing and administration.

#### Acceptance Criteria

1. THE Seeder SHALL create a user with username "superadminsimone"
2. THE Seeder SHALL set the password to "simone123" using BCrypt hashing
3. THE Seeder SHALL assign the SUPER_ADMIN system role to this user
4. WHEN the seeder runs multiple times, THE Seeder SHALL ensure the superadmin user exists without creating duplicates

### Requirement 2: Additional User Creation

**User Story:** As a developer, I want multiple test users with different roles, so that I can test role-based functionality.

#### Acceptance Criteria

1. THE Seeder SHALL create at least 3 additional users with ADMIN role
2. THE Seeder SHALL create at least 2 additional users with SUPER_ADMIN role
3. THE Seeder SHALL generate unique usernames for all users
4. THE Seeder SHALL use BCrypt to hash all user passwords
5. WHEN the seeder runs, THE Seeder SHALL use realistic and varied usernames

### Requirement 3: Quiz Creation

**User Story:** As a developer, I want realistic quiz data, so that I can test quiz management and gameplay features.

#### Acceptance Criteria

1. THE Seeder SHALL create at least 5 quizzes with varied content
2. THE Seeder SHALL set realistic titles and descriptions for each quiz
3. THE Seeder SHALL generate unique proctor PINs for each quiz
4. THE Seeder SHALL create quizzes with different statuses (DRAFT, READY, ARCHIVED)
5. THE Seeder SHALL create both live session and non-live session quizzes

### Requirement 4: Question Creation

**User Story:** As a developer, I want quizzes populated with questions, so that I can test question display and answer validation.

#### Acceptance Criteria

1. THE Seeder SHALL create at least 5 questions for each quiz
2. THE Seeder SHALL create questions with both MULTIPLE_CHOICE and IDENTIFICATION types
3. THE Seeder SHALL assign varied difficulty levels (EASY, MEDIUM, HARD, TIE_BREAKER)
4. THE Seeder SHALL set appropriate point values based on difficulty
5. THE Seeder SHALL create question options for MULTIPLE_CHOICE questions
6. THE Seeder SHALL set correct answer keys for all questions
7. THE Seeder SHALL assign sequential order_index values to questions within each quiz

### Requirement 5: Team Creation

**User Story:** As a developer, I want teams associated with quizzes, so that I can test team-based gameplay.

#### Acceptance Criteria

1. THE Seeder SHALL create at least 3 teams for each quiz
2. THE Seeder SHALL generate unique access codes for each team
3. THE Seeder SHALL assign realistic team names
4. THE Seeder SHALL initialize total_score values for teams
5. THE Seeder SHALL associate each team with a specific quiz

### Requirement 6: Submission Creation

**User Story:** As a developer, I want submission data for teams, so that I can test scoring and grading functionality.

#### Acceptance Criteria

1. THE Seeder SHALL create submissions for multiple teams across different questions
2. THE Seeder SHALL create both correct and incorrect submissions
3. THE Seeder SHALL set realistic submitted_answer values
4. THE Seeder SHALL mark submissions as graded with appropriate awarded_points
5. THE Seeder SHALL set submitted_at timestamps in chronological order
6. THE Seeder SHALL ensure submissions reference valid questions and teams

### Requirement 7: Quiz Assignment Creation

**User Story:** As a developer, I want users assigned to quizzes with permissions, so that I can test access control.

#### Acceptance Criteria

1. THE Seeder SHALL create quiz assignments linking users to quizzes
2. THE Seeder SHALL ensure each user is assigned to at least one quiz
3. THE Seeder SHALL ensure the superadmin user has assignments to multiple quizzes
4. THE Seeder SHALL create varied assignment patterns across users and quizzes
5. WHEN creating assignments, THE Seeder SHALL respect the unique constraint on (user_id, quiz_id)

### Requirement 8: Assignment Permission Creation

**User Story:** As a developer, I want permissions assigned to quiz assignments, so that I can test permission-based features.

#### Acceptance Criteria

1. THE Seeder SHALL create permissions for quiz assignments
2. THE Seeder SHALL use all available permission types (CAN_VIEW_DETAILS, CAN_EDIT_CONTENT, CAN_MANAGE_TEAMS, CAN_HOST_GAME)
3. THE Seeder SHALL assign varied permission combinations to different assignments
4. THE Seeder SHALL ensure superadmin assignments have all permissions

### Requirement 9: Idempotent Seeding

**User Story:** As a developer, I want the seeder to run safely multiple times, so that I can reset test data without errors.

#### Acceptance Criteria

1. WHEN the seeder runs on a populated database, THE Seeder SHALL clear existing data before seeding
2. WHEN the seeder runs, THE Seeder SHALL respect foreign key constraints during deletion
3. WHEN the seeder runs, THE Seeder SHALL reset sequence values appropriately
4. THE Seeder SHALL complete successfully without constraint violations

### Requirement 10: Seeder Execution

**User Story:** As a developer, I want an easy way to run the seeder, so that I can quickly populate test data.

#### Acceptance Criteria

1. THE Seeder SHALL be executable as a standalone script
2. THE Seeder SHALL connect to the database using environment variables or configuration
3. WHEN the seeder completes, THE Seeder SHALL output a summary of created records
4. IF the seeder encounters errors, THEN THE Seeder SHALL provide clear error messages
5. THE Seeder SHALL complete execution within a reasonable time (under 30 seconds)
