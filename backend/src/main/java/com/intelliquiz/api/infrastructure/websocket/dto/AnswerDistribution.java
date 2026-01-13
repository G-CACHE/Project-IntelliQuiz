package com.intelliquiz.api.infrastructure.websocket.dto;

import java.util.Map;

/**
 * Answer distribution for MCQ questions.
 * Shows how many teams chose each option.
 */
public record AnswerDistribution(
        Map<String, Integer> optionCounts,
        int correctCount,
        int incorrectCount
) {
    public static AnswerDistribution empty() {
        return new AnswerDistribution(Map.of(), 0, 0);
    }
    
    public int totalSubmissions() {
        return correctCount + incorrectCount;
    }
}
