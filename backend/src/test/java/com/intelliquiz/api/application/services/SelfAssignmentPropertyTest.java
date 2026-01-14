package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.QuizAssignment;
import com.intelliquiz.api.domain.entities.User;
import com.intelliquiz.api.domain.enums.AdminPermission;
import com.intelliquiz.api.domain.enums.QuizStatus;
import com.intelliquiz.api.domain.enums.SystemRole;
import com.intelliquiz.api.domain.ports.QuizAssignmentRepository;
import com.intelliquiz.api.domain.ports.QuizRepository;
import com.intelliquiz.api.domain.ports.UserRepository;
import com.intelliquiz.api.domain.ports.PasswordHashingService;
import com.intelliquiz.api.presentation.dto.response.QuizAssignmentResponse;
import net.jqwik.api.*;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for self-assignment retrieval.
 * 
 * Feature: admin-self-assignments
 */
public class SelfAssignmentPropertyTest {

    /**
     * Property 1: Self-assignment retrieval correctness
     * For any authenticated user (ADMIN or SUPER_ADMIN role), calling getUserAssignments
     * SHALL return exactly the quiz assignments that belong to that user.
     * 
     * Validates: Requirements 1.1, 1.2, 1.4
     */
    @Property(tries = 20)
    void selfAssignmentRetrievalReturnsExactUserAssignments(
            @ForAll("users") User user,
            @ForAll("assignmentLists") List<QuizAssignment> expectedAssignments) {
        
        // Setup mocks
        UserRepository userRepository = mock(UserRepository.class);
        QuizRepository quizRepository = mock(QuizRepository.class);
        QuizAssignmentRepository quizAssignmentRepository = mock(QuizAssignmentRepository.class);
        PasswordHashingService passwordHashingService = mock(PasswordHashingService.class);
        
        // Link assignments to user
        for (QuizAssignment assignment : expectedAssignments) {
            assignment.setUser(user);
        }
        
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
        when(quizAssignmentRepository.findByUser(user)).thenReturn(expectedAssignments);
        
        UserManagementService service = new UserManagementService(
                userRepository, quizRepository, quizAssignmentRepository, passwordHashingService);
        
        // Act
        List<QuizAssignment> actualAssignments = service.getUserAssignments(user.getId());
        
        // Assert - returned assignments match exactly what was expected
        assertThat(actualAssignments).hasSize(expectedAssignments.size());
        assertThat(actualAssignments).containsExactlyInAnyOrderElementsOf(expectedAssignments);
    }

    /**
     * Property 2: Response completeness
     * For any quiz assignment, the response SHALL contain a non-null assignment ID,
     * quiz ID, quiz title, and the complete set of permissions.
     * 
     * Validates: Requirements 2.1, 2.3
     */
    @Property(tries = 20)
    void responseContainsAllRequiredFields(@ForAll("completeAssignments") QuizAssignment assignment) {
        // Act
        QuizAssignmentResponse response = QuizAssignmentResponse.from(assignment);
        
        // Assert - all required fields are present
        assertThat(response.id()).isNotNull();
        assertThat(response.quizId()).isNotNull();
        assertThat(response.quizTitle()).isNotNull();
        assertThat(response.permissions()).isNotNull();
        
        // Assert - permissions match exactly
        assertThat(response.permissions()).containsExactlyInAnyOrderElementsOf(assignment.getPermissions());
    }

    /**
     * Property 3: Permission serialization round-trip
     * For any set of AdminPermission values, the response permissions should match
     * the original assignment permissions exactly.
     * 
     * Validates: Requirements 2.2
     */
    @Property(tries = 20)
    void permissionSerializationPreservesValues(@ForAll("permissionSets") Set<AdminPermission> permissions) {
        // Create assignment with specific permissions
        Quiz quiz = createQuiz(1L, "Test Quiz");
        User user = createUser(1L, "testuser", SystemRole.ADMIN);
        QuizAssignment assignment = new QuizAssignment(user, quiz);
        assignment.setId(1L);
        assignment.setPermissions(permissions);
        
        // Act
        QuizAssignmentResponse response = QuizAssignmentResponse.from(assignment);
        
        // Assert - permissions are preserved exactly
        assertThat(response.permissions()).isEqualTo(permissions);
        assertThat(response.permissions().size()).isEqualTo(permissions.size());
        
        // Verify each permission name matches enum constant
        for (AdminPermission permission : response.permissions()) {
            assertThat(permission.name()).isIn("CAN_VIEW_DETAILS", "CAN_EDIT_CONTENT", "CAN_MANAGE_TEAMS", "CAN_HOST_GAME");
        }
    }

