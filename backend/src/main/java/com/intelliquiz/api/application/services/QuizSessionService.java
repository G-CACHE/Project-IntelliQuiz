package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.exceptions.EntityNotFoundException;
import com.intelliquiz.api.domain.ports.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Application service for managing quiz sessions.
 * Handles activation/deactivation with single-session rule enforcement.
 */
@Service
@Transactional
public class QuizSessionService {

    private final QuizRepository quizRepository;

    public QuizSessionService(QuizRepository quizRepository) {
        this.quizRepository = quizRepository;
    }

    /**
     * Activates a quiz session.
     * Enforces the single-session rule by deactivating any other active quiz.
     * 
     * @param quizId the ID of the quiz to activate
     * @return the activated quiz
     * @throws EntityNotFoundException if the quiz doesn't exist
     */
    public Quiz activateSession(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

        // Deactivate any other active quizzes (single-session rule)
        List<Quiz> activeQuizzes = quizRepository.findByIsLiveSessionTrue();
        for (Quiz activeQuiz : activeQuizzes) {
            if (!activeQuiz.getId().equals(quizId)) {
                activeQuiz.deactivate();
                quizRepository.save(activeQuiz);
            }
        }

        // Activate the requested quiz
        quiz.activate();
        return quizRepository.save(quiz);
    }

    /**
     * Deactivates a quiz session.
     * 
     * @param quizId the ID of the quiz to deactivate
     * @return the deactivated quiz
     * @throws EntityNotFoundException if the quiz doesn't exist
     */
    public Quiz deactivateSession(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

        quiz.deactivate();
        return quizRepository.save(quiz);
    }

    /**
     * Gets the currently active quiz session, if any.
     * 
     * @return Optional containing the active quiz, or empty if none
     */
    public Optional<Quiz> getActiveSession() {
        List<Quiz> activeQuizzes = quizRepository.findByIsLiveSessionTrue();
        return activeQuizzes.isEmpty() ? Optional.empty() : Optional.of(activeQuizzes.get(0));
    }
}
