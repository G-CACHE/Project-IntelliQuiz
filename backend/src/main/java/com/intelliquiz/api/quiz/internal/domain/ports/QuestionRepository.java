package com.intelliquiz.api.quiz.internal.domain.ports;

import com.intelliquiz.api.quiz.internal.domain.entities.Question;
import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for Question persistence operations.
 */
public interface QuestionRepository {

    Question save(Question question);

    Optional<Question> findById(Long id);

    List<Question> findByQuiz(Quiz quiz);

    List<Question> findByQuizOrderByOrderIndex(Quiz quiz);

    void delete(Question question);

    void deleteById(Long id);
}
