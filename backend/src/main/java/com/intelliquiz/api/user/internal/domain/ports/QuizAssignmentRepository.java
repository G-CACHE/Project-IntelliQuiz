package com.intelliquiz.api.user.internal.domain.ports;

import com.intelliquiz.api.user.internal.domain.entities.QuizAssignment;
import com.intelliquiz.api.user.internal.domain.entities.User;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for QuizAssignment persistence operations.
 */
public interface QuizAssignmentRepository {

    QuizAssignment save(QuizAssignment assignment);

    Optional<QuizAssignment> findById(Long id);

    Optional<QuizAssignment> findByUserAndQuizId(User user, Long quizId);

    List<QuizAssignment> findByUser(User user);

    List<QuizAssignment> findByQuizId(Long quizId);

    void delete(QuizAssignment assignment);

    void deleteById(Long id);
}
