package com.intelliquiz.api.infrastructure.websocket.dto;

import com.intelliquiz.api.domain.enums.QuestionType;

import java.util.List;

/**
 * Answer reveal payload broadcast after timer expires.
 * Includes correct answer, distribution, and team results.
 */
public record AnswerRevealPayload(
        Long questionId,
        String correctAnswer,
        QuestionType type,
        AnswerDistribution distribution,
        List<TeamResult> teamResults
) {
    public static AnswerRevealPayload create(
            Long questionId,
            String correctAnswer,
            QuestionType type,
            AnswerDistribution distribution,
            List<TeamResult> teamResults
    ) {
        return new AnswerRevealPayload(questionId, correctAnswer, type, distribution, teamResults);
    }
}
