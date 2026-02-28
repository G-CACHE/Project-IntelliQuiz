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
        return new QuestionInfoDto(q.getId(), q.getCorrectKey(), q.getPoints(),
                                   q.getType(), q.getTimeLimit());
    }

    /**
     * Get ordered questions for a quiz (used by realtime module).
     */
    public List<QuestionInfoDto> getOrderedQuestions(Long quizId) {
        return questionManagementService.getQuestionsByQuiz(quizId).stream()
                .sorted(Comparator.comparingInt(Question::getOrderIndex))
                .map(q -> new QuestionInfoDto(q.getId(), q.getCorrectKey(),
                                               q.getPoints(), q.getType(), q.getTimeLimit()))
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
}
