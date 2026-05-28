package com.intelliquiz.api.presentation.controllers;

import com.intelliquiz.api.quiz.internal.application.services.QuizManagementService;
import com.intelliquiz.api.quiz.internal.application.services.QuizSessionService;
import com.intelliquiz.api.quiz.internal.presentation.controllers.QuizController;
import com.intelliquiz.api.auth.internal.application.services.AccessResolutionResult;
import com.intelliquiz.api.auth.internal.application.services.AccessResolutionService;
import com.intelliquiz.api.auth.internal.presentation.controllers.AccessController;
import com.intelliquiz.api.shared.enums.RouteType;
import com.intelliquiz.api.shared.enums.SystemRole;
import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import com.intelliquiz.api.shared.enums.NavigationMode;
import com.intelliquiz.api.shared.enums.QuizAccessMode;
import com.intelliquiz.api.shared.enums.QuizStatus;
import com.intelliquiz.api.shared.exceptions.EntityNotFoundException;
import com.intelliquiz.api.auth.internal.presentation.dto.request.AccessCodeRequest;
import com.intelliquiz.api.auth.internal.presentation.dto.response.AccessResolutionResponse;
import net.jqwik.api.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Objects;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * Property tests for HTTP status code correctness.
 * 
 * Feature: infrastructure-layer, Property 3: HTTP Status Code Correctness
 * Validates: Requirements 1.5, 2.2, 2.3, 3.8, 4.5, 5.6, 7.3
 */
class HttpStatusCodePropertyTest {

    // ==================== AccessController Tests ====================

    @Property(tries = 10)
    void accessControllerReturns200ForValidAccessCode(@ForAll("validAccessCodes") String code) {
        // Given
        AccessResolutionService mockService = mock(AccessResolutionService.class);
        TeamFacade mockTeamFacade = mock(TeamFacade.class);
        QuizFacade mockQuizFacade = mock(QuizFacade.class);
        AccessController controller = new AccessController(mockService, mockTeamFacade, mockQuizFacade);
        
        when(mockService.resolve(code)).thenReturn(AccessResolutionResult.participant(1L, 10L));
        
        // When
        ResponseEntity<AccessResolutionResponse> response = controller.resolveAccessCode(
                new AccessCodeRequest(code)
        );
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        AccessResolutionResponse body = Objects.requireNonNull(response.getBody());
        assertThat(body.routeType()).isEqualTo(RouteType.PARTICIPANT);
    }

    @Property(tries = 10)
    void accessControllerReturns200ForInvalidAccessCode(@ForAll("invalidAccessCodes") String code) {
        // Given
        AccessResolutionService mockService = mock(AccessResolutionService.class);
        TeamFacade mockTeamFacade = mock(TeamFacade.class);
        QuizFacade mockQuizFacade = mock(QuizFacade.class);
        AccessController controller = new AccessController(mockService, mockTeamFacade, mockQuizFacade);
        
        when(mockService.resolve(code)).thenReturn(AccessResolutionResult.invalid("Invalid access code"));
        
        // When
        ResponseEntity<AccessResolutionResponse> response = controller.resolveAccessCode(
                new AccessCodeRequest(code)
        );
        
        // Then - Returns 200 with INVALID route type (not 4xx)
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        AccessResolutionResponse body = Objects.requireNonNull(response.getBody());
        assertThat(body.routeType()).isEqualTo(RouteType.INVALID);
    }

    // ==================== QuizController Tests ====================

    private Authentication mockAuth() {
        Authentication auth = mock(Authentication.class);
        when(auth.getDetails()).thenReturn(Map.of("uid", 1L));
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(auth).getAuthorities();
        when(auth.getName()).thenReturn("testadmin");
        return auth;
    }

    @Property(tries = 10)
    void quizControllerReturns404ForNonExistentQuiz(@ForAll("positiveIds") Long quizId) {
        // Given
        QuizManagementService mockQuizService = mock(QuizManagementService.class);
        QuizSessionService mockSessionService = mock(QuizSessionService.class);
        QuizController controller = new QuizController(mockQuizService, mockSessionService);
        Authentication auth = mockAuth();
        
        when(mockQuizService.getQuizForUser(eq(quizId), anyLong(), any(SystemRole.class)))
                .thenThrow(new EntityNotFoundException("Quiz", quizId));
        
        // When/Then
        assertThatThrownBy(() -> controller.getQuiz(quizId, auth))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Property(tries = 10)
    void quizControllerReturns200ForExistingQuiz(@ForAll("positiveIds") Long quizId) {
        // Given
        QuizManagementService mockQuizService = mock(QuizManagementService.class);
        QuizSessionService mockSessionService = mock(QuizSessionService.class);
        QuizController controller = new QuizController(mockQuizService, mockSessionService);
        Authentication auth = mockAuth();
        
        Quiz quiz = new Quiz("Test Quiz", "Description", "1234", QuizStatus.DRAFT);
        quiz.setId(quizId);
        
        when(mockQuizService.getQuizForUser(eq(quizId), anyLong(), any(SystemRole.class)))
                .thenReturn(quiz);
        
        // When
        ResponseEntity<?> response = controller.getQuiz(quizId, auth);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Property(tries = 10)
    void quizControllerReturns201ForCreatedQuiz(@ForAll("validTitles") String title) {
        // Given
        QuizManagementService mockQuizService = mock(QuizManagementService.class);
        QuizSessionService mockSessionService = mock(QuizSessionService.class);
        QuizController controller = new QuizController(mockQuizService, mockSessionService);
        Authentication auth = mockAuth();
        
        Quiz quiz = new Quiz(title, "Description", "1234", QuizStatus.DRAFT);
        quiz.setId(1L);
        
        when(mockQuizService.createQuiz(any())).thenReturn(quiz);
        
        // When
        ResponseEntity<?> response = controller.createQuiz(
            new com.intelliquiz.api.quiz.internal.presentation.dto.request.CreateQuizRequest(
                    title,
                    "Description",
                    QuizAccessMode.RESTRICTED,
                    NavigationMode.TOURNAMENT,
                    0,
                    false
            ),
                auth
        );
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Property(tries = 10)
    void quizControllerReturns204ForDeletedQuiz(@ForAll("positiveIds") Long quizId) {
        // Given
        QuizManagementService mockQuizService = mock(QuizManagementService.class);
        QuizSessionService mockSessionService = mock(QuizSessionService.class);
        QuizController controller = new QuizController(mockQuizService, mockSessionService);
        Authentication auth = mockAuth();
        
        doNothing().when(mockQuizService).deleteQuiz(quizId);
        
        // When
        ResponseEntity<?> response = controller.deleteQuiz(quizId, auth);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    // ==================== Arbitraries ====================

    @Provide
    Arbitrary<String> validAccessCodes() {
        return Arbitraries.strings()
                .alpha()
                .numeric()
                .ofMinLength(4)
                .ofMaxLength(8)
                .map(String::toUpperCase);
    }

    @Provide
    Arbitrary<String> invalidAccessCodes() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(20);
    }

    @Provide
    Arbitrary<Long> positiveIds() {
        return Arbitraries.longs().between(1L, 10000L);
    }

    @Provide
    Arbitrary<String> validTitles() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(100);
    }
}
