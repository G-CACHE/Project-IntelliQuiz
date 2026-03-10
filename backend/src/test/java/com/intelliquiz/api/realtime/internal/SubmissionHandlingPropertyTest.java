package com.intelliquiz.api.realtime.internal;

import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.submission.SubmissionFacade;
import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.realtime.internal.application.services.AnswerDistributionService;
import com.intelliquiz.api.realtime.internal.application.services.GameFlowService;
import com.intelliquiz.api.realtime.internal.application.services.QuizBroadcastService;
import com.intelliquiz.api.realtime.internal.application.services.QuizSessionManager;
import com.intelliquiz.api.realtime.internal.application.services.QuizTimerService;
import com.intelliquiz.api.realtime.internal.application.services.ProctorSessionService;
import com.intelliquiz.api.realtime.internal.domain.enums.GameState;
import net.jqwik.api.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for submission handling.
 * Feature: websocket-realtime
 */
class SubmissionHandlingPropertyTest {

    /** Creates a GameFlowService wired with given mocks/real objects. */
    private GameFlowService createService(
            QuizTimerService timerService,
            QuizBroadcastService broadcastService,
            QuizSessionManager sessionManager,
            QuizFacade quizFacade,
            TeamFacade teamFacade,
            SubmissionFacade submissionFacade,
            AnswerDistributionService distributionService
    ) {
        ProctorSessionService proctorSessionService = mock(ProctorSessionService.class);
        return new GameFlowService(
                timerService, broadcastService, sessionManager,
                quizFacade, teamFacade, submissionFacade, distributionService,
                proctorSessionService
        );
    }

    /**
     * Feature: websocket-realtime, Property 11: Submission Persistence and Confirmation
     * For any valid answer submission from a participant during an active timer,
     * the WebSocket server SHALL persist the submission AND send a confirmation.
     * 
     * **Validates: Requirements 5.1, 5.2**
     */
    @Example
    void validSubmissionIsPersisted() {
        // Setup mocks
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = mock(QuizTimerService.class);
        QuizFacade quizFacade = mock(QuizFacade.class);
        TeamFacade teamFacade = mock(TeamFacade.class);
        SubmissionFacade submissionFacade = mock(SubmissionFacade.class);
        AnswerDistributionService distributionService = mock(AnswerDistributionService.class);
        
        // Setup test data
        Long quizId = 1L;
        Long teamId = 10L;
        Long questionId = 100L;
        String answer = "B";
        String sessionId = "session-123";
        
        // Configure session state
        sessionManager.setCurrentState(quizId, GameState.ACTIVE);
        sessionManager.setCurrentQuestionId(quizId, questionId);
        
        // Configure mocks
        when(timerService.isTimerActive(quizId)).thenReturn(true);
        when(teamFacade.teamExists(teamId)).thenReturn(true);
        when(quizFacade.questionExists(questionId)).thenReturn(true);
        
        // Create service
        GameFlowService gameFlowService = createService(
                timerService, broadcastService, sessionManager,
                quizFacade, teamFacade, submissionFacade, distributionService
        );
        
        // Execute
        gameFlowService.handleSubmission(quizId, teamId, questionId, answer, sessionId);
        
        // Verify submission was persisted via facade
        verify(submissionFacade).submitAnswer(teamId, questionId, answer);
        
        // Verify confirmation was sent
        verify(broadcastService).sendSubmissionConfirmation(quizId, teamId, questionId);
        
        // Verify host was notified
        verify(broadcastService).notifyTeamSubmitted(quizId, teamId);
    }

    /**
     * Feature: websocket-realtime, Property 12: Answer Update Allowed Until Timer Expires
     * For any team that has already submitted, subsequent submissions SHALL update the answer.
     * 
     * **Validates: Requirements 5.1 (answer change allowed)**
     */
    @Example
    void answerUpdateReplacesExistingSubmission() {
        // Setup mocks
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = mock(QuizTimerService.class);
        QuizFacade quizFacade = mock(QuizFacade.class);
        TeamFacade teamFacade = mock(TeamFacade.class);
        SubmissionFacade submissionFacade = mock(SubmissionFacade.class);
        AnswerDistributionService distributionService = mock(AnswerDistributionService.class);
        
        Long quizId = 1L;
        Long teamId = 10L;
        Long questionId = 100L;
        String newAnswer = "C";
        String sessionId = "session-123";
        
        sessionManager.setCurrentState(quizId, GameState.ACTIVE);
        sessionManager.setCurrentQuestionId(quizId, questionId);
        
        when(timerService.isTimerActive(quizId)).thenReturn(true);
        when(teamFacade.teamExists(teamId)).thenReturn(true);
        when(quizFacade.questionExists(questionId)).thenReturn(true);
        
        GameFlowService gameFlowService = createService(
                timerService, broadcastService, sessionManager,
                quizFacade, teamFacade, submissionFacade, distributionService
        );
        
        // Execute - submit first answer then update
        gameFlowService.handleSubmission(quizId, teamId, questionId, "A", sessionId);
        gameFlowService.handleSubmission(quizId, teamId, questionId, newAnswer, sessionId);
        
        // Verify submitAnswer was called twice (facade handles create-or-update internally)
        verify(submissionFacade).submitAnswer(teamId, questionId, "A");
        verify(submissionFacade).submitAnswer(teamId, questionId, newAnswer);
        
        // Verify confirmation was sent for each submission
        verify(broadcastService, times(2)).sendSubmissionConfirmation(quizId, teamId, questionId);
    }

