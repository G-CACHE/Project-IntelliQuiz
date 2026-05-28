package com.intelliquiz.api.scoreboard;

import com.intelliquiz.api.scoreboard.dto.ScoreboardEntryDto;
import com.intelliquiz.api.scoreboard.internal.application.query.ScoreboardQueryService;
import com.intelliquiz.api.scoreboard.internal.domain.entities.ScoreboardEntry;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Public facade for the scoreboard module.
 * Provides cross-module access to scoreboard/leaderboard data.
 */
@Service
public class ScoreboardFacade {

    private final ScoreboardQueryService queryService;

    public ScoreboardFacade(ScoreboardQueryService queryService) {
        this.queryService = queryService;
    }

    /**
     * Gets the leaderboard for a quiz, sorted by rank.
     */
    public List<ScoreboardEntryDto> getLeaderboard(Long quizId) {
        return queryService.getLeaderboard(quizId).stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Gets the full scoreboard for a quiz.
     */
    public List<ScoreboardEntryDto> getScoreboard(Long quizId) {
        return queryService.getScoreboard(quizId).stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Checks if there are ties in the top N positions.
     */
    public boolean hasTiesInTopN(Long quizId, int topN) {
        return queryService.hasTiesInTopN(quizId, topN);
    }

    private ScoreboardEntryDto toDto(ScoreboardEntry entry) {
        return new ScoreboardEntryDto(
                entry.getRank(),
                entry.getTeamId(),
                entry.getTeamName(),
                entry.getScore(),
                entry.isTied()
        );
    }
}
