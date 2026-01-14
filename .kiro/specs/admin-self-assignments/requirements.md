# Requirements Document

## Introduction

This feature enables admin users to retrieve their own quiz assignments without requiring SUPER_ADMIN privileges. Currently, the permission system is broken because regular admin users cannot fetch their assigned quizzes - the existing endpoint `GET /api/users/{userId}/assignments` requires SUPER_ADMIN role. This feature adds a new self-service endpoint that allows authenticated admin users to retrieve their own assignments, enabling the permission-based access control system to function correctly.

## Glossary

- **User**: An authenticated admin account in the system (ADMIN or SUPER_ADMIN role)
- **Quiz_Assignment**: A permission contract mapping a User to a Quiz with specific permissions
- **Admin_Permission**: Granular quiz-level permissions (CAN_VIEW_DETAILS, CAN_EDIT_CONTENT, CAN_MANAGE_TEAMS, CAN_HOST_GAME)
- **Authentication_Context**: The security context containing the currently authenticated user's identity
- **Self_Assignment_Endpoint**: The new `/api/users/me/assignments` endpoint for retrieving own assignments

## Requirements

### Requirement 1: Self-Assignment Retrieval Endpoint

**User Story:** As an admin user, I want to retrieve my own quiz assignments, so that I can see which quizzes I have access to and what permissions I have for each.

#### Acceptance Criteria

1. WHEN an authenticated admin user calls GET `/api/users/me/assignments` THEN the System SHALL return a list of their quiz assignments
2. WHEN an authenticated SUPER_ADMIN user calls GET `/api/users/me/assignments` THEN the System SHALL return a list of their quiz assignments
3. WHEN an unauthenticated user calls GET `/api/users/me/assignments` THEN the System SHALL return a 401 Unauthorized response
4. THE Self_Assignment_Endpoint SHALL extract the username from the Authentication_Context to identify the requesting user
5. THE Self_Assignment_Endpoint SHALL return an empty list when the user has no quiz assignments

### Requirement 2: Assignment Response Format

**User Story:** As an admin user, I want the assignment response to include quiz details and my permissions, so that I can understand what I can do with each assigned quiz.

#### Acceptance Criteria

1. WHEN returning quiz assignments THEN the System SHALL include the assignment ID, quiz ID, quiz title, and granted permissions for each assignment
2. THE Quiz_Assignment_Response SHALL serialize Admin_Permission values as strings matching the enum names
3. THE Quiz_Assignment_Response SHALL include all permissions granted to the user for each quiz

### Requirement 3: Security and Authorization

**User Story:** As a system administrator, I want the self-assignment endpoint to be properly secured, so that users can only access their own assignments.

#### Acceptance Criteria

1. THE Self_Assignment_Endpoint SHALL require a valid JWT token for authentication
2. THE Self_Assignment_Endpoint SHALL only return assignments belonging to the authenticated user
3. WHEN the authenticated user does not exist in the database THEN the System SHALL return a 404 Not Found response
4. THE Self_Assignment_Endpoint SHALL NOT allow users to retrieve other users' assignments through this endpoint
