package com.intelliquiz.api.infrastructure.adapters.persistence.spring;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Quiz;
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
