package com.intelliquiz.api.realtime.internal.application.services;

import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.quiz.dto.QuestionInfoDto;
import com.intelliquiz.api.submission.SubmissionFacade;
import com.intelliquiz.api.submission.dto.SubmissionInfoDto;
import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.team.dto.TeamInfoDto;
import com.intelliquiz.api.shared.enums.NavigationMode;
import com.intelliquiz.api.shared.exceptions.EntityNotFoundException;
import com.intelliquiz.api.realtime.internal.domain.enums.GameState;
import com.intelliquiz.api.realtime.internal.presentation.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Orchestrates the semi-automated game flow for quiz sessions.
 * Handles state transitions, submissions, and scoring.
 * Uses module facades instead of direct repository access.
 */
@Service
public class GameFlowService {

    private static final Logger logger = LoggerFactory.getLogger(GameFlowService.class);
    private static final int BUFFER_DURATION_SECONDS = 10;
    private static final int ACTIVATION_MAX_RETRIES = 3;
    private static final int ACTIVATION_RETRY_DELAY_SECONDS = 2;

    private final QuizTimerService timerService;
    private final QuizBroadcastService broadcastService;
    private final QuizSessionManager sessionManager;
    private final QuizFacade quizFacade;
    private final TeamFacade teamFacade;
    private final SubmissionFacade submissionFacade;
    private final AnswerDistributionService distributionService;
    private final ProctorSessionService proctorSessionService;

    // Quiz ID -> Set of team IDs that have submitted for current question
    private final Map<Long, Set<Long>> submittedTeams = new ConcurrentHashMap<>();

    public GameFlowService(
            QuizTimerService timerService,
            QuizBroadcastService broadcastService,
            QuizSessionManager sessionManager,
            QuizFacade quizFacade,
            TeamFacade teamFacade,
            SubmissionFacade submissionFacade,
            AnswerDistributionService distributionService,
            ProctorSessionService proctorSessionService
    ) {
        this.timerService = timerService;
        this.broadcastService = broadcastService;
        this.sessionManager = sessionManager;
        this.quizFacade = quizFacade;
        this.teamFacade = teamFacade;
        this.submissionFacade = submissionFacade;
        this.distributionService = distributionService;
        this.proctorSessionService = proctorSessionService;
    }

    /**
     * Starts a quiz using the configured navigation mode and timer settings.
     * - TOURNAMENT: proctor-controlled with per-question timers
     * - CLASS: participant-controlled with global timer
     */
    public void startQuiz(Long quizId) {
        var quizInfo = quizFacade.getQuizInfo(quizId);
        if (quizInfo.navigationMode() == NavigationMode.CLASS) {
            startClassQuiz(quizId, quizInfo.globalTimeLimitSeconds());
            return;
        }
        // TOURNAMENT mode - proctor-controlled question navigation
        startRound(quizId, "Round 1", quizInfo.globalTimeLimitSeconds());
    }

    /**
     * Starts a round with buffer countdown.
     * 
     * @param quizId the quiz ID
     * @param roundName the round name
     * @param globalTimeLimitSeconds the global timer for the entire quiz (0 = per-question timers)
     */
    public void startRound(Long quizId, String roundName, int globalTimeLimitSeconds) {
        var quizInfo = quizFacade.getQuizInfo(quizId);
        if (quizInfo.status() != com.intelliquiz.api.shared.enums.QuizStatus.READY) {
            throw new IllegalArgumentException("Quiz must be READY before it can be started");
        }

        // Fresh run safeguard: remove lingering submissions from previous sessions of this quiz.
        submissionFacade.clearSubmissionsForQuiz(quizId);

        // Mark the quiz as live so proctors and participants can connect via SSE
        quizFacade.activateSession(quizId);

        // If global timer is set, enable participant navigation
        boolean hasGlobalTimer = globalTimeLimitSeconds > 0;
        sessionManager.setParticipantNavigationEnabled(quizId, hasGlobalTimer);

        logger.info("Starting round {} for quiz {} (global timer: {}s, participant-controlled: {})", 
                roundName, quizId, globalTimeLimitSeconds, hasGlobalTimer);
        
        // Ensure session mode is explicitly set for this run.
            sessionManager.setNavigationMode(quizId, NavigationMode.TOURNAMENT);
        sessionManager.setCurrentState(quizId, GameState.BUFFER);
        sessionManager.setCurrentQuestionIndex(quizId, 0);
        
        // Start buffer countdown, then activate round (with global timer if set)
        timerService.startBufferCountdown(quizId, BUFFER_DURATION_SECONDS, roundName, () -> {
            activateTournamentRoundWithRetry(quizId, globalTimeLimitSeconds, 1);
        });
    }

