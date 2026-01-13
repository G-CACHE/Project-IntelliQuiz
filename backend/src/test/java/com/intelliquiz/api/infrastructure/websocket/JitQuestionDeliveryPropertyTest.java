package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.enums.QuestionType;
import com.intelliquiz.api.infrastructure.websocket.dto.QuestionPayload;
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
        Quiz quiz = new Quiz();
        quiz.setId(1L);
        quiz.setTitle("Test Quiz");
        
        Question question = new Question();
        question.setId(100L);
        question.setText("What is 2+2?");
        question.setType(QuestionType.MULTIPLE_CHOICE);
        question.setOptions(List.of("3", "4", "5", "6"));
        question.setCorrectKey("B"); // This should NOT appear in payload
        question.setTimeLimit(30);
        question.setPoints(10);
        question.setOrderIndex(1);
        question.setQuiz(quiz);
        
        QuestionPayload payload = QuestionPayload.from(question);
        
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
        Quiz quiz = new Quiz();
        quiz.setId(1L);
        
        Question question = new Question();
        question.setId(200L);
        question.setText("What is the capital of France?");
        question.setType(QuestionType.IDENTIFICATION);
        question.setCorrectKey("Paris"); // This should NOT appear in payload
        question.setTimeLimit(45);
        question.setPoints(15);
        question.setOrderIndex(2);
        question.setQuiz(quiz);
        
        QuestionPayload payload = QuestionPayload.from(question);
        
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
        Quiz quiz = new Quiz();
        quiz.setId(1L);
        
        Question question = new Question();
        question.setId(1L);
        question.setText(text);
        question.setType(QuestionType.MULTIPLE_CHOICE);
        question.setOptions(List.of("A", "B", "C", "D"));
        question.setCorrectKey("A");
        question.setTimeLimit(timeLimit);
        question.setPoints(points);
        question.setOrderIndex(1);
        question.setQuiz(quiz);
        
        QuestionPayload payload = QuestionPayload.from(question);
        
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
