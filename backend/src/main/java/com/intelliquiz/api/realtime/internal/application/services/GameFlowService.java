package com.intelliquiz.api.realtime.internal.application.services;

import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.quiz.dto.QuestionInfoDto;
import com.intelliquiz.api.submission.SubmissionFacade;
import com.intelliquiz.api.submission.dto.SubmissionInfoDto;
import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.team.dto.TeamInfoDto;
import com.intelliquiz.api.shared.exceptions.EntityNotFoundException;
import com.intelliquiz.api.realtime.internal.domain.enums.GameState;
import com.intelliquiz.api.realtime.internal.presentation.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Orchestrates the semi-automated game flow for quiz sessions.
 * Handles state transitions, submissions, and scoring.
 * Uses module facades instead of direct repository access.
 */
@Service
public class GameFlowService {

    private static final Logger logger = LoggerFactory.getLogger(GameFlowService.class);
    private static final int BUFFER_DURATION_SECONDS = 10;

    private final QuizTimerService timerService;
    private final QuizBroadcastService broadcastService;
    private final QuizSessionManager sessionManager;
    private final QuizFacade quizFacade;
    private final TeamFacade teamFacade;
    private final SubmissionFacade submissionFacade;
    private final AnswerDistributionService distributionService;

    // Quiz ID -> Set of team IDs that have submitted for current question
    private final Map<Long, Set<Long>> submittedTeams = new ConcurrentHashMap<>();

    public GameFlowService(
            QuizTimerService timerService,
            QuizBroadcastService broadcastService,
            QuizSessionManager sessionManager,
            QuizFacade quizFacade,
            TeamFacade teamFacade,
            SubmissionFacade submissionFacade,
            AnswerDistributionService distributionService
    ) {
        this.timerService = timerService;
        this.broadcastService = broadcastService;
        this.sessionManager = sessionManager;
        this.quizFacade = quizFacade;
        this.teamFacade = teamFacade;
        this.submissionFacade = submissionFacade;
        this.distributionService = distributionService;
    }

    /**
     * Starts a round with buffer countdown.
     */
    public void startRound(Long quizId, String roundName) {
        logger.info("Starting round {} for quiz {}", roundName, quizId);
        
        sessionManager.setCurrentState(quizId, GameState.BUFFER);
        sessionManager.setCurrentQuestionIndex(quizId, 0);
        
        // Start buffer countdown, then auto-start first question
        timerService.startBufferCountdown(quizId, BUFFER_DURATION_SECONDS, roundName, () -> {
            showQuestion(quizId, 0);
        });
    }

    /**
     * Shows a question and starts the timer.
     */
    public void showQuestion(Long quizId, int questionIndex) {
        List<QuestionInfoDto> questions = quizFacade.getOrderedQuestions(quizId);
        
        if (questionIndex >= questions.size()) {
            // No more questions, show round summary
            showRoundSummary(quizId);
            return;
        }
        
        QuestionInfoDto question = questions.get(questionIndex);
        sessionManager.setCurrentQuestionIndex(quizId, questionIndex);
        sessionManager.setCurrentQuestionId(quizId, question.id());
        sessionManager.setCurrentState(quizId, GameState.ACTIVE);
        
        // Clear submitted teams for new question
        submittedTeams.put(quizId, ConcurrentHashMap.newKeySet());
        
        // Broadcast question (JIT - no correctKey)
        QuestionPayload payload = QuestionPayload.fromDto(question);
        broadcastService.broadcastQuestion(quizId, payload);
        broadcastService.broadcastGameState(quizId, GameStateMessage.active(
                quizId, questionIndex, questions.size(), question.difficulty()
        ));
        
        // Start question timer — capture quizId for callback
        int timeLimit = question.timeLimit() > 0 ? question.timeLimit() : 30;
        timerService.startQuestionTimer(quizId, question.id(), timeLimit,
                qId -> calculateAndRevealResults(quizId, qId));
        
        logger.info("Showing question {} ({}) for quiz {}", questionIndex, question.id(), quizId);
    }

