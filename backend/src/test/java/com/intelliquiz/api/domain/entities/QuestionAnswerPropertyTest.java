package com.intelliquiz.api.domain.entities;

import com.intelliquiz.api.domain.enums.Difficulty;
import com.intelliquiz.api.domain.enums.QuestionType;
import com.intelliquiz.api.domain.enums.QuizStatus;
import net.jqwik.api.*;
import net.jqwik.api.constraints.NotBlank;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Property-based tests for Question answer validation.
 * 
 * Feature: application-layer, Property 5: Question Answer Validation
 * Validates: Requirements 5.5, 5.6, 12.2
 */
public class QuestionAnswerPropertyTest {

    /**
     * Property 5: isCorrectAnswer returns true for exact match (case-insensitive)
     */
    @Property(tries = 20)
    void isCorrectAnswerReturnsTrueForExactMatch(@ForAll("asciiStrings") String correctKey) {
        Question question = createIdentificationQuestion(correctKey);
        
        assertThat(question.isCorrectAnswer(correctKey)).isTrue();
        assertThat(question.isCorrectAnswer(correctKey.toLowerCase())).isTrue();
        assertThat(question.isCorrectAnswer(correctKey.toUpperCase())).isTrue();
    }

    /**
     * Property 5: isCorrectAnswer returns false for wrong answer
     */
    @Property(tries = 20)
    void isCorrectAnswerReturnsFalseForWrongAnswer(
            @ForAll("asciiStrings") String correctKey,
            @ForAll("asciiStrings") String wrongAnswer) {
        Assume.that(!correctKey.equalsIgnoreCase(wrongAnswer.trim()));
        
        Question question = createIdentificationQuestion(correctKey);
        
        assertThat(question.isCorrectAnswer(wrongAnswer)).isFalse();
    }

    /**
     * Property 5: isCorrectAnswer returns false for null answer
     */
    @Property(tries = 5)
    void isCorrectAnswerReturnsFalseForNullAnswer() {
        Question question = createIdentificationQuestion("answer");
        
        assertThat(question.isCorrectAnswer(null)).isFalse();
    }

    /**
     * Property 5: isCorrectAnswer trims whitespace
     */
    @Property(tries = 20)
    void isCorrectAnswerTrimsWhitespace(@ForAll("asciiStrings") String correctKey) {
        Question question = createIdentificationQuestion(correctKey);
        
        assertThat(question.isCorrectAnswer("  " + correctKey + "  ")).isTrue();
        assertThat(question.isCorrectAnswer("\t" + correctKey + "\n")).isTrue();
    }

    /**
     * Property 5: validateOptions throws for MC questions without options
     */
    @Property(tries = 5)
    void validateOptionsThrowsForMCWithoutOptions() {
        Question question = createMultipleChoiceQuestion("A", List.of());
        
        assertThatThrownBy(question::validateOptions)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must have options");
    }

    /**
     * Property 5: validateOptions throws for invalid correctKey in MC
     */
    @Property(tries = 5)
    void validateOptionsThrowsForInvalidCorrectKey() {
        Question question = createMultipleChoiceQuestion("E", 
                List.of("Option A", "Option B", "Option C", "Option D"));
        
        assertThatThrownBy(question::validateOptions)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("valid option");
    }

    /**
     * Property 5: validateOptions passes for valid MC question
     */
    @Property(tries = 20)
    void validateOptionsPassesForValidMCQuestion(@ForAll("validOptionKeys") String correctKey) {
        Question question = createMultipleChoiceQuestion(correctKey, 
                List.of("Option A", "Option B", "Option C", "Option D"));
        
        // Should not throw
        question.validateOptions();
    }

    /**
     * Property 5: validatePoints throws for negative points
     */
    @Property(tries = 20)
    void validatePointsThrowsForNegativePoints(@ForAll("negativeIntegers") int points) {
        Question question = createIdentificationQuestion("answer");
        question.setPoints(points);
        
        assertThatThrownBy(question::validatePoints)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be negative");
    }

    /**
     * Property 5: validatePoints passes for non-negative points
     */
    @Property(tries = 20)
    void validatePointsPassesForNonNegativePoints(@ForAll("nonNegativeIntegers") int points) {
        Question question = createIdentificationQuestion("answer");
        question.setPoints(points);
        
        // Should not throw
        question.validatePoints();
    }

    @Provide
    Arbitrary<String> asciiStrings() {
        return Arbitraries.strings()
                .withCharRange('a', 'z')
                .ofMinLength(1)
                .ofMaxLength(20);
    }

    @Provide
    Arbitrary<String> validOptionKeys() {
        return Arbitraries.of("A", "B", "C", "D", "a", "b", "c", "d");
    }

    @Provide
    Arbitrary<Integer> negativeIntegers() {
        return Arbitraries.integers().between(-1000, -1);
    }

    @Provide
    Arbitrary<Integer> nonNegativeIntegers() {
        return Arbitraries.integers().between(0, 1000);
    }

    private Question createIdentificationQuestion(String correctKey) {
        Quiz quiz = new Quiz("Test Quiz", "Description", "123-456", QuizStatus.DRAFT);
        return new Question(quiz, "What is the answer?", 
                QuestionType.IDENTIFICATION, Difficulty.EASY, correctKey);
    }

    private Question createMultipleChoiceQuestion(String correctKey, List<String> options) {
        Quiz quiz = new Quiz("Test Quiz", "Description", "123-456", QuizStatus.DRAFT);
        Question question = new Question(quiz, "What is the answer?", 
                QuestionType.MULTIPLE_CHOICE, Difficulty.EASY, correctKey);
        question.setOptions(options);
        return question;
    }
}
