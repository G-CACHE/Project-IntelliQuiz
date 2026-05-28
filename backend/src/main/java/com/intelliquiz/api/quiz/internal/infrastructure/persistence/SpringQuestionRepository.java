package com.intelliquiz.api.quiz.internal.infrastructure.persistence;

import com.intelliquiz.api.quiz.internal.domain.entities.Question;
import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Question entity.
 */
@Repository
public interface SpringQuestionRepository extends JpaRepository<Question, Long> {

    @Override
    @EntityGraph(attributePaths = "options")
    @NonNull Optional<Question> findById(@NonNull Long id);

    @EntityGraph(attributePaths = "options")
    List<Question> findByQuiz(Quiz quiz);

    @EntityGraph(attributePaths = "options")
    List<Question> findByQuizOrderByOrderIndex(Quiz quiz);
}
