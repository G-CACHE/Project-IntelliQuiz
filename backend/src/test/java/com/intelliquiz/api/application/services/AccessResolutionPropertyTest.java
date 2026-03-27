package com.intelliquiz.api.application.services;

import com.intelliquiz.api.auth.internal.application.services.AccessResolutionResult;
import com.intelliquiz.api.auth.internal.application.services.AccessResolutionService;
import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.quiz.dto.QuizInfoDto;
import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.team.dto.TeamInfoDto;
import com.intelliquiz.api.shared.enums.NavigationMode;
import com.intelliquiz.api.shared.enums.QuizAccessMode;
import com.intelliquiz.api.shared.enums.QuizStatus;
import com.intelliquiz.api.shared.enums.RouteType;
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
     * Property 1: Team access codes return PARTICIPANT route with correct team/quiz IDs
     */
    @Property(tries = 20)
    void teamAccessCodesReturnParticipantRoute(@ForAll("accessCodes") String accessCode) {
        TeamFacade teamFacade = mock(TeamFacade.class);
        QuizFacade quizFacade = mock(QuizFacade.class);
        
        TeamInfoDto team = new TeamInfoDto(1L, "Test Team", accessCode.toUpperCase(), 0, 10L);
        QuizInfoDto quiz = new QuizInfoDto(10L, "Test Quiz", QuizStatus.READY, true, "999-999", QuizAccessMode.RESTRICTED, "Q-10", NavigationMode.TOURNAMENT, 0);
        
        when(teamFacade.getTeamByAccessCode(accessCode.toUpperCase())).thenReturn(Optional.of(team));
        when(quizFacade.findQuizInfo(10L)).thenReturn(Optional.of(quiz));
        when(quizFacade.findQuizInfoByCode(anyString())).thenReturn(Optional.empty());
        
        AccessResolutionService service = new AccessResolutionService(teamFacade, quizFacade);
        AccessResolutionResult result = service.resolve(accessCode);
        
        assertThat(result.routeType()).isEqualTo(RouteType.PARTICIPANT);
        assertThat(result.teamId()).isEqualTo(1L);
        assertThat(result.quizId()).isEqualTo(10L);
    }

    /**
     * Property 1: Proctor PINs for any quiz return HOST route with correct quiz ID.
     * Proctors should be able to access any quiz, not just active ones.
     */
    @Property(tries = 20)
    void proctorPinsForAnyQuizReturnHostRoute(@ForAll("proctorPins") String proctorPin) {
        TeamFacade teamFacade = mock(TeamFacade.class);
        QuizFacade quizFacade = mock(QuizFacade.class);
        
        QuizInfoDto quiz = new QuizInfoDto(1L, "Test Quiz", QuizStatus.READY, true, proctorPin.toUpperCase(), QuizAccessMode.RESTRICTED, "Q-1", NavigationMode.TOURNAMENT, 0);
        
        when(teamFacade.getTeamByAccessCode(proctorPin.toUpperCase())).thenReturn(Optional.empty());
        when(quizFacade.findAllQuizzes()).thenReturn(List.of(quiz));
        when(quizFacade.findQuizInfoByCode(anyString())).thenReturn(Optional.empty());
        
        AccessResolutionService service = new AccessResolutionService(teamFacade, quizFacade);
        AccessResolutionResult result = service.resolve(proctorPin);
        
        assertThat(result.routeType()).isEqualTo(RouteType.HOST);
        assertThat(result.quizId()).isEqualTo(1L);
        assertThat(result.teamId()).isNull();
    }

    /**
     * Property 1: Proctor PINs for inactive (draft) quizzes also return HOST route.
     * Proctors should be able to access the lobby to start the quiz.
     */
    @Property(tries = 20)
    void proctorPinsForInactiveQuizzesReturnInvalidRoute(@ForAll("proctorPins") String proctorPin) {
        TeamFacade teamFacade = mock(TeamFacade.class);
        QuizFacade quizFacade = mock(QuizFacade.class);
        
        QuizInfoDto inactiveQuiz = new QuizInfoDto(1L, "Test Quiz", QuizStatus.DRAFT, false, proctorPin.toUpperCase(), QuizAccessMode.RESTRICTED, "Q-1", NavigationMode.TOURNAMENT, 0);
        
        when(teamFacade.getTeamByAccessCode(proctorPin.toUpperCase())).thenReturn(Optional.empty());
        when(quizFacade.findAllQuizzes()).thenReturn(List.of(inactiveQuiz));
        when(quizFacade.findQuizInfoByCode(anyString())).thenReturn(Optional.empty());
        
        AccessResolutionService service = new AccessResolutionService(teamFacade, quizFacade);
        AccessResolutionResult result = service.resolve(proctorPin);
        
        assertThat(result.routeType()).isEqualTo(RouteType.INVALID);
        assertThat(result.errorMessage()).containsIgnoringCase("expired");
    }

    /**
     * Property 1: Unknown codes return INVALID route
     */
    @Property(tries = 20)
    void unknownCodesReturnInvalidRoute(@ForAll("accessCodes") String unknownCode) {
        TeamFacade teamFacade = mock(TeamFacade.class);
        QuizFacade quizFacade = mock(QuizFacade.class);
        
        when(teamFacade.getTeamByAccessCode(unknownCode.toUpperCase())).thenReturn(Optional.empty());
        when(quizFacade.findAllQuizzes()).thenReturn(List.of());
        when(quizFacade.findQuizInfoByCode(anyString())).thenReturn(Optional.empty());
        
        AccessResolutionService service = new AccessResolutionService(teamFacade, quizFacade);
        AccessResolutionResult result = service.resolve(unknownCode);
        
        assertThat(result.routeType()).isEqualTo(RouteType.INVALID);
        assertThat(result.errorMessage()).isNotNull();
    }

    /**
     * Property 1: Team codes for DRAFT quiz sessions return INVALID
     */
    @Property(tries = 20)
    void teamCodesForDraftQuizReturnInvalid(@ForAll("accessCodes") String accessCode) {
        TeamFacade teamFacade = mock(TeamFacade.class);
        QuizFacade quizFacade = mock(QuizFacade.class);
        
        TeamInfoDto team = new TeamInfoDto(1L, "Test Team", accessCode.toUpperCase(), 0, 10L);
        QuizInfoDto inactiveQuiz = new QuizInfoDto(10L, "Test Quiz", QuizStatus.DRAFT, false, "999-999", QuizAccessMode.RESTRICTED, "Q-10", NavigationMode.TOURNAMENT, 0);
        
        when(teamFacade.getTeamByAccessCode(accessCode.toUpperCase())).thenReturn(Optional.of(team));
        when(quizFacade.findQuizInfo(10L)).thenReturn(Optional.of(inactiveQuiz));
        when(quizFacade.findQuizInfoByCode(anyString())).thenReturn(Optional.empty());
        
        AccessResolutionService service = new AccessResolutionService(teamFacade, quizFacade);
        AccessResolutionResult result = service.resolve(accessCode);
        
        assertThat(result.routeType()).isEqualTo(RouteType.INVALID);
        assertThat(result.errorMessage()).contains("not active");
    }

    /**
     * Property 1: Team codes for READY quiz (lobby phase) return PARTICIPANT.
     * This allows participants to join the lobby before the quiz starts.
     */
    @Property(tries = 20)
    void teamCodesForReadyQuizReturnParticipant(@ForAll("accessCodes") String accessCode) {
        TeamFacade teamFacade = mock(TeamFacade.class);
        QuizFacade quizFacade = mock(QuizFacade.class);
        
        TeamInfoDto team = new TeamInfoDto(1L, "Test Team", accessCode.toUpperCase(), 0, 10L);
        QuizInfoDto readyQuiz = new QuizInfoDto(10L, "Test Quiz", QuizStatus.READY, false, "999-999", QuizAccessMode.RESTRICTED, "Q-10", NavigationMode.TOURNAMENT, 0);
        
        when(teamFacade.getTeamByAccessCode(accessCode.toUpperCase())).thenReturn(Optional.of(team));
        when(quizFacade.findQuizInfo(10L)).thenReturn(Optional.of(readyQuiz));
        when(quizFacade.findQuizInfoByCode(anyString())).thenReturn(Optional.empty());
        
        AccessResolutionService service = new AccessResolutionService(teamFacade, quizFacade);
        AccessResolutionResult result = service.resolve(accessCode);
        
        assertThat(result.routeType()).isEqualTo(RouteType.PARTICIPANT);
        assertThat(result.teamId()).isEqualTo(1L);
        assertThat(result.quizId()).isEqualTo(10L);
    }

    /**
     * Property 1: Null or blank codes return INVALID
     */
    @Property(tries = 5)
    void nullOrBlankCodesReturnInvalid() {
        TeamFacade teamFacade = mock(TeamFacade.class);
        QuizFacade quizFacade = mock(QuizFacade.class);

        when(quizFacade.findQuizInfoByCode(anyString())).thenReturn(Optional.empty());
        
        AccessResolutionService service = new AccessResolutionService(teamFacade, quizFacade);
        
        assertThat(service.resolve(null).routeType()).isEqualTo(RouteType.INVALID);
        assertThat(service.resolve("").routeType()).isEqualTo(RouteType.INVALID);
        assertThat(service.resolve("   ").routeType()).isEqualTo(RouteType.INVALID);
    }

    @Property(tries = 20)
    void publicQuizCodeReturnsParticipantPreJoin(@ForAll("quizCodes") String quizCode) {
        TeamFacade teamFacade = mock(TeamFacade.class);
        QuizFacade quizFacade = mock(QuizFacade.class);

        QuizInfoDto publicQuiz = new QuizInfoDto(77L, "Public Quiz", QuizStatus.READY, false, "123-456", QuizAccessMode.PUBLIC, quizCode, NavigationMode.TOURNAMENT, 0);

        when(teamFacade.getTeamByAccessCode(quizCode.toUpperCase())).thenReturn(Optional.empty());
        when(quizFacade.findAllQuizzes()).thenReturn(List.of());
        when(quizFacade.findQuizInfoByCode(quizCode.toUpperCase())).thenReturn(Optional.of(publicQuiz));

        AccessResolutionService service = new AccessResolutionService(teamFacade, quizFacade);
        AccessResolutionResult result = service.resolve(quizCode);

        assertThat(result.routeType()).isEqualTo(RouteType.PARTICIPANT);
        assertThat(result.teamId()).isNull();
        assertThat(result.quizId()).isEqualTo(77L);
    }

    @Property(tries = 20)
    void restrictedQuizCodeReturnsInvalid(@ForAll("quizCodes") String quizCode) {
        TeamFacade teamFacade = mock(TeamFacade.class);
        QuizFacade quizFacade = mock(QuizFacade.class);

        QuizInfoDto restrictedQuiz = new QuizInfoDto(55L, "Restricted Quiz", QuizStatus.READY, false, "123-456", QuizAccessMode.RESTRICTED, quizCode, NavigationMode.TOURNAMENT, 0);

        when(teamFacade.getTeamByAccessCode(quizCode.toUpperCase())).thenReturn(Optional.empty());
        when(quizFacade.findAllQuizzes()).thenReturn(List.of());
        when(quizFacade.findQuizInfoByCode(quizCode.toUpperCase())).thenReturn(Optional.of(restrictedQuiz));

        AccessResolutionService service = new AccessResolutionService(teamFacade, quizFacade);
        AccessResolutionResult result = service.resolve(quizCode);

        assertThat(result.routeType()).isEqualTo(RouteType.INVALID);
        assertThat(result.errorMessage()).containsIgnoringCase("restricted");
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

        @Provide
        Arbitrary<String> quizCodes() {
        return Arbitraries.strings()
            .withChars('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                '2', '3', '4', '5', '6', '7', '8', '9')
            .ofLength(6);
        }
}
