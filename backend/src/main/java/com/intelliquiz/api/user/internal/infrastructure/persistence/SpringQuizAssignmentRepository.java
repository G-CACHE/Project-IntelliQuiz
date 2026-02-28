package com.intelliquiz.api.user.internal.infrastructure.persistence;

import com.intelliquiz.api.user.internal.domain.entities.QuizAssignment;
import com.intelliquiz.api.user.internal.domain.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for QuizAssignment entity.
 */
@Repository
public interface SpringQuizAssignmentRepository extends JpaRepository<QuizAssignment, Long> {

    Optional<QuizAssignment> findByUserAndQuizId(User user, Long quizId);

    List<QuizAssignment> findByUser(User user);

    List<QuizAssignment> findByQuizId(Long quizId);
}
