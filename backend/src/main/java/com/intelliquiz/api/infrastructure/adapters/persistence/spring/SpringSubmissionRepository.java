package com.intelliquiz.api.infrastructure.adapters.persistence.spring;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Submission;
import com.intelliquiz.api.domain.entities.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Submission entity.
 */
@Repository
public interface SpringSubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByTeam(Team team);

    List<Submission> findByQuestion(Question question);

    Optional<Submission> findByTeamAndQuestion(Team team, Question question);
}
