package com.intelliquiz.api.infrastructure.websocket.dto;

/**
 * Individual team result after answer reveal.
 */
public record TeamResult(
        Long teamId,
        String teamName,
        String submittedAnswer,
        boolean isCorrect,
        int pointsEarned,
        int totalScore,
        int rank,
        boolean isTied
) {
    public static TeamResult correct(Long teamId, String teamName, String answer, int points, int totalScore, int rank, boolean tied) {
        return new TeamResult(teamId, teamName, answer, true, points, totalScore, rank, tied);
    }
    
    public static TeamResult incorrect(Long teamId, String teamName, String answer, int totalScore, int rank, boolean tied) {
        return new TeamResult(teamId, teamName, answer, false, 0, totalScore, rank, tied);
    }
    
    public static TeamResult noSubmission(Long teamId, String teamName, int totalScore, int rank, boolean tied) {
        return new TeamResult(teamId, teamName, null, false, 0, totalScore, rank, tied);
    }
}
