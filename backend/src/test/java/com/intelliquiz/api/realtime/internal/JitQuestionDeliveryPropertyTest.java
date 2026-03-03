package com.intelliquiz.api.realtime.internal;

import com.intelliquiz.api.quiz.dto.QuestionInfoDto;
import com.intelliquiz.api.shared.enums.QuestionType;
import com.intelliquiz.api.realtime.internal.presentation.dto.QuestionPayload;
import net.jqwik.api.*;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for JIT (Just-in-Time) question delivery.
 * Feature: websocket-realtime
 */
class JitQuestionDeliveryPropertyTest {

    /**
     * Feature: websocket-realtime, Property 10: JIT Question Delivery
     * For any question broadcast, the QuestionPayload SHALL NOT include the correctKey field,
     * ensuring answer data is never sent to clients before reveal.
     * 
     * **Validates: Requirements 2.2 (JIT security)**
     */
    @Example
    void questionPayloadRecordDoesNotHaveCorrectKeyField() {
        // Verify the QuestionPayload record does NOT have a correctKey accessor method
        Method[] methods = QuestionPayload.class.getMethods();
        boolean hasCorrectKeyMethod = Arrays.stream(methods)
                .anyMatch(m -> m.getName().equals("correctKey"));
        
        assertThat(hasCorrectKeyMethod)
                .as("QuestionPayload should NOT have a correctKey() method (JIT security)")
                .isFalse();
    }

    /**
     * Property: QuestionPayload from MCQ question preserves non-sensitive fields.
     */
    @Example
    void mcqQuestionPayloadPreservesNonSensitiveFields() {
        QuestionInfoDto dto = new QuestionInfoDto(
                100L, "What is 2+2?", QuestionType.MULTIPLE_CHOICE,
                List.of("3", "4", "5", "6"), "B", 10, 30, 1, "EASY"
        );
        
        QuestionPayload payload = QuestionPayload.fromDto(dto);
        
        // Verify all non-sensitive fields are present
        assertThat(payload.questionId()).isEqualTo(100L);
        assertThat(payload.text()).isEqualTo("What is 2+2?");
        assertThat(payload.type()).isEqualTo(QuestionType.MULTIPLE_CHOICE);
        assertThat(payload.options()).containsExactly("3", "4", "5", "6");
        assertThat(payload.timeLimit()).isEqualTo(30);
        assertThat(payload.points()).isEqualTo(10);
        assertThat(payload.orderIndex()).isEqualTo(1);
    }

    /**
     * Property: Identification questions have empty options list.
     */
    @Example
    void identificationQuestionPayloadHasEmptyOptions() {
        QuestionInfoDto dto = new QuestionInfoDto(
                200L, "What is the capital of France?", QuestionType.IDENTIFICATION,
                List.of(), "Paris", 15, 45, 2, "MEDIUM"
        );
        
        QuestionPayload payload = QuestionPayload.fromDto(dto);
        
        assertThat(payload.questionId()).isEqualTo(200L);
        assertThat(payload.text()).isEqualTo("What is the capital of France?");
        assertThat(payload.type()).isEqualTo(QuestionType.IDENTIFICATION);
        assertThat(payload.options())
                .as("Identification questions should have empty options list")
                .isEmpty();
    }

    /**
     * Property: QuestionPayload preserves all non-sensitive fields for various inputs.
     */
    @Property(tries = 50)
    void questionPayloadPreservesNonSensitiveFields(
            @ForAll("questionTexts") String text,
            @ForAll @net.jqwik.api.constraints.IntRange(min = 10, max = 120) int timeLimit,
            @ForAll @net.jqwik.api.constraints.IntRange(min = 1, max = 100) int points
    ) {
        QuestionInfoDto dto = new QuestionInfoDto(
                1L, text, QuestionType.MULTIPLE_CHOICE,
                List.of("A", "B", "C", "D"), "A", points, timeLimit, 1, "EASY"
        );
        
        QuestionPayload payload = QuestionPayload.fromDto(dto);
        
        assertThat(payload.text()).isEqualTo(text);
        assertThat(payload.timeLimit()).isEqualTo(timeLimit);
        assertThat(payload.points()).isEqualTo(points);
    }

    @Provide
    Arbitrary<String> questionTexts() {
        return Arbitraries.strings()
                .withCharRange('a', 'z')
                .ofMinLength(5)
                .ofMaxLength(100)
                .map(s -> "Question: " + s + "?");
    }
}
