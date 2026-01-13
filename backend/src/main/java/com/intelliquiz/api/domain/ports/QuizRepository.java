package com.intelliquiz.api.domain.ports;

import com.intelliquiz.api.domain.entities.Quiz;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for Quiz persistence operations.
 */
public interface QuizRepository {

    Quiz save(Quiz quiz);

    Optional<Quiz> findById(Long id);

    List<Quiz> findAll();

    List<Quiz> findByIsLiveSessionTrue();

    void delete(Quiz quiz);

    void deleteById(Long id);
}
