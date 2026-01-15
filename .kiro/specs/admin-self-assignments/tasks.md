# Implementation Plan: Admin Self-Assignments

## Overview

This implementation adds a self-service endpoint for admin users to retrieve their own quiz assignments. The changes are minimal since the service layer already has the required methods.

## Tasks

- [x] 1. Create QuizAssignmentResponse DTO
  - Create `QuizAssignmentResponse.java` in `presentation/dto/response/`
  - Include fields: id, quizId, quizTitle, permissions
  - Add static `from(QuizAssignment)` factory method
  - Add OpenAPI schema annotations
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Add getMyAssignments endpoint to UserController
  - [x] 2.1 Implement the endpoint method
    - Add `@GetMapping("/me/assignments")` endpoint
    - Add `@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")` annotation
    - Extract username from SecurityContextHolder
    - Call existing service methods to get assignments
    - Map to QuizAssignmentResponse DTOs
    - Add OpenAPI documentation annotations
    - _Requirements: 1.1, 1.2, 1.4, 3.1, 3.2_

  - [x] 2.2 Write property test for self-assignment retrieval correctness
    - **Property 1: Self-assignment retrieval correctness**
    - **Validates: Requirements 1.1, 1.2, 1.4**

  - [x] 2.3 Write property test for response completeness
    - **Property 2: Response completeness**
    - **Validates: Requirements 2.1, 2.3**

  - [x] 2.4 Write property test for permission serialization round-trip
    - **Property 3: Permission serialization round-trip**
    - **Validates: Requirements 2.2**

  - [x] 2.5 Write property test for user isolation
    - **Property 4: User isolation**
    - **Validates: Requirements 3.2, 3.4**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required including property tests
- Each task references specific requirements for traceability
- The implementation reuses existing `UserManagementService.getAdminByUsername()` and `getUserAssignments()` methods
- Property tests use jqwik framework already configured in the project
