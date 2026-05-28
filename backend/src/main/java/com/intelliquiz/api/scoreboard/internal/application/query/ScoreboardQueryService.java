package com.intelliquiz.api.scoreboard.internal.application.query;

import com.intelliquiz.api.scoreboard.internal.domain.entities.ScoreboardEntry;
import com.intelliquiz.api.scoreboard.internal.domain.ports.ScoreboardReadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CQRS query service for the scoreboard.
 * Reads directly from the denormalized scoreboard_entries table — no joins needed.
 */
@Service
@Transactional(readOnly = true)
public class ScoreboardQueryService {

    private final ScoreboardReadRepository repository;

    public ScoreboardQueryService(ScoreboardReadRepository repository) {
        this.repository = repository;
    }

    /**
     * Returns the scoreboard for a quiz, sorted by rank ascending.
     */
    public List<ScoreboardEntry> getScoreboard(Long quizId) {
        return repository.findByQuizIdOrderByRankAsc(quizId);
    }

    /**
     * Returns the leaderboard for a quiz (same as scoreboard, ranked).
     */
    public List<ScoreboardEntry> getLeaderboard(Long quizId) {
        return repository.findByQuizIdOrderByRankAsc(quizId);
    }

    /**
     * Returns tied teams in the top N positions.
     */
    public List<ScoreboardEntry> getTiedTeamsInTopN(Long quizId, int topN) {
        return repository.findByQuizIdOrderByRankAsc(quizId).stream()
                .filter(e -> e.getRank() <= topN)
                .filter(ScoreboardEntry::isTied)
                .toList();
    }

    /**
     * Returns whether there are ties in the top N positions.
     */
    public boolean hasTiesInTopN(Long quizId, int topN) {
        return !getTiedTeamsInTopN(quizId, topN).isEmpty();
    }
}