    /**
     * Feature: websocket-realtime, Property 13: Host Notification Without Answer Leak
     * For any successful submission, the host notification SHALL NOT include the answer content.
     * 
     * **Validates: Requirements 5.3**
     */
    @Example
    void hostNotificationDoesNotContainAnswer() {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = mock(QuizTimerService.class);
        QuizFacade quizFacade = mock(QuizFacade.class);
        TeamFacade teamFacade = mock(TeamFacade.class);
        SubmissionFacade submissionFacade = mock(SubmissionFacade.class);
        AnswerDistributionService distributionService = mock(AnswerDistributionService.class);
        
        Long quizId = 1L;
        Long teamId = 10L;
        Long questionId = 100L;
        String answer = "B";
        String sessionId = "session-123";
        
        sessionManager.setCurrentState(quizId, GameState.ACTIVE);
        sessionManager.setCurrentQuestionId(quizId, questionId);
        
        when(timerService.isTimerActive(quizId)).thenReturn(true);
        when(teamFacade.teamExists(teamId)).thenReturn(true);
        when(quizFacade.questionExists(questionId)).thenReturn(true);
        
        GameFlowService gameFlowService = createService(
                timerService, broadcastService, sessionManager,
                quizFacade, teamFacade, submissionFacade, distributionService
        );
        
        gameFlowService.handleSubmission(quizId, teamId, questionId, answer, sessionId);
        
        // Verify host notification was called with only teamId (no answer)
        verify(broadcastService).notifyTeamSubmitted(eq(quizId), eq(teamId));
        
        // Verify no method was called that would leak the answer to host
        verify(broadcastService, never()).sendToHost(eq(quizId), argThat(notification -> 
                notification != null && notification.toString().contains(answer)
        ));
    }

    /**
     * Feature: websocket-realtime, Property 9: Timer Expiration Locks Submissions
     * For any question, when the timer reaches 0, all subsequent submission attempts
     * SHALL be rejected with a TIME_EXPIRED error.
     * 
     * **Validates: Requirements 3.4, 3.5**
     */
    @Example
    void submissionRejectedWhenTimerExpired() {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = mock(QuizTimerService.class);
        QuizFacade quizFacade = mock(QuizFacade.class);
        TeamFacade teamFacade = mock(TeamFacade.class);
        SubmissionFacade submissionFacade = mock(SubmissionFacade.class);
        AnswerDistributionService distributionService = mock(AnswerDistributionService.class);
        
        Long quizId = 1L;
        Long teamId = 10L;
        Long questionId = 100L;
        String answer = "B";
        String sessionId = "session-123";
        
        sessionManager.setCurrentState(quizId, GameState.ACTIVE);
        sessionManager.setCurrentQuestionId(quizId, questionId);
        
        // Timer is NOT active (expired)
        when(timerService.isTimerActive(quizId)).thenReturn(false);
        
        GameFlowService gameFlowService = createService(
                timerService, broadcastService, sessionManager,
                quizFacade, teamFacade, submissionFacade, distributionService
        );
        
        gameFlowService.handleSubmission(quizId, teamId, questionId, answer, sessionId);
        
        // Verify error was sent
        verify(broadcastService).sendError(eq(sessionId), argThat(error -> 
                error.code().equals("TIME_EXPIRED")
        ));
        
        // Verify no submission was persisted
        verify(submissionFacade, never()).submitAnswer(anyLong(), anyLong(), anyString());
    }

    /**
     * Property: Submission rejected when game state is not ACTIVE.
     * **Validates: Requirements 5.1**
     */
    @Example
    void submissionRejectedWhenNotInActiveState() {
        QuizBroadcastService broadcastService = mock(QuizBroadcastService.class);
        QuizSessionManager sessionManager = new QuizSessionManager();
        QuizTimerService timerService = mock(QuizTimerService.class);
        QuizFacade quizFacade = mock(QuizFacade.class);
        TeamFacade teamFacade = mock(TeamFacade.class);
        SubmissionFacade submissionFacade = mock(SubmissionFacade.class);
        AnswerDistributionService distributionService = mock(AnswerDistributionService.class);
        
        Long quizId = 1L;
        String sessionId = "session-123";
        
        // Set state to GRADING (not ACTIVE)
        sessionManager.setCurrentState(quizId, GameState.GRADING);
        
        GameFlowService gameFlowService = createService(
                timerService, broadcastService, sessionManager,
                quizFacade, teamFacade, submissionFacade, distributionService
        );
        
        gameFlowService.handleSubmission(quizId, 10L, 100L, "B", sessionId);
        
        // Verify error was sent
        verify(broadcastService).sendError(eq(sessionId), argThat(error -> 
                error.code().equals("INVALID_STATE")
        ));
        
        // Verify no submission was persisted
        verify(submissionFacade, never()).submitAnswer(anyLong(), anyLong(), anyString());
    }
}