    /**
         * Activates TOURNAMENT round after buffer completes.
     * If globalTimeLimitSeconds > 0: starts global timer and shows first question.
     * If globalTimeLimitSeconds = 0: shows first question (host-controlled with per-question timers).
     */
        private void activateTournamentRound(Long quizId, int globalTimeLimitSeconds) {
        if (globalTimeLimitSeconds > 0) {
            // Participant-paced with global timer: show first question and start global timer
            showQuestion(quizId, 0);
            timerService.startGlobalTimer(quizId, globalTimeLimitSeconds, () -> {
                // Auto-end quiz when global timer expires
                endQuiz(quizId);
            });
        } else {
            // Host-paced with per-question timers: show first question (timer starts in showQuestion)
            showQuestion(quizId, 0);
        }
    }

    /**
     * Shows a question and starts the timer (only for host-paced mode without global timer).
     * When global timer is active, per-question timers are skipped.
     */
    public void showQuestion(Long quizId, int questionIndex) {
        List<QuestionInfoDto> questions = quizFacade.getOrderedQuestions(quizId);
        
        if (questionIndex >= questions.size()) {
            // No more questions — automatically end the quiz with final scoreboard
            endQuiz(quizId);
            return;
        }
        
        QuestionInfoDto question = questions.get(questionIndex);
        sessionManager.setCurrentQuestionIndex(quizId, questionIndex);
        sessionManager.setCurrentQuestionId(quizId, question.id());
        sessionManager.setCurrentState(quizId, GameState.ACTIVE);
        
        // Clear submitted teams for new question
        submittedTeams.put(quizId, ConcurrentHashMap.newKeySet());
        
        // Broadcast combined game state + question (single message)
        QuestionPayload payload = QuestionPayload.fromDto(question);
        boolean participantNavEnabled = sessionManager.isParticipantNavigationEnabled(quizId);
        broadcastService.broadcastGameState(quizId, GameStateMessage.active(
                quizId, questionIndex, questions.size(), question.difficulty(), payload, participantNavEnabled
        ));
        
        // Only start per-question timer if participant-controlled navigation is NOT enabled
        // (i.e., not using global timer)
        if (!sessionManager.isParticipantNavigationEnabled(quizId)) {
            // Host-paced with per-question timers: auto-advance after timer expires
            int timeLimit = question.timeLimit() > 0 ? question.timeLimit() : 30;
            timerService.startQuestionTimer(quizId, question.id(), timeLimit,
                    qId -> calculateAndRevealResults(quizId, qId));
        }
        // Note: When using global timer (participant-paced), timers are not enforced per-question.
        // Participants manually advance, and results are auto-calculated when they move to next question or timer expires.
        
        logger.info("Showing question {} ({}) for quiz {} (per-question timer: {})", 
                questionIndex, question.id(), quizId, !sessionManager.isParticipantNavigationEnabled(quizId));
    }

