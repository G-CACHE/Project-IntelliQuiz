package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Submission;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.exceptions.EntityNotFoundException;
import com.intelliquiz.api.domain.ports.QuestionRepository;
import com.intelliquiz.api.domain.ports.QuizRepository;
import com.intelliquiz.api.domain.ports.SubmissionRepository;
import com.intelliquiz.api.domain.ports.TeamRepository;
import com.intelliquiz.api.infrastructure.config.QuizBroadcastService;
import com.intelliquiz.api.infrastructure.config.QuizSessionManager;
import com.intelliquiz.api.infrastructure.websocket.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Orchestrates the semi-automated game flow for quiz sessions.
 * Handles state transitions, submissions, and scoring.
 */
@Service
public class GameFlowService {

    private static final Logger logger = LoggerFactory.getLogger(GameFlowService.class);
    private static final int BUFFER_DURATION_SECONDS = 10;

    private final QuizTimerService timerService;
    private final QuizBroadcastService broadcastService;
    private final QuizSessionManager sessionManager;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final TeamRepository teamRepository;
    private final SubmissionRepository submissionRepository;
    private final AnswerDistributionService distributionService;

    // Quiz ID -> Set of team IDs that have submitted for current question
    private final Map<Long, Set<Long>> submittedTeams = new ConcurrentHashMap<>();

    public GameFlowService(
            QuizTimerService timerService,
            QuizBroadcastService broadcastService,
            QuizSessionManager sessionManager,
            QuizRepository quizRepository,
            QuestionRepository questionRepository,
            TeamRepository teamRepository,
            SubmissionRepository submissionRepository,
            AnswerDistributionService distributionService
    ) {
        this.timerService = timerService;
        this.broadcastService = broadcastService;
        this.sessionManager = sessionManager;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.teamRepository = teamRepository;
        this.submissionRepository = submissionRepository;
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
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        
        List<Question> questions = quiz.getQuestions().stream()
                .sorted(Comparator.comparingInt(Question::getOrderIndex))
                .toList();
        
        if (questionIndex >= questions.size()) {
            // No more questions, show round summary
            showRoundSummary(quizId);
            return;
        }
        
        Question question = questions.get(questionIndex);
        sessionManager.setCurrentQuestionIndex(quizId, questionIndex);
        sessionManager.setCurrentQuestionId(quizId, question.getId());
        sessionManager.setCurrentState(quizId, GameState.ACTIVE);
        
        // Clear submitted teams for new question
        submittedTeams.put(quizId, ConcurrentHashMap.newKeySet());
        
        // Broadcast question (JIT - no correctKey)
        QuestionPayload payload = QuestionPayload.from(question);
        broadcastService.broadcastQuestion(quizId, payload);
        broadcastService.broadcastGameState(quizId, GameStateMessage.active(
                quizId, questionIndex, questions.size(), 
                question.getDifficulty() != null ? question.getDifficulty().name() : null
        ));
        
        // Start question timer
        int timeLimit = question.getTimeLimit() > 0 ? question.getTimeLimit() : 30;
        timerService.startQuestionTimer(quizId, question.getId(), timeLimit, this::onTimerExpired);
        
        logger.info("Showing question {} ({}) for quiz {}", questionIndex, question.getId(), quizId);
    }

    /**
     * Called when question timer expires.
     */
    private void onTimerExpired(Long questionId) {
        Question question = questionRepository.findById(questionId).orElse(null);
        if (question == null) return;
        
        Long quizId = question.getQuiz().getId();
        logger.info("Timer expired for question {} in quiz {}", questionId, quizId);
        
        // Auto-transition to GRADING (already done by timer service)
        // Then calculate results and auto-transition to REVEAL
        calculateAndRevealResults(quizId, questionId);
    }

    /**
     * Calculates results and broadcasts answer reveal.
     */
    @Transactional
    public void calculateAndRevealResults(Long quizId, Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));
        
        Quiz quiz = question.getQuiz();
        List<Team> teams = quiz.getTeams();
        
        // Grade all submissions and calculate results
        List<TeamResult> results = new ArrayList<>();
        
        for (Team team : teams) {
            Optional<Submission> submissionOpt = submissionRepository.findByTeamAndQuestion(team, question);
            
            if (submissionOpt.isPresent()) {
                Submission submission = submissionOpt.get();
                // Grade if not already graded
                if (!submission.isGraded()) {
                    submission.grade();
                    submissionRepository.save(submission);
                }
                
                results.add(new TeamResult(
                        team.getId(),
                        team.getName(),
                        submission.getSubmittedAnswer(),
                        submission.isCorrect(),
                        submission.isCorrect() ? question.getPoints() : 0,
                        team.getTotalScore(),
                        0, // Rank will be calculated below
                        false
                ));
            } else {
                // No submission
                results.add(TeamResult.noSubmission(
                        team.getId(),
                        team.getName(),
                        team.getTotalScore(),
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
                question.getCorrectKey(),
                question.getType(),
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
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));
        
        List<TeamResult> scoreboard = quiz.getLeaderboard().stream()
                .map(team -> {
                    int rank = quiz.getLeaderboard().indexOf(team) + 1;
                    boolean isTied = quiz.getLeaderboard().stream()
                            .filter(t -> t.getTotalScore() == team.getTotalScore())
                            .count() > 1;
                    return new TeamResult(
                            team.getId(),
                            team.getName(),
                            null,
                            false,
                            0,
                            team.getTotalScore(),
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
        
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team", teamId));
        
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));
        
        // Check for existing submission and update or create
        Optional<Submission> existingSubmission = submissionRepository.findByTeamAndQuestion(team, question);
        
        Submission submission;
        if (existingSubmission.isPresent()) {
            // Update existing submission (answer change allowed)
            submission = existingSubmission.get();
            submission.setSubmittedAnswer(answer);
            submission.setGraded(false); // Reset grading for new answer
            submissionRepository.save(submission);
            logger.debug("Updated submission for team {} question {}", teamId, questionId);
        } else {
            // Create new submission
            submission = new Submission(team, question, answer);
            submission.validateSubmittedAt();
            team.addSubmission(submission);
            teamRepository.save(team);
            submissionRepository.save(submission);
            logger.debug("Created submission for team {} question {}", teamId, questionId);
        }
        
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
        timerService.resumeTimer(quizId, this::onTimerExpired);
        logger.info("Resumed quiz {}", quizId);
    }
}
