package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Submission;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.enums.QuestionType;
import com.intelliquiz.api.domain.enums.QuizStatus;
import com.intelliquiz.api.domain.ports.QuestionRepository;
import com.intelliquiz.api.domain.ports.QuizRepository;
import com.intelliquiz.api.domain.ports.SubmissionRepository;
import com.intelliquiz.api.domain.ports.TeamRepository;
import com.intelliquiz.api.infrastructure.config.QuizBroadcastService;
import com.intelliquiz.api.infrastructure.config.QuizSessionManager;
import net.jqwik.api.*;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for submission handling.
 * Feature: websocket-realtime
 */
class SubmissionHandlingPropertyTest {

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
        QuizRepository quizRepository = mock(QuizRepository.class);
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        TeamRepository teamRepository = mock(TeamRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        AnswerDistributionService distributionService = mock(AnswerDistributionService.class);
        
        // Setup test data
        Long quizId = 1L;
        Long teamId = 10L;
        Long questionId = 100L;
        String answer = "B";
        String sessionId = "session-123";
        
        Quiz quiz = new Quiz();
        quiz.setId(quizId);
        quiz.setStatus(QuizStatus.READY);
        
        Team team = new Team();
        team.setId(teamId);
        team.setName("Team Alpha");
        team.setQuiz(quiz);
        
        Question question = new Question();
        question.setId(questionId);
        question.setType(QuestionType.MULTIPLE_CHOICE);
        question.setCorrectKey("B");
        question.setQuiz(quiz);
        
        // Configure session state
        sessionManager.setCurrentState(quizId, GameState.ACTIVE);
        sessionManager.setCurrentQuestionId(quizId, questionId);
        
        // Configure mocks
        when(timerService.isTimerActive(quizId)).thenReturn(true);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));
        when(submissionRepository.findByTeamAndQuestion(team, question)).thenReturn(Optional.empty());
        
        // Create service
        GameFlowService gameFlowService = new GameFlowService(
                timerService, broadcastService, sessionManager,
                quizRepository, questionRepository, teamRepository,
                submissionRepository, distributionService
        );
        
        // Execute
        gameFlowService.handleSubmission(quizId, teamId, questionId, answer, sessionId);
        
        // Verify submission was saved
        verify(submissionRepository).save(any(Submission.class));
        
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
        QuizRepository quizRepository = mock(QuizRepository.class);
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        TeamRepository teamRepository = mock(TeamRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        AnswerDistributionService distributionService = mock(AnswerDistributionService.class);
        
        Long quizId = 1L;
        Long teamId = 10L;
        Long questionId = 100L;
        String newAnswer = "C";
        String sessionId = "session-123";
        
        Quiz quiz = new Quiz();
        quiz.setId(quizId);
        
        Team team = new Team();
        team.setId(teamId);
        team.setQuiz(quiz);
        
        Question question = new Question();
        question.setId(questionId);
        question.setType(QuestionType.MULTIPLE_CHOICE);
        question.setCorrectKey("B");
        question.setQuiz(quiz);
        
        // Existing submission
        Submission existingSubmission = new Submission(team, question, "A");
        existingSubmission.setId(1L);
        
        sessionManager.setCurrentState(quizId, GameState.ACTIVE);
        sessionManager.setCurrentQuestionId(quizId, questionId);
        
        when(timerService.isTimerActive(quizId)).thenReturn(true);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));
        when(submissionRepository.findByTeamAndQuestion(team, question)).thenReturn(Optional.of(existingSubmission));
        
        GameFlowService gameFlowService = new GameFlowService(
                timerService, broadcastService, sessionManager,
                quizRepository, questionRepository, teamRepository,
                submissionRepository, distributionService
        );
        
        // Execute - update answer
        gameFlowService.handleSubmission(quizId, teamId, questionId, newAnswer, sessionId);
        
        // Verify the existing submission was updated
        assertThat(existingSubmission.getSubmittedAnswer())
                .as("Existing submission should be updated with new answer")
                .isEqualTo(newAnswer);
        
        // Verify it was saved
        verify(submissionRepository).save(existingSubmission);
        
        // Verify confirmation was sent
        verify(broadcastService).sendSubmissionConfirmation(quizId, teamId, questionId);
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
        QuizRepository quizRepository = mock(QuizRepository.class);
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        TeamRepository teamRepository = mock(TeamRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        AnswerDistributionService distributionService = mock(AnswerDistributionService.class);
        
        Long quizId = 1L;
        Long teamId = 10L;
        Long questionId = 100L;
        String answer = "B";
        String sessionId = "session-123";
        
        Quiz quiz = new Quiz();
        quiz.setId(quizId);
        
        Team team = new Team();
        team.setId(teamId);
        team.setQuiz(quiz);
        
        Question question = new Question();
        question.setId(questionId);
        question.setType(QuestionType.MULTIPLE_CHOICE);
        question.setCorrectKey("B");
        question.setQuiz(quiz);
        
        sessionManager.setCurrentState(quizId, GameState.ACTIVE);
        sessionManager.setCurrentQuestionId(quizId, questionId);
        
        when(timerService.isTimerActive(quizId)).thenReturn(true);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));
        when(submissionRepository.findByTeamAndQuestion(team, question)).thenReturn(Optional.empty());
        
        GameFlowService gameFlowService = new GameFlowService(
                timerService, broadcastService, sessionManager,
                quizRepository, questionRepository, teamRepository,
                submissionRepository, distributionService
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
        QuizRepository quizRepository = mock(QuizRepository.class);
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        TeamRepository teamRepository = mock(TeamRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
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
        
        GameFlowService gameFlowService = new GameFlowService(
                timerService, broadcastService, sessionManager,
                quizRepository, questionRepository, teamRepository,
                submissionRepository, distributionService
        );
        
        gameFlowService.handleSubmission(quizId, teamId, questionId, answer, sessionId);
        
        // Verify error was sent
        verify(broadcastService).sendError(eq(sessionId), argThat(error -> 
                error.code().equals("TIME_EXPIRED")
        ));
        
        // Verify no submission was saved
        verify(submissionRepository, never()).save(any());
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
        QuizRepository quizRepository = mock(QuizRepository.class);
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        TeamRepository teamRepository = mock(TeamRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        AnswerDistributionService distributionService = mock(AnswerDistributionService.class);
        
        Long quizId = 1L;
        String sessionId = "session-123";
        
        // Set state to GRADING (not ACTIVE)
        sessionManager.setCurrentState(quizId, GameState.GRADING);
        
        GameFlowService gameFlowService = new GameFlowService(
                timerService, broadcastService, sessionManager,
                quizRepository, questionRepository, teamRepository,
                submissionRepository, distributionService
        );
        
        gameFlowService.handleSubmission(quizId, 10L, 100L, "B", sessionId);
        
        // Verify error was sent
        verify(broadcastService).sendError(eq(sessionId), argThat(error -> 
                error.code().equals("INVALID_STATE")
        ));
        
        // Verify no submission was saved
        verify(submissionRepository, never()).save(any());
    }
}
