package com.intelliquiz.api.presentation.controllers;

import com.intelliquiz.api.application.services.*;
import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.enums.QuizStatus;
import com.intelliquiz.api.domain.exceptions.EntityNotFoundException;
import com.intelliquiz.api.presentation.dto.request.AccessCodeRequest;
import com.intelliquiz.api.presentation.dto.response.AccessResolutionResponse;
import net.jqwik.api.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

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
        AccessController controller = new AccessController(mockService);
        
        Team team = new Team();
        team.setId(1L);
        team.setName("Test Team");
        team.setAccessCode(code);
        
        Quiz quiz = new Quiz("Test Quiz", "Description", "1234", QuizStatus.READY);
        quiz.setId(1L);
        team.setQuiz(quiz);
        
        when(mockService.resolve(code)).thenReturn(AccessResolutionResult.participant(team));
        
        // When
        ResponseEntity<AccessResolutionResponse> response = controller.resolveAccessCode(
                new AccessCodeRequest(code)
        );
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().routeType()).isEqualTo(RouteType.PARTICIPANT);
    }

    @Property(tries = 10)
    void accessControllerReturns200ForInvalidAccessCode(@ForAll("invalidAccessCodes") String code) {
        // Given
        AccessResolutionService mockService = mock(AccessResolutionService.class);
        AccessController controller = new AccessController(mockService);
        
        when(mockService.resolve(code)).thenReturn(AccessResolutionResult.invalid("Invalid access code"));
        
        // When
        ResponseEntity<AccessResolutionResponse> response = controller.resolveAccessCode(
                new AccessCodeRequest(code)
        );
        
        // Then - Returns 200 with INVALID route type (not 4xx)
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().routeType()).isEqualTo(RouteType.INVALID);
    }

    // ==================== QuizController Tests ====================

    @Property(tries = 10)
    void quizControllerReturns404ForNonExistentQuiz(@ForAll("positiveIds") Long quizId) {
        // Given
        QuizManagementService mockQuizService = mock(QuizManagementService.class);
        QuizSessionService mockSessionService = mock(QuizSessionService.class);
        QuizController controller = new QuizController(mockQuizService, mockSessionService);
        
        when(mockQuizService.getQuiz(quizId)).thenThrow(new EntityNotFoundException("Quiz", quizId));
        
        // When/Then
        assertThatThrownBy(() -> controller.getQuiz(quizId))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Property(tries = 10)
    void quizControllerReturns200ForExistingQuiz(@ForAll("positiveIds") Long quizId) {
        // Given
        QuizManagementService mockQuizService = mock(QuizManagementService.class);
        QuizSessionService mockSessionService = mock(QuizSessionService.class);
        QuizController controller = new QuizController(mockQuizService, mockSessionService);
        
        Quiz quiz = new Quiz("Test Quiz", "Description", "1234", QuizStatus.DRAFT);
        quiz.setId(quizId);
        
        when(mockQuizService.getQuiz(quizId)).thenReturn(quiz);
        
        // When
        ResponseEntity<?> response = controller.getQuiz(quizId);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Property(tries = 10)
    void quizControllerReturns201ForCreatedQuiz(@ForAll("validTitles") String title) {
        // Given
        QuizManagementService mockQuizService = mock(QuizManagementService.class);
        QuizSessionService mockSessionService = mock(QuizSessionService.class);
        QuizController controller = new QuizController(mockQuizService, mockSessionService);
        
        Quiz quiz = new Quiz(title, "Description", "1234", QuizStatus.DRAFT);
        quiz.setId(1L);
        
        when(mockQuizService.createQuiz(any())).thenReturn(quiz);
        
        // When
        ResponseEntity<?> response = controller.createQuiz(
                new com.intelliquiz.api.presentation.dto.request.CreateQuizRequest(title, "Description")
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
        
        doNothing().when(mockQuizService).deleteQuiz(quizId);
        
        // When
        ResponseEntity<?> response = controller.deleteQuiz(quizId);
        
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
