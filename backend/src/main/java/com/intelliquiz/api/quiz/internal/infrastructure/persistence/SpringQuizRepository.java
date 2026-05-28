package com.intelliquiz.api.quiz.internal.infrastructure.persistence;

import com.intelliquiz.api.quiz.internal.domain.entities.Quiz;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Quiz entity.
 */
@Repository
public interface SpringQuizRepository extends JpaRepository<Quiz, Long> {

    @Override
    @EntityGraph(attributePaths = "questions")
    @NonNull Optional<Quiz> findById(@NonNull Long id);

    @EntityGraph(attributePaths = "questions")
    List<Quiz> findByCreatedByUserId(Long createdByUserId);

    @EntityGraph(attributePaths = "questions")
    List<Quiz> findByIsLiveSessionTrue();

    boolean existsByQuizCodeIgnoreCase(String quizCode);

    @EntityGraph(attributePaths = "questions")
    Optional<Quiz> findByQuizCodeIgnoreCase(String quizCode);
}
