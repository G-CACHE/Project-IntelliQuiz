package com.intelliquiz.api.infrastructure.adapters.persistence.spring;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Team entity.
 */
@Repository
public interface SpringTeamRepository extends JpaRepository<Team, Long> {

    Optional<Team> findByAccessCode(String accessCode);

    List<Team> findByQuiz(Quiz quiz);
}
