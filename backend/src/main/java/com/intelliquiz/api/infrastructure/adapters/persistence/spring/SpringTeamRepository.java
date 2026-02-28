package com.intelliquiz.api.infrastructure.adapters.persistence.spring;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Team entity.
 */
@Repository
public interface SpringTeamRepository extends JpaRepository<Team, Long> {

    /**
     * Find team by access code with eagerly fetched Quiz.
     * This prevents LazyInitializationException in WebSocket context.
     * Uses case-insensitive comparison for access codes.
     */
    @Query("SELECT t FROM Team t JOIN FETCH t.quiz WHERE UPPER(t.accessCode) = UPPER(:accessCode)")
    Optional<Team> findByAccessCode(@Param("accessCode") String accessCode);

    List<Team> findByQuiz(Quiz quiz);
}
