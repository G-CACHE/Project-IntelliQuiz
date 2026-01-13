package com.intelliquiz.api.infrastructure.websocket;

/**
 * Host command types for controlling the quiz flow.
 * Minimal interaction needed due to semi-automated game loop.
 */
public enum HostCommandType {
    /**
     * Triggers BUFFER countdown, then auto-starts questions.
     * Used at the beginning of each round (Easy, Medium, Hard).
     */
    START_ROUND,
    
    /**
     * Advances to the next question after REVEAL state.
     * Only needed between questions within a round.
     */
    NEXT_QUESTION,
    
    /**
     * Shows round summary/leaderboard.
     * Used at the end of each round.
     */
    VIEW_LEADERBOARD,
    
    /**
     * Initiates tiebreaker mode for tied teams.
     * Only available when ties exist in Top 5.
     */
    START_TIEBREAKER,
    
    /**
     * Closes session and disconnects all clients gracefully.
     * Final action to end the quiz.
     */
    END_QUIZ,
    
    /**
     * Emergency pause - stops timer and freezes state.
     * Use for technical issues or interruptions.
     */
    PAUSE,
    
    /**
     * Resume from pause state.
     * Continues timer from where it stopped.
     */
    RESUME
}