    /**
     * Calculates results and broadcasts answer reveal.
     * Ensures REVEAL state is always broadcast even if errors occur during grading.
     */
    @Transactional
    public void calculateAndRevealResults(Long quizId, Long questionId) {
        try {
            QuestionInfoDto question = quizFacade.getQuestionForGrading(questionId);
            List<TeamInfoDto> teams = teamFacade.getTeamsByQuiz(quizId);
            
            // Resolve letter-key (A/B/C/D) to actual option text for correct comparison
            String resolvedCorrectAnswer = question.resolvedCorrectAnswer();
            
            // Grade all submissions and calculate results
            List<TeamResult> results = new ArrayList<>();
            
            for (TeamInfoDto team : teams) {
                try {
                    Optional<SubmissionInfoDto> submissionOpt = submissionFacade.findByTeamAndQuestion(team.id(), question.id());
                    int updatedScore = team.totalScore();
                    
                    if (submissionOpt.isPresent()) {
                        SubmissionInfoDto sub = submissionOpt.get();
                        // Grade if not already graded — use resolved option text, not the letter key
                        if (!sub.isGraded()) {
                            sub = submissionFacade.gradeSubmission(team.id(), question.id(),
                                    resolvedCorrectAnswer, question.points());
                            // Update team score if correct
                            if (sub.isCorrect()) {
                                teamFacade.addPoints(team.id(), sub.awardedPoints());
                                updatedScore += sub.awardedPoints();
                            }
                        }
                        
                        results.add(new TeamResult(
                                team.id(),
                                team.name(),
                                sub.submittedAnswer(),
                                sub.isCorrect(),
                                sub.isCorrect() ? question.points() : 0,
                                updatedScore,
                                0, // Rank will be calculated below
                                false
                        ));
                    } else {
                        // No submission
                        results.add(TeamResult.noSubmission(
                                team.id(),
                                team.name(),
                                updatedScore,
                                0,
                                false
                        ));
                    }
                } catch (Exception e) {
                    logger.warn("Error grading submission for team {} question {}: {}", team.id(), questionId, e.getMessage());
                    // Continue with other teams on error
                    results.add(TeamResult.noSubmission(
                            team.id(),
                            team.name(),
                            team.totalScore(),
                            0,
                            false
                    ));
                }
            }
            
            // Sort by total score and assign ranks
            results.sort((a, b) -> Integer.compare(b.totalScore(), a.totalScore()));
            List<TeamResult> rankedResults = new ArrayList<>();
            int rank = 1;
            int prevScore = Integer.MAX_VALUE;
            int sameRankCount = 0;
            
            for (TeamResult result : results) {
                if (result.totalScore() < prevScore) {
                    rank += sameRankCount;
                    sameRankCount = 1;
                    prevScore = result.totalScore();
                } else {
                    sameRankCount++;
                }
                
                boolean isTied = results.stream()
                        .filter(r -> r.totalScore() == result.totalScore())
                        .count() > 1;
                
                rankedResults.add(new TeamResult(
                        result.teamId(),
                        result.teamName(),
                        result.submittedAnswer(),
                        result.isCorrect(),
                        result.pointsEarned(),
                        result.totalScore(),
                        rank,
                        isTied
                ));
            }
            
            // If this was the last question, end immediately and show final results.
            int currentQuestionIndex = sessionManager.getCurrentQuestionIndex(quizId);
            int totalQuestions = quizFacade.getOrderedQuestions(quizId).size();
            boolean isLastQuestion = totalQuestions > 0 && currentQuestionIndex >= (totalQuestions - 1);
            if (isLastQuestion) {
                logger.info("Last question graded for quiz {}. Ending quiz automatically.", quizId);
                endQuiz(quizId);
                return;
            }

            // Calculate answer distribution (with fallback on error)
            AnswerDistribution distribution;
            try {
                distribution = distributionService.calculateDistribution(questionId);
            } catch (Exception e) {
                logger.warn("Error calculating answer distribution for question {}: {}", questionId, e.getMessage());
                distribution = AnswerDistribution.empty(); // Empty distribution fallback
            }
            
            // Broadcast reveal — send resolved option text as correctAnswer
            AnswerRevealPayload reveal = AnswerRevealPayload.create(
                    questionId,
                    resolvedCorrectAnswer,
                    question.type(),
                    distribution,
                    rankedResults
            );
            
            sessionManager.setCurrentState(quizId, GameState.REVEAL);
            broadcastService.broadcastGameState(quizId, GameStateMessage.reveal(quizId));
            broadcastService.broadcastAnswerReveal(quizId, reveal);
            
            logger.info("Revealed answer for question {} in quiz {}", questionId, quizId);
            
        } catch (Exception e) {
            logger.error("Critical error in calculateAndRevealResults for quiz {} question {}: {}", quizId, questionId, e.getMessage(), e);
            // ALWAYS broadcast REVEAL state even on critical error to prevent frontend from being stuck in GRADING
            try {
                sessionManager.setCurrentState(quizId, GameState.REVEAL);
                broadcastService.broadcastGameState(quizId, GameStateMessage.reveal(quizId));
                // Broadcast empty rankings to show scoreboard
                broadcastService.broadcastGameState(quizId, GameStateMessage.roundSummary(quizId, "Error during grading - please check results"));
            } catch (Exception fallbackError) {
                logger.error("Failed to broadcast fallback REVEAL state for quiz {}: {}", quizId, fallbackError.getMessage(), fallbackError);
            }
        }
    }

