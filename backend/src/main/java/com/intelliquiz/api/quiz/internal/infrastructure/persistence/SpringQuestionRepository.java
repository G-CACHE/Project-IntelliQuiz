package com.intelliquiz.api.quiz.internal.infrastructure.persistence;

import com.intelliquiz.api.quiz.internal.domain.entities.Question;
import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for Question entity.
 */
@Repository
public interface SpringQuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByQuiz(Quiz quiz);

    List<Question> findByQuizOrderByOrderIndex(Quiz quiz);
}
