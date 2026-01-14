# Design Document: Admin Self-Assignments

## Overview

This design adds a new REST endpoint `/api/users/me/assignments` that allows authenticated admin users to retrieve their own quiz assignments. The endpoint extracts the user identity from the JWT authentication context and returns all quiz assignments for that user, including quiz details and granted permissions.

## Architecture

The feature follows the existing layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  UserController.java - new getMyAssignments() endpoint      │
│  QuizAssignmentResponse.java - new response DTO             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  UserManagementService.java - existing getUserAssignments() │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  QuizAssignment entity - existing                           │
│  QuizAssignmentRepository - existing findByUser()           │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### New Components

#### QuizAssignmentResponse (DTO)

```java
package com.intelliquiz.api.presentation.dto.response;

public record QuizAssignmentResponse(
    Long id,
    Long quizId,
    String quizTitle,
    Set<AdminPermission> permissions
) {
    public static QuizAssignmentResponse from(QuizAssignment assignment) {
        return new QuizAssignmentResponse(
            assignment.getId(),
            assignment.getQuiz().getId(),
            assignment.getQuiz().getTitle(),
            assignment.getPermissions()
        );
    }
}
```

### Modified Components

#### UserController - New Endpoint

```java
@GetMapping("/me/assignments")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public ResponseEntity<List<QuizAssignmentResponse>> getMyAssignments() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String username = auth.getName();
    
    User user = userManagementService.getAdminByUsername(username);
    List<QuizAssignmentResponse> assignments = userManagementService
        .getUserAssignments(user.getId())
        .stream()
        .map(QuizAssignmentResponse::from)
        .toList();
    return ResponseEntity.ok(assignments);
}
```

## Data Models

### QuizAssignmentResponse

| Field | Type | Description |
|-------|------|-------------|
| id | Long | Unique identifier of the assignment |
| quizId | Long | ID of the assigned quiz |
| quizTitle | String | Title of the assigned quiz |
| permissions | Set<AdminPermission> | Set of granted permissions |

### API Response Example

```json
[
  {
    "id": 1,
    "quizId": 10,
    "quizTitle": "Science Quiz 2024",
    "permissions": ["CAN_VIEW_DETAILS", "CAN_EDIT_CONTENT"]
  },
  {
    "id": 2,
    "quizId": 15,
    "quizTitle": "Math Challenge",
    "permissions": ["CAN_VIEW_DETAILS", "CAN_HOST_GAME"]
  }
]
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Self-assignment retrieval correctness

*For any* authenticated user (ADMIN or SUPER_ADMIN role), calling GET `/api/users/me/assignments` SHALL return exactly the quiz assignments that belong to that user in the database.

**Validates: Requirements 1.1, 1.2, 1.4**

### Property 2: Response completeness

*For any* quiz assignment returned by the endpoint, the response SHALL contain a non-null assignment ID, quiz ID, quiz title, and the complete set of permissions granted to the user for that quiz.

**Validates: Requirements 2.1, 2.3**

### Property 3: Permission serialization round-trip

*For any* set of AdminPermission values, serializing to JSON and deserializing back SHALL produce an equivalent set with permission names matching the enum constants.

**Validates: Requirements 2.2**

### Property 4: User isolation

*For any* two distinct users with different quiz assignments, calling the endpoint as user A SHALL never return assignments belonging to user B.

**Validates: Requirements 3.2, 3.4**

## Error Handling

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| No JWT token provided | 401 Unauthorized | `{"error": "Unauthorized", "message": "JWT token missing or invalid"}` |
| Invalid/expired JWT token | 401 Unauthorized | `{"error": "Unauthorized", "message": "JWT token missing or invalid"}` |
| User not found in database | 404 Not Found | `{"error": "Not Found", "message": "User with username {username} not found"}` |
| User has no assignments | 200 OK | `[]` (empty array) |

## Testing Strategy

### Property-Based Testing

The project uses **jqwik** for property-based testing. Each correctness property will be implemented as a property test with minimum 100 iterations.

**Test Configuration:**
- Framework: jqwik (already configured in pom.xml)
- Minimum iterations: 100 per property
- Each test tagged with: `Feature: admin-self-assignments, Property N: {property_text}`

### Unit Tests

Unit tests will cover:
- Specific examples of successful assignment retrieval
- Edge case: user with no assignments returns empty list
- Error case: unauthenticated request returns 401
- Error case: deleted user returns 404

### Test File Location

- Property tests: `backend/src/test/java/com/intelliquiz/api/application/services/SelfAssignmentPropertyTest.java`
- Unit tests: Co-located with property tests or in controller test class
