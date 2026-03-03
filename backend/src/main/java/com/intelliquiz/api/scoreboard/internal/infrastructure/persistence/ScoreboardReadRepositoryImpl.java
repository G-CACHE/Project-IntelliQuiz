package com.intelliquiz.api.scoreboard.internal.infrastructure.persistence;

import com.intelliquiz.api.scoreboard.internal.domain.entities.ScoreboardEntry;
import com.intelliquiz.api.scoreboard.internal.domain.ports.ScoreboardReadRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Adapter bridging the ScoreboardReadRepository port to Spring Data JPA.
 */
@Repository
@Transactional
public class ScoreboardReadRepositoryImpl implements ScoreboardReadRepository {

    private final SpringScoreboardRepository springRepository;

    public ScoreboardReadRepositoryImpl(SpringScoreboardRepository springRepository) {
        this.springRepository = springRepository;
    }

    @Override
    public List<ScoreboardEntry> findByQuizIdOrderByRankAsc(Long quizId) {
        return springRepository.findByQuizIdOrderByRankAsc(quizId);
    }

    @Override
    public List<ScoreboardEntry> findByQuizId(Long quizId) {
        return springRepository.findByQuizId(quizId);
    }

    @Override
    public Optional<ScoreboardEntry> findByTeamId(Long teamId) {
        return springRepository.findByTeamId(teamId);
    }

    @Override
    public ScoreboardEntry save(ScoreboardEntry entry) {
        return springRepository.save(entry);
    }

    @Override
    public void delete(ScoreboardEntry entry) {
        springRepository.delete(entry);
    }

    @Override
    public void deleteByTeamId(Long teamId) {
        springRepository.deleteByTeamId(teamId);
    }

    @Override
    public void deleteByQuizId(Long quizId) {
        springRepository.deleteByQuizId(quizId);
    }

    @Override
    public void saveAll(List<ScoreboardEntry> entries) {
        springRepository.saveAll(entries);
    }
}
