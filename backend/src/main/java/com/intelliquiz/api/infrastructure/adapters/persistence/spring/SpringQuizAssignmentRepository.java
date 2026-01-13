package com.intelliquiz.api.infrastructure.adapters.persistence.spring;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.QuizAssignment;
import com.intelliquiz.api.domain.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for QuizAssignment entity.
 */
@Repository
public interface SpringQuizAssignmentRepository extends JpaRepository<QuizAssignment, Long> {

    Optional<QuizAssignment> findByUserAndQuiz(User user, Quiz quiz);

    List<QuizAssignment> findByUser(User user);

    List<QuizAssignment> findByQuiz(Quiz quiz);
}
