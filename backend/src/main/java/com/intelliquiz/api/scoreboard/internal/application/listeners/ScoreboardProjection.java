package com.intelliquiz.api.scoreboard.internal.application.listeners;

import com.intelliquiz.api.scoreboard.internal.domain.entities.ScoreboardEntry;
import com.intelliquiz.api.scoreboard.internal.domain.ports.ScoreboardReadRepository;
import com.intelliquiz.api.submission.events.SubmissionGradedEvent;
import com.intelliquiz.api.team.events.TeamRegisteredEvent;
import com.intelliquiz.api.team.events.TeamRemovedEvent;
import com.intelliquiz.api.team.events.TeamScoreResetEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * CQRS projection that maintains the scoreboard read model.
 * Listens to domain events and updates the denormalized scoreboard_entries table.
 */
@Service
@Transactional
public class ScoreboardProjection {

    private static final Logger logger = LoggerFactory.getLogger(ScoreboardProjection.class);

    private final ScoreboardReadRepository repository;

    public ScoreboardProjection(ScoreboardReadRepository repository) {
        this.repository = repository;
    }

    /**
     * When a team registers, create a new scoreboard entry with score 0.
     */
    @EventListener
    public void on(TeamRegisteredEvent event) {
        logger.debug("ScoreboardProjection: team registered — teamId={}, quizId={}", event.teamId(), event.quizId());
        ScoreboardEntry entry = new ScoreboardEntry(event.quizId(), event.teamId(), event.teamName());
        repository.save(entry);
        recalculateRanks(event.quizId());
    }

    /**
     * When a team is removed, delete its scoreboard entry.
     */
    @EventListener
    public void on(TeamRemovedEvent event) {
        logger.debug("ScoreboardProjection: team removed — teamId={}, quizId={}", event.teamId(), event.quizId());
        repository.deleteByTeamId(event.teamId());
        recalculateRanks(event.quizId());
    }

    /**
     * When a submission is graded, add awarded points to the team's entry.
     */
    @EventListener
    public void on(SubmissionGradedEvent event) {
        if (event.awardedPoints() == 0) {
            return; // No score change — skip recalculation
        }
        logger.debug("ScoreboardProjection: submission graded — teamId={}, points={}", event.teamId(), event.awardedPoints());
        repository.findByTeamId(event.teamId()).ifPresent(entry -> {
            entry.addScore(event.awardedPoints());
            repository.save(entry);
            recalculateRanks(entry.getQuizId());
        });
    }

    /**
     * When team scores are reset for a quiz, reset all entries to 0.
     */
    @EventListener
    public void on(TeamScoreResetEvent event) {
        logger.debug("ScoreboardProjection: score reset — quizId={}", event.quizId());
        List<ScoreboardEntry> entries = repository.findByQuizId(event.quizId());
        entries.forEach(ScoreboardEntry::resetScore);
        repository.saveAll(entries);
        recalculateRanks(event.quizId());
    }

    /**
     * Recalculates ranks for all entries in a quiz.
     * Handles ties: teams with equal scores share the same rank, next rank skips.
     */
    void recalculateRanks(Long quizId) {
        List<ScoreboardEntry> entries = repository.findByQuizId(quizId);
        entries.sort(Comparator.comparingInt(ScoreboardEntry::getScore).reversed());

        for (int i = 0; i < entries.size(); i++) {
            ScoreboardEntry entry = entries.get(i);
            int score = entry.getScore();

            // Determine rank: if same score as previous, keep same rank
            int rank;
            if (i > 0 && entries.get(i - 1).getScore() == score) {
                rank = entries.get(i - 1).getRank();
            } else {
                rank = i + 1;
            }

            // Determine if tied: more than one entry with this score
            boolean isTied = entries.stream()
                    .filter(e -> e.getScore() == score)
                    .count() > 1;

            entry.updateRank(rank, isTied);
        }

        repository.saveAll(entries);
    }
}