    /**
     * Calculates results and broadcasts answer reveal.
     */
    @Transactional
    public void calculateAndRevealResults(Long quizId, Long questionId) {
        QuestionInfoDto question = quizFacade.getQuestionForGrading(questionId);
        List<TeamInfoDto> teams = teamFacade.getTeamsByQuiz(quizId);
        
        // Grade all submissions and calculate results
        List<TeamResult> results = new ArrayList<>();
        
        for (TeamInfoDto team : teams) {
            Optional<SubmissionInfoDto> submissionOpt = submissionFacade.findByTeamAndQuestion(team.id(), question.id());
            int updatedScore = team.totalScore();
            
            if (submissionOpt.isPresent()) {
                SubmissionInfoDto sub = submissionOpt.get();
                // Grade if not already graded
                if (!sub.isGraded()) {
                    sub = submissionFacade.gradeSubmission(team.id(), question.id(),
                            question.correctKey(), question.points());
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
        
        // Calculate answer distribution
        AnswerDistribution distribution = distributionService.calculateDistribution(questionId);
        
        // Broadcast reveal
        AnswerRevealPayload reveal = AnswerRevealPayload.create(
                questionId,
                question.correctKey(),
                question.type(),
                distribution,
                rankedResults
        );
        
        sessionManager.setCurrentState(quizId, GameState.REVEAL);
        broadcastService.broadcastGameState(quizId, GameStateMessage.reveal(quizId));
        broadcastService.broadcastAnswerReveal(quizId, reveal);
        
        logger.info("Revealed answer for question {} in quiz {}", questionId, quizId);
    }

    /**
     * Advances to the next question.
     */
    public void advanceToNextQuestion(Long quizId) {
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
        // Validate game state
        GameState currentState = sessionManager.getCurrentState(quizId);
        if (currentState != GameState.ACTIVE) {
            broadcastService.sendError(sessionId, ErrorMessage.invalidState(currentState.name()));
            return;
        }
        
        // Validate timer is active
        if (!timerService.isTimerActive(quizId)) {
            broadcastService.sendError(sessionId, ErrorMessage.timeExpired());
            return;
        }
        
        // Validate question is current
        Optional<Long> currentQuestionId = sessionManager.getCurrentQuestionId(quizId);
        if (currentQuestionId.isEmpty() || !currentQuestionId.get().equals(questionId)) {
            broadcastService.sendError(sessionId, ErrorMessage.invalidQuestion());
            return;
        }
        
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
        
        // Notify host (only on first submission, not updates)
        if (isFirstSubmission) {
            broadcastService.notifyTeamSubmitted(quizId, teamId);
            
            // Check if all teams have submitted
            int connectedTeams = sessionManager.getConnectedTeamCount(quizId);
            if (submitted.size() >= connectedTeams) {
                broadcastService.notifyAllSubmitted(quizId, connectedTeams);
            }
        }
    }

    /**
     * Starts tiebreaker mode.
     */
    public void startTiebreaker(Long quizId) {
        sessionManager.setCurrentState(quizId, GameState.TIEBREAKER);
        broadcastService.broadcastGameState(quizId, new GameStateMessage(
                GameState.TIEBREAKER, quizId, null, null, "TIEBREAKER", "Tiebreaker round!"
        ));
        logger.info("Started tiebreaker for quiz {}", quizId);
        // TODO: Implement full tiebreaker logic with spectator mode
    }

    /**
     * Ends the quiz session.
     */
    public void endQuiz(Long quizId) {
        timerService.stopTimer(quizId);
        sessionManager.setCurrentState(quizId, GameState.ENDED);
        broadcastService.broadcastGameState(quizId, GameStateMessage.ended(quizId));
        
        // Clear session data
        sessionManager.clearQuizSession(quizId);
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
        timerService.resumeTimer(quizId, qId -> calculateAndRevealResults(quizId, qId));
        logger.info("Resumed quiz {}", quizId);
    }
}