    /**
     * Advances to the next question.
     */
    public void advanceToNextQuestion(Long quizId) {
        GameState state = sessionManager.getCurrentState(quizId);

        // If host advances while question is still active, force grading first so points are not skipped.
        if (state == GameState.ACTIVE) {
            Optional<Long> currentQuestionId = sessionManager.getCurrentQuestionId(quizId);
            if (currentQuestionId.isPresent()) {
                timerService.stopTimer(quizId);
                calculateAndRevealResults(quizId, currentQuestionId.get());
                return;
            }
        }

        int currentIndex = sessionManager.getCurrentQuestionIndex(quizId);
        showQuestion(quizId, currentIndex + 1);
    }

    /**
     * Shows the round summary/leaderboard.
     */
    public void showRoundSummary(Long quizId) {
        List<TeamInfoDto> leaderboard = teamFacade.getTeamsByQuiz(quizId).stream()
                .sorted(Comparator.comparingInt(TeamInfoDto::totalScore).reversed())
                .toList();
        List<TeamResult> scoreboard = leaderboard.stream()
                .map(team -> {
                    int rank = leaderboard.indexOf(team) + 1;
                    boolean isTied = leaderboard.stream()
                            .filter(t -> t.totalScore() == team.totalScore())
                            .count() > 1;
                    return new TeamResult(
                            team.id(),
                            team.name(),
                            null,
                            false,
                            0,
                            team.totalScore(),
                            rank,
                            isTied
                    );
                })
                .toList();
        
        sessionManager.setCurrentState(quizId, GameState.ROUND_SUMMARY);
        broadcastService.broadcastGameState(quizId, GameStateMessage.roundSummary(quizId, "ROUND"));
        broadcastService.broadcastScoreboard(quizId, scoreboard);
        
        // Check for ties in top 5
        List<TeamResult> top5 = scoreboard.stream().limit(5).toList();
        boolean hasTies = top5.stream().anyMatch(TeamResult::isTied);
        if (hasTies) {
            broadcastService.sendToHost(quizId, HostNotification.tieDetected(
                    top5.stream().filter(TeamResult::isTied).toList()
            ));
        }
        
        logger.info("Showing round summary for quiz {}", quizId);
    }