    /**
     * Property 4: User isolation
     * For any two distinct users with different quiz assignments, getUserAssignments
     * for user A SHALL never return assignments belonging to user B.
     * 
     * Validates: Requirements 3.2, 3.4
     */
    @Property(tries = 20)
    void userIsolationPreventsAccessToOtherUsersAssignments(
            @ForAll("users") User userA,
            @ForAll("users") User userB,
            @ForAll("assignmentLists") List<QuizAssignment> assignmentsA,
            @ForAll("assignmentLists") List<QuizAssignment> assignmentsB) {
        
        // Ensure users are distinct
        Assume.that(!userA.getId().equals(userB.getId()));
        
        // Setup mocks
        UserRepository userRepository = mock(UserRepository.class);
        QuizRepository quizRepository = mock(QuizRepository.class);
        QuizAssignmentRepository quizAssignmentRepository = mock(QuizAssignmentRepository.class);
        PasswordHashingService passwordHashingService = mock(PasswordHashingService.class);
        
        // Link assignments to respective users
        for (QuizAssignment assignment : assignmentsA) {
            assignment.setUser(userA);
        }
        for (QuizAssignment assignment : assignmentsB) {
            assignment.setUser(userB);
        }
        
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));
        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(quizAssignmentRepository.findByUser(userA)).thenReturn(assignmentsA);
        when(quizAssignmentRepository.findByUser(userB)).thenReturn(assignmentsB);
        
        UserManagementService service = new UserManagementService(
                userRepository, quizRepository, quizAssignmentRepository, passwordHashingService);
        
        // Act - get assignments for user A
        List<QuizAssignment> resultA = service.getUserAssignments(userA.getId());
        
        // Assert - user A's results contain none of user B's assignments
        for (QuizAssignment assignmentB : assignmentsB) {
            assertThat(resultA).doesNotContain(assignmentB);
        }
        
        // Assert - user A's results contain only their own assignments
        assertThat(resultA).containsExactlyInAnyOrderElementsOf(assignmentsA);
    }

    // ==================== Providers ====================

    @Provide
    Arbitrary<User> users() {
        return Combinators.combine(
                Arbitraries.longs().between(1L, 1000L),
                Arbitraries.strings().alpha().ofMinLength(3).ofMaxLength(20),
                Arbitraries.of(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
        ).as((id, username, role) -> {
            User user = new User(username, "password123", role);
            user.setId(id);
            return user;
        });
    }

    @Provide
    Arbitrary<List<QuizAssignment>> assignmentLists() {
        return Arbitraries.integers().between(0, 5)
                .flatMap(count -> completeAssignments().list().ofSize(count));
    }

    @Provide
    Arbitrary<QuizAssignment> completeAssignments() {
        return Combinators.combine(
                Arbitraries.longs().between(1L, 1000L),
                Arbitraries.longs().between(1L, 1000L),
                Arbitraries.strings().alpha().ofMinLength(3).ofMaxLength(50),
                permissionSets()
        ).as((assignmentId, quizId, quizTitle, permissions) -> {
            Quiz quiz = createQuiz(quizId, quizTitle);
            User user = createUser(1L, "testuser", SystemRole.ADMIN);
            QuizAssignment assignment = new QuizAssignment(user, quiz);
            assignment.setId(assignmentId);
            assignment.setPermissions(permissions);
            return assignment;
        });
    }

    @Provide
    Arbitrary<Set<AdminPermission>> permissionSets() {
        return Arbitraries.of(AdminPermission.values())
                .set()
                .ofMinSize(0)
                .ofMaxSize(4);
    }

    // ==================== Helper Methods ====================

    private static Quiz createQuiz(Long id, String title) {
        Quiz quiz = new Quiz(title, "Description", "123-456", QuizStatus.READY);
        quiz.setId(id);
        return quiz;
    }

    private static User createUser(Long id, String username, SystemRole role) {
        User user = new User(username, "password123", role);
        user.setId(id);
        return user;
    }
}
