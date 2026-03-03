package com.intelliquiz.api.scoreboard.dto;

/**
 * Public DTO for cross-module scoreboard information.
 */
public record ScoreboardEntryDto(
        int rank,
        Long teamId,
        String teamName,
        int score,
        boolean isTied
) {}
