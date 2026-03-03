package com.intelliquiz.api.realtime.internal.presentation.dto;

import com.intelliquiz.api.quiz.dto.QuestionInfoDto;
import com.intelliquiz.api.shared.enums.QuestionType;

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
     * Creates a QuestionPayload from a QuestionInfoDto (facade DTO).
     * Intentionally excludes correctKey for JIT security.
     */
    public static QuestionPayload fromDto(QuestionInfoDto dto) {
        return new QuestionPayload(
                dto.id(),
                dto.text(),
                dto.type(),
                dto.type() == QuestionType.MULTIPLE_CHOICE ? dto.options() : List.of(),
                dto.timeLimit(),
                dto.points(),
                dto.orderIndex(),
                dto.difficulty()
        );
    }
}
