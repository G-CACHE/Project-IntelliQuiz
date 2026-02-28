package com.intelliquiz.api.team.internal.infrastructure.persistence;

import com.intelliquiz.api.team.internal.domain.entities.Team;
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

    List<Team> findByQuizId(Long quizId);
}