    /**
     * Handles answer submission from a participant.
     */
    @Transactional
    public void handleSubmission(Long quizId, Long teamId, Long questionId, String answer, String sessionId) {
        // Reject submissions from kicked teams
        if (proctorSessionService.isKicked(quizId, teamId)) {
            broadcastService.sendError(sessionId, new ErrorMessage("KICKED", "You have been removed from this session."));
            return;
        }

        // Validate game state
        GameState currentState = sessionManager.getCurrentState(quizId);
        if (currentState != GameState.ACTIVE) {
            broadcastService.sendError(sessionId, ErrorMessage.invalidState(currentState.name()));
            return;
        }
        
        NavigationMode navMode = sessionManager.getNavigationMode(quizId);

        if (navMode == NavigationMode.TOURNAMENT) {
            // Tournament mode: validate timer and current question
            if (!timerService.isTimerActive(quizId)) {
                broadcastService.sendError(sessionId, ErrorMessage.timeExpired());
                return;
            }
            Optional<Long> currentQuestionId = sessionManager.getCurrentQuestionId(quizId);
            if (currentQuestionId.isEmpty() || !currentQuestionId.get().equals(questionId)) {
                broadcastService.sendError(sessionId, ErrorMessage.invalidQuestion());
                return;
            }
        }
        // Class mode: no per-question timer validation, any question is valid
        
        // Validate team and question exist
        if (!teamFacade.teamExists(teamId)) {
            throw new EntityNotFoundException("Team", teamId);
        }
        if (!quizFacade.questionExists(questionId)) {
            throw new EntityNotFoundException("Question", questionId);
        }
        
        // Submit or update answer via facade (handles create-or-update logic)
        submissionFacade.submitAnswer(teamId, questionId, answer);
        logger.debug("Submitted answer for team {} question {}", teamId, questionId);
        
        // Track submitted teams
        Set<Long> submitted = submittedTeams.computeIfAbsent(quizId, k -> ConcurrentHashMap.newKeySet());
        boolean isFirstSubmission = submitted.add(teamId);
        
        // Send confirmation to participant
        broadcastService.sendSubmissionConfirmation(quizId, teamId, questionId);

        // Track answered questions for Class mode
        if (navMode == NavigationMode.CLASS) {
            List<QuestionInfoDto> questions = quizFacade.getOrderedQuestions(quizId);
            for (int i = 0; i < questions.size(); i++) {
                if (questions.get(i).id().equals(questionId)) {
                    sessionManager.markQuestionAnswered(quizId, teamId, i);
                    break;
                }
            }
        }
        
        // Notify host on first submission, and always in Class mode so early-submit actions are reflected.
        if (isFirstSubmission || navMode == NavigationMode.CLASS) {
            broadcastService.notifyTeamSubmitted(quizId, teamId);

            // Check if all teams have submitted (only needs first submission bookkeeping)
            if (!isFirstSubmission) {
                return;
            }

            int connectedTeams = sessionManager.getConnectedTeamCount(quizId);
            if (submitted.size() >= connectedTeams) {
                broadcastService.notifyAllSubmitted(quizId, connectedTeams);
            }
        }
    }

    /**
    * Navigates a participant to a specific question (Class mode only).
     * Returns the question payload for the requested index.
     */
    public QuestionPayload navigateToQuestion(Long quizId, Long teamId, int questionIndex) {
        if (!sessionManager.isParticipantNavigationEnabled(quizId)) {
            throw new IllegalStateException("Question navigation is disabled for this quiz session.");
        }

        if (proctorSessionService.isKicked(quizId, teamId)) {
            throw new IllegalStateException("You have been removed from this session.");
        }

        List<QuestionInfoDto> questions = quizFacade.getOrderedQuestions(quizId);
        if (questionIndex < 0 || questionIndex >= questions.size()) {
            throw new IllegalArgumentException("Invalid question index.");
        }

        QuestionInfoDto question = questions.get(questionIndex);
        return QuestionPayload.fromDto(question);
    }

    /**
    * Starts a Class quiz session — sends all questions at once and starts global timer.
     */
    public void startClassQuiz(Long quizId, int globalTimeLimitSeconds) {
        var quizInfo = quizFacade.getQuizInfo(quizId);
        if (quizInfo.status() != com.intelliquiz.api.shared.enums.QuizStatus.READY) {
            throw new IllegalArgumentException("Quiz must be READY before it can be started");
        }

        // Fresh run safeguard: remove lingering submissions from previous sessions of this quiz.
        submissionFacade.clearSubmissionsForQuiz(quizId);

        // Mark the quiz as live so proctors and participants can connect via SSE
        quizFacade.activateSession(quizId);

        sessionManager.setNavigationMode(quizId, NavigationMode.CLASS);
        // CLASS mode is always participant-navigated, including during reconnects in BUFFER.
        sessionManager.setParticipantNavigationEnabled(quizId, true);
        
        // Start with BUFFER phase (same as Tournament quizzes) - ensure all participants are ready
        sessionManager.setCurrentState(quizId, GameState.BUFFER);
        
        // Start buffer countdown, then activate Class quiz
        timerService.startBufferCountdown(quizId, BUFFER_DURATION_SECONDS, "CLASS Quiz Start", () -> {
            activateClassQuizWithRetry(quizId, globalTimeLimitSeconds, 1);
        });
        
        logger.info("Starting BUFFER phase for CLASS quiz {} with {} questions, global timer: {}s",
                quizId, quizFacade.getOrderedQuestions(quizId).size(), globalTimeLimitSeconds);
    }

