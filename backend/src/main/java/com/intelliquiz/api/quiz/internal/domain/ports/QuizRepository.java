package com.intelliquiz.api.quiz.internal.domain.ports;

import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for Quiz persistence operations.
 */
public interface QuizRepository {

    Quiz save(Quiz quiz);

    Optional<Quiz> findById(Long id);

    List<Quiz> findAll();

    List<Quiz> findByCreatedByUserId(Long userId);

    List<Quiz> findByIsLiveSessionTrue();

    boolean existsByQuizCodeIgnoreCase(String quizCode);

    Optional<Quiz> findByQuizCodeIgnoreCase(String quizCode);

    void delete(Quiz quiz);

    void deleteById(Long id);
}
