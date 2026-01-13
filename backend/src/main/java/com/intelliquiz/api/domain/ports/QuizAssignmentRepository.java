package com.intelliquiz.api.domain.ports;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.QuizAssignment;
import com.intelliquiz.api.domain.entities.User;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for QuizAssignment persistence operations.
 */
public interface QuizAssignmentRepository {

    QuizAssignment save(QuizAssignment assignment);

    Optional<QuizAssignment> findById(Long id);

    Optional<QuizAssignment> findByUserAndQuiz(User user, Quiz quiz);

    List<QuizAssignment> findByUser(User user);

    List<QuizAssignment> findByQuiz(Quiz quiz);

    void delete(QuizAssignment assignment);

    void deleteById(Long id);
}