    private void activateTournamentRoundWithRetry(Long quizId, int globalTimeLimitSeconds, int attempt) {
        try {
            activateTournamentRound(quizId, globalTimeLimitSeconds);
        } catch (Exception ex) {
            if (attempt < ACTIVATION_MAX_RETRIES) {
                logger.warn("Tournament activation failed for quiz {} on attempt {}/{}. Retrying in {}s. Cause: {}",
                        quizId, attempt, ACTIVATION_MAX_RETRIES, ACTIVATION_RETRY_DELAY_SECONDS, ex.getMessage());
                CompletableFuture.delayedExecutor(ACTIVATION_RETRY_DELAY_SECONDS, TimeUnit.SECONDS)
                        .execute(() -> activateTournamentRoundWithRetry(quizId, globalTimeLimitSeconds, attempt + 1));
                return;
            }

            logger.error("Tournament activation failed for quiz {} after {} attempts", quizId, ACTIVATION_MAX_RETRIES, ex);
            recoverFailedActivation(quizId);
        }
    }

    private void activateClassQuizWithRetry(Long quizId, int globalTimeLimitSeconds, int attempt) {
        try {
            activateClassQuiz(quizId, globalTimeLimitSeconds);
        } catch (Exception ex) {
            if (attempt < ACTIVATION_MAX_RETRIES) {
                logger.warn("Class activation failed for quiz {} on attempt {}/{}. Retrying in {}s. Cause: {}",
                        quizId, attempt, ACTIVATION_MAX_RETRIES, ACTIVATION_RETRY_DELAY_SECONDS, ex.getMessage());
                CompletableFuture.delayedExecutor(ACTIVATION_RETRY_DELAY_SECONDS, TimeUnit.SECONDS)
                        .execute(() -> activateClassQuizWithRetry(quizId, globalTimeLimitSeconds, attempt + 1));
                return;
            }

            logger.error("Class activation failed for quiz {} after {} attempts", quizId, ACTIVATION_MAX_RETRIES, ex);
            recoverFailedActivation(quizId);
        }
    }

    private void recoverFailedActivation(Long quizId) {
        sessionManager.setCurrentState(quizId, GameState.LOBBY);
        broadcastService.broadcastGameState(
                quizId,
                GameStateMessage.lobby(quizId, "Unable to start quiz due to temporary server load. Please start again.")
        );
        quizFacade.deactivateSession(quizId);
        timerService.stopTimer(quizId);
    }

    /**
    * Activates Class quiz after buffer countdown completes.
     * Broadcasts all questions and starts global timer if configured.
     */
    private void activateClassQuiz(Long quizId, int globalTimeLimitSeconds) {
        sessionManager.setCurrentState(quizId, GameState.ACTIVE);
        
        List<QuestionInfoDto> questions = quizFacade.getOrderedQuestions(quizId);

    // CLASS mode always allows participant navigation
    sessionManager.setParticipantNavigationEnabled(quizId, true);

        // Broadcast all questions (JIT — no correctKey)
        List<QuestionPayload> allQuestions = questions.stream()
                .map(QuestionPayload::fromDto)
                .toList();
        QuestionPayload firstQuestion = allQuestions.getFirst();
        broadcastService.broadcastGameState(quizId, GameStateMessage.active(
            quizId, 0, questions.size(), "CLASS", firstQuestion, true  // CLASS always has participant navigation
        ));
        // TODO: broadcast full question list to /topic/quiz/{quizId}/questions for palette

        // Start global timer
        if (globalTimeLimitSeconds > 0) {
            timerService.startGlobalTimer(quizId, globalTimeLimitSeconds, () -> {
                // Auto-submit and grade all questions on global timeout
                autoGradeAllQuestions(quizId);
            });
        }

        logger.info("Activated CLASS quiz {} with {} questions, global timer: {}s",
                quizId, questions.size(), globalTimeLimitSeconds);
    }

