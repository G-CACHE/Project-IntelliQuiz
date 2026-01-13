package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.enums.QuizStatus;
import com.intelliquiz.api.domain.ports.QuizRepository;
import com.intelliquiz.api.domain.ports.TeamRepository;
import net.jqwik.api.*;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for AccessResolutionService.
 * 
 * Feature: application-layer, Property 1: Access Code Resolution Correctness
 * Validates: Requirements 1.1, 1.2, 1.3, 1.5
 */
public class AccessResolutionPropertyTest {

    /**
     * Property 1: Team access codes return PARTICIPANT route with correct Team
     */
    @Property(tries = 20)
    void teamAccessCodesReturnParticipantRoute(@ForAll("accessCodes") String accessCode) {
        TeamRepository teamRepository = mock(TeamRepository.class);
        QuizRepository quizRepository = mock(QuizRepository.class);
        
        Quiz activeQuiz = createActiveQuiz("999-999");
        Team team = new Team(activeQuiz, "Test Team", accessCode);
        
        when(teamRepository.findByAccessCode(accessCode.toUpperCase())).thenReturn(Optional.of(team));
        
        AccessResolutionService service = new AccessResolutionService(teamRepository, quizRepository);
        AccessResolutionResult result = service.resolve(accessCode);
        
        assertThat(result.routeType()).isEqualTo(RouteType.PARTICIPANT);
        assertThat(result.team()).isEqualTo(team);
        assertThat(result.quiz()).isNull();
    }

    /**
     * Property 1: Proctor PINs for active quizzes return HOST route with correct Quiz
     */
    @Property(tries = 20)
    void proctorPinsForActiveQuizzesReturnHostRoute(@ForAll("proctorPins") String proctorPin) {
        TeamRepository teamRepository = mock(TeamRepository.class);
        QuizRepository quizRepository = mock(QuizRepository.class);
        
        Quiz activeQuiz = createActiveQuiz(proctorPin);
        
        when(teamRepository.findByAccessCode(proctorPin.toUpperCase())).thenReturn(Optional.empty());
        when(quizRepository.findByIsLiveSessionTrue()).thenReturn(List.of(activeQuiz));
        
        AccessResolutionService service = new AccessResolutionService(teamRepository, quizRepository);
        AccessResolutionResult result = service.resolve(proctorPin);
        
        assertThat(result.routeType()).isEqualTo(RouteType.HOST);
        assertThat(result.quiz()).isEqualTo(activeQuiz);
        assertThat(result.team()).isNull();
    }

    /**
     * Property 1: Proctor PINs for inactive quizzes return INVALID route
     */
    @Property(tries = 20)
    void proctorPinsForInactiveQuizzesReturnInvalidRoute(@ForAll("proctorPins") String proctorPin) {
        TeamRepository teamRepository = mock(TeamRepository.class);
        QuizRepository quizRepository = mock(QuizRepository.class);
        
        // No active quizzes
        when(teamRepository.findByAccessCode(proctorPin.toUpperCase())).thenReturn(Optional.empty());
        when(quizRepository.findByIsLiveSessionTrue()).thenReturn(List.of());
        
        AccessResolutionService service = new AccessResolutionService(teamRepository, quizRepository);
        AccessResolutionResult result = service.resolve(proctorPin);
        
        assertThat(result.routeType()).isEqualTo(RouteType.INVALID);
        assertThat(result.errorMessage()).isNotNull();
    }

    /**
     * Property 1: Unknown codes return INVALID route
     */
    @Property(tries = 20)
    void unknownCodesReturnInvalidRoute(@ForAll("accessCodes") String unknownCode) {
        TeamRepository teamRepository = mock(TeamRepository.class);
        QuizRepository quizRepository = mock(QuizRepository.class);
        
        when(teamRepository.findByAccessCode(unknownCode.toUpperCase())).thenReturn(Optional.empty());
        when(quizRepository.findByIsLiveSessionTrue()).thenReturn(List.of());
        
        AccessResolutionService service = new AccessResolutionService(teamRepository, quizRepository);
        AccessResolutionResult result = service.resolve(unknownCode);
        
        assertThat(result.routeType()).isEqualTo(RouteType.INVALID);
        assertThat(result.errorMessage()).isNotNull();
    }

    /**
     * Property 1: Team codes for inactive quiz sessions return INVALID
     */
    @Property(tries = 20)
    void teamCodesForInactiveQuizReturnInvalid(@ForAll("accessCodes") String accessCode) {
        TeamRepository teamRepository = mock(TeamRepository.class);
        QuizRepository quizRepository = mock(QuizRepository.class);
        
        Quiz inactiveQuiz = createInactiveQuiz("999-999");
        Team team = new Team(inactiveQuiz, "Test Team", accessCode);
        
        when(teamRepository.findByAccessCode(accessCode.toUpperCase())).thenReturn(Optional.of(team));
        
        AccessResolutionService service = new AccessResolutionService(teamRepository, quizRepository);
        AccessResolutionResult result = service.resolve(accessCode);
        
        assertThat(result.routeType()).isEqualTo(RouteType.INVALID);
        assertThat(result.errorMessage()).contains("not active");
    }

    /**
     * Property 1: Null or blank codes return INVALID
     */
    @Property(tries = 5)
    void nullOrBlankCodesReturnInvalid() {
        TeamRepository teamRepository = mock(TeamRepository.class);
        QuizRepository quizRepository = mock(QuizRepository.class);
        
        AccessResolutionService service = new AccessResolutionService(teamRepository, quizRepository);
        
        assertThat(service.resolve(null).routeType()).isEqualTo(RouteType.INVALID);
        assertThat(service.resolve("").routeType()).isEqualTo(RouteType.INVALID);
        assertThat(service.resolve("   ").routeType()).isEqualTo(RouteType.INVALID);
    }

    @Provide
    Arbitrary<String> accessCodes() {
        return Arbitraries.strings()
                .withCharRange('A', 'Z')
                .ofLength(3)
                .flatMap(first -> Arbitraries.strings()
                        .withCharRange('A', 'Z')
                        .ofLength(3)
                        .map(second -> first + "-" + second));
    }

    @Provide
    Arbitrary<String> proctorPins() {
        return Arbitraries.strings()
                .withCharRange('0', '9')
                .ofLength(3)
                .flatMap(first -> Arbitraries.strings()
                        .withCharRange('0', '9')
                        .ofLength(3)
                        .map(second -> first + "-" + second));
    }

    private Quiz createActiveQuiz(String proctorPin) {
        Quiz quiz = new Quiz("Test Quiz", "Description", proctorPin, QuizStatus.READY);
        quiz.setId(1L);
        quiz.setLiveSession(true);
        return quiz;
    }

    private Quiz createInactiveQuiz(String proctorPin) {
        Quiz quiz = new Quiz("Test Quiz", "Description", proctorPin, QuizStatus.DRAFT);
        quiz.setId(1L);
        quiz.setLiveSession(false);
        return quiz;
    }
}
