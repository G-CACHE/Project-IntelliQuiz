package com.intelliquiz.api.infrastructure.websocket;

/**
 * Game states for the semi-automated quiz flow.
 * Transitions: LOBBY → BUFFER → ACTIVE → GRADING → REVEAL → (NEXT or ROUND_SUMMARY)
 */
public enum GameState {
    /**
     * Waiting for participants to connect.
     * Host sees team grid, participants see waiting screen.
     */
    LOBBY,
    
    /**
     * "Get Ready" countdown (10 seconds before round starts).
     * All clients see countdown animation.
     */
    BUFFER,
    
    /**
     * Question displayed, timer counting down, inputs unlocked.
     * Participants can submit/change answers.
     */
    ACTIVE,
    
    /**
     * Timer hit 0, inputs locked, calculating scores.
     * Brief processing state before auto-reveal.
     */
    GRADING,
    
    /**
     * Answer revealed with result graph.
     * MCQ: bar graph showing option distribution.
     * Identification: correct/incorrect counts.
     */
    REVEAL,
    
    /**
     * Leaderboard display after round ends.
     * Shows top teams with scores and ranks.
     */
    ROUND_SUMMARY,
    
    /**
     * Tiebreaker mode for tied teams in Top 5.
     * Tied teams play, safe teams spectate.
     */
    TIEBREAKER,
    
    /**
     * Quiz finished, session closed.
     * All clients disconnected gracefully.
     */
    ENDED,
    
    /**
     * Timer paused (e.g., host disconnected).
     * Waiting for host to reconnect.
     */
    PAUSED
}