    /**
    * Auto-grades all questions for all teams (used when global timer expires in Class mode).
     */
    @Transactional
    public void autoGradeAllQuestions(Long quizId) {
        List<QuestionInfoDto> questions = quizFacade.getOrderedQuestions(quizId);
        for (QuestionInfoDto question : questions) {
            if (sessionManager.getCurrentState(quizId) == GameState.ENDED) {
                logger.info("Class auto-grading for quiz {} stopped early because quiz already ended", quizId);
                return;
            }
            calculateAndRevealResults(quizId, question.id());
        }

        // Class mode timeout should complete the run and take everyone straight to final results.
        if (sessionManager.getCurrentState(quizId) != GameState.ENDED) {
            endQuiz(quizId);
        }
    }

    /**
     * Starts tiebreaker mode.
     */
    public void startTiebreaker(Long quizId) {
        sessionManager.setCurrentState(quizId, GameState.TIEBREAKER);
        broadcastService.broadcastGameState(quizId, new GameStateMessage(
                GameState.TIEBREAKER, quizId, null, null, "TIEBREAKER", "Tiebreaker round!", null, false
        ));
        logger.info("Started tiebreaker for quiz {}", quizId);
        // TODO: Implement full tiebreaker logic with spectator mode
    }

    /**
     * Ends the quiz session.
     */
    public void endQuiz(Long quizId) {
        timerService.stopTimer(quizId);
        
        // Build and broadcast final scoreboard before clearing session
        List<TeamInfoDto> leaderboard = teamFacade.getTeamsByQuiz(quizId).stream()
                .sorted(Comparator.comparingInt(TeamInfoDto::totalScore).reversed())
                .toList();
        List<TeamResult> finalScoreboard = leaderboard.stream()
                .map(team -> {
                    int rank = leaderboard.indexOf(team) + 1;
                    boolean isTied = leaderboard.stream()
                            .filter(t -> t.totalScore() == team.totalScore()).count() > 1;
                    return new TeamResult(
                            team.id(), team.name(), null, false, 0,
                            team.totalScore(), rank, isTied
                    );
                })
                .toList();
        
        sessionManager.setCurrentState(quizId, GameState.ENDED);
        broadcastService.broadcastGameState(quizId, GameStateMessage.ended(quizId));
        broadcastService.broadcastScoreboard(quizId, finalScoreboard);

        // One-time proctor flow: once the run ends, deactivate and archive quiz to expire host PIN access.
        quizFacade.deactivateSession(quizId);
        quizFacade.archiveQuiz(quizId);
        
        // Clear session data
        sessionManager.clearQuizSession(quizId);
        proctorSessionService.clearSession(quizId);
        submittedTeams.remove(quizId);
        
        logger.info("Ended quiz {}", quizId);
    }

    /**
     * Pauses the game.
     */
    public void pauseGame(Long quizId) {
        timerService.pauseTimer(quizId);
        logger.info("Paused quiz {}", quizId);
    }

    /**
     * Resumes the game.
     */
    public void resumeGame(Long quizId) {
        NavigationMode navMode = sessionManager.getNavigationMode(quizId);
        if (navMode == NavigationMode.CLASS) {
            timerService.resumeGlobalTimer(quizId, () -> autoGradeAllQuestions(quizId));
        } else {
            timerService.resumeTimer(quizId, qId -> calculateAndRevealResults(quizId, qId));
        }
        
        // Broadcast proper ACTIVE state with current question data
        int questionIndex = sessionManager.getCurrentQuestionIndex(quizId);
        List<QuestionInfoDto> questions = quizFacade.getOrderedQuestions(quizId);
        if (questionIndex < questions.size()) {
            QuestionInfoDto question = questions.get(questionIndex);
            QuestionPayload payload = QuestionPayload.fromDto(question);
            sessionManager.setCurrentState(quizId, GameState.ACTIVE);
            boolean participantNavEnabled = sessionManager.isParticipantNavigationEnabled(quizId);
            broadcastService.broadcastGameState(quizId, GameStateMessage.active(
                    quizId, questionIndex, questions.size(), question.difficulty(), payload, participantNavEnabled
            ));
        }
        
        logger.info("Resumed quiz {}", quizId);
    }
}
