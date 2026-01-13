package com.intelliquiz.api.infrastructure.websocket.dto;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.enums.QuestionType;

import java.util.List;

/**
 * Question payload broadcast to clients.
 * NOTE: correctKey is NEVER included (JIT security).
 */
public record QuestionPayload(
        Long questionId,
        String text,
        QuestionType type,
        List<String> options,
        int timeLimit,
        int points,
        int orderIndex,
        String round
) {
    /**
     * Creates a QuestionPayload from a Question entity.
     * Intentionally excludes correctKey for JIT security.
     */
    public static QuestionPayload from(Question question) {
        return new QuestionPayload(
                question.getId(),
                question.getText(),
                question.getType(),
                question.getType() == QuestionType.MULTIPLE_CHOICE ? question.getOptions() : List.of(),
                question.getTimeLimit(),
                question.getPoints(),
                question.getOrderIndex(),
                question.getDifficulty() != null ? question.getDifficulty().name() : null
        );
    }
}
