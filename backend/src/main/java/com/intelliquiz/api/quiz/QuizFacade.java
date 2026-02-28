package com.intelliquiz.api.quiz;

import com.intelliquiz.api.quiz.dto.QuestionInfoDto;
import com.intelliquiz.api.quiz.dto.QuizInfoDto;
import com.intelliquiz.api.quiz.internal.application.services.QuestionManagementService;
import com.intelliquiz.api.quiz.internal.application.services.QuizManagementService;
import com.intelliquiz.api.quiz.internal.application.services.QuizSessionService;
import com.intelliquiz.api.quiz.internal.domain.entities.Question;
import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Public facade for the Quiz module.
 * All cross-module access to quiz data should go through this facade.
 */
@Service
public class QuizFacade {

    private final QuizManagementService quizManagementService;
    private final QuestionManagementService questionManagementService;
    private final QuizSessionService quizSessionService;

    public QuizFacade(QuizManagementService quizManagementService,
                      QuestionManagementService questionManagementService,
                      QuizSessionService quizSessionService) {
        this.quizManagementService = quizManagementService;
        this.questionManagementService = questionManagementService;
        this.quizSessionService = quizSessionService;
    }

    /**
     * Get read-only quiz summary for other modules.
     */
    public QuizInfoDto getQuizInfo(Long quizId) {
        Quiz quiz = quizManagementService.getQuiz(quizId);
        return new QuizInfoDto(quiz.getId(), quiz.getTitle(), quiz.getStatus(),
                               quiz.isLiveSession(), quiz.getProctorPin());
    }

    /**
     * Get question data for grading (used by submission module).
     */
    public QuestionInfoDto getQuestionForGrading(Long questionId) {
        Question q = questionManagementService.getQuestion(questionId);
        return toDto(q);
    }

    /**
     * Get ordered questions for a quiz (used by realtime module).
     */
    public List<QuestionInfoDto> getOrderedQuestions(Long quizId) {
        return questionManagementService.getQuestionsByQuiz(quizId).stream()
                .sorted(Comparator.comparingInt(Question::getOrderIndex))
                .map(this::toDto)
                .toList();
    }

    /**
     * Check quiz existence.
     */
    public boolean quizExists(Long quizId) {
        try {
            quizManagementService.getQuiz(quizId);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Activate session (called by realtime module's saga).
     */
    public void activateSession(Long quizId) {
        quizSessionService.activateSession(quizId);
    }

    /**
     * Deactivate session (called by realtime module's saga compensation).
     */
    public void deactivateSession(Long quizId) {
        quizSessionService.deactivateSession(quizId);
    }

    /**
     * Check question existence.
     */
    public boolean questionExists(Long questionId) {
        try {
            questionManagementService.getQuestion(questionId);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private QuestionInfoDto toDto(Question q) {
        return new QuestionInfoDto(
                q.getId(), q.getText(), q.getType(), q.getOptions(),
                q.getCorrectKey(), q.getPoints(), q.getTimeLimit(),
                q.getOrderIndex(),
                q.getDifficulty() != null ? q.getDifficulty().name() : null);
    }

    /**
     * Find all active live quizzes (used by access resolution for proctor PIN matching).
     */
    public List<QuizInfoDto> findActiveLiveQuizzes() {
        return quizManagementService.getAllQuizzes().stream()
                .filter(Quiz::isLiveSession)
                .map(q -> new QuizInfoDto(q.getId(), q.getTitle(), q.getStatus(),
                                          q.isLiveSession(), q.getProctorPin()))
                .toList();
    }

    /**
     * Get all quiz IDs.
     */
    public List<Long> getAllQuizIds() {
        return quizManagementService.getAllQuizzes().stream()
                .map(Quiz::getId)
                .toList();
    }

    /**
     * Get quiz info if it exists, returning empty if not found.
     */
    public Optional<QuizInfoDto> findQuizInfo(Long quizId) {
        try {
            return Optional.of(getQuizInfo(quizId));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
