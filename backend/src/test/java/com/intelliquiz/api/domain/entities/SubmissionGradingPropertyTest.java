package com.intelliquiz.api.domain.entities;

import com.intelliquiz.api.domain.enums.Difficulty;
import com.intelliquiz.api.domain.enums.QuestionType;
import com.intelliquiz.api.domain.enums.QuizStatus;
import net.jqwik.api.*;
import net.jqwik.api.constraints.NotBlank;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Property-based tests for Submission grading.
 * 
 * Feature: application-layer, Property 6: Submission Grading Correctness
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6
 */
public class SubmissionGradingPropertyTest {

    /**
     * Property 6: grade() sets isCorrect based on Question.isCorrectAnswer()
     */
    @Property(tries = 20)
    void gradeEvaluatesCorrectnessCorrectly(
            @ForAll @NotBlank String correctKey,
            @ForAll @NotBlank String submittedAnswer) {
        var context = createSubmissionContext(correctKey, 10);
        Submission submission = new Submission(context.team, context.question, submittedAnswer);
        
        submission.grade();
        
        boolean expectedCorrect = correctKey.equalsIgnoreCase(submittedAnswer.trim());
        assertThat(submission.isCorrect()).isEqualTo(expectedCorrect);
    }

    /**
     * Property 6: If correct, awardedPoints equals question.points
     */
    @Property(tries = 20)
    void correctAnswerAwardsQuestionPoints(
            @ForAll @NotBlank String correctKey,
            @ForAll("positivePoints") int points) {
        var context = createSubmissionContext(correctKey, points);
        Submission submission = new Submission(context.team, context.question, correctKey);
        
        submission.grade();
        
        assertThat(submission.isCorrect()).isTrue();
        assertThat(submission.getAwardedPoints()).isEqualTo(points);
    }

    /**
     * Property 6: If incorrect, awardedPoints equals 0
     */
    @Property(tries = 20)
    void incorrectAnswerAwardsZeroPoints(
            @ForAll @NotBlank String correctKey,
            @ForAll @NotBlank String wrongAnswer,
            @ForAll("positivePoints") int points) {
        Assume.that(!correctKey.equalsIgnoreCase(wrongAnswer.trim()));
        
        var context = createSubmissionContext(correctKey, points);
        Submission submission = new Submission(context.team, context.question, wrongAnswer);
        
        submission.grade();
        
        assertThat(submission.isCorrect()).isFalse();
        assertThat(submission.getAwardedPoints()).isEqualTo(0);
    }

    /**
     * Property 6: Team.totalScore increases by awardedPoints after grading
     */
    @Property(tries = 20)
    void gradingUpdatesTeamScore(
            @ForAll @NotBlank String correctKey,
            @ForAll("positivePoints") int points,
            @ForAll("nonNegativeScores") int initialTeamScore) {
        var context = createSubmissionContext(correctKey, points);
        context.team.setTotalScore(initialTeamScore);
        
        Submission submission = new Submission(context.team, context.question, correctKey);
        submission.grade();
        
        int expectedScore = initialTeamScore + points;
        assertThat(context.team.getTotalScore()).isEqualTo(expectedScore);
    }

    /**
     * Property 6: Incorrect answer does not change team score
     */
    @Property(tries = 20)
    void incorrectAnswerDoesNotChangeTeamScore(
            @ForAll @NotBlank String correctKey,
            @ForAll @NotBlank String wrongAnswer,
            @ForAll("nonNegativeScores") int initialTeamScore) {
        Assume.that(!correctKey.equalsIgnoreCase(wrongAnswer.trim()));
        
        var context = createSubmissionContext(correctKey, 10);
        context.team.setTotalScore(initialTeamScore);
        
        Submission submission = new Submission(context.team, context.question, wrongAnswer);
        submission.grade();
        
        assertThat(context.team.getTotalScore()).isEqualTo(initialTeamScore);
    }

    /**
     * Property 6: Submission has timestamp when created
     */
    @Property(tries = 20)
    void submissionHasTimestamp(@ForAll @NotBlank String answer) {
        var context = createSubmissionContext("answer", 10);
        LocalDateTime before = LocalDateTime.now();
        
        Submission submission = new Submission(context.team, context.question, answer);
        
        LocalDateTime after = LocalDateTime.now();
        assertThat(submission.getSubmittedAt())
                .isAfterOrEqualTo(before)
                .isBeforeOrEqualTo(after);
    }

    /**
     * Property 6: validateSubmittedAt throws for future timestamp
     */
    @Property(tries = 5)
    void validateSubmittedAtThrowsForFutureTimestamp() {
        var context = createSubmissionContext("answer", 10);
        Submission submission = new Submission(context.team, context.question, "answer");
        submission.setSubmittedAt(LocalDateTime.now().plusDays(1));
        
        assertThatThrownBy(submission::validateSubmittedAt)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be in the future");
    }

    /**
     * Property 6: validateSubmittedAt passes for past/present timestamp
     */
    @Property(tries = 20)
    void validateSubmittedAtPassesForPastTimestamp() {
        var context = createSubmissionContext("answer", 10);
        Submission submission = new Submission(context.team, context.question, "answer");
        submission.setSubmittedAt(LocalDateTime.now().minusMinutes(5));
        
        // Should not throw
        submission.validateSubmittedAt();
    }

    @Provide
    Arbitrary<Integer> positivePoints() {
        return Arbitraries.integers().between(1, 100);
    }

    @Provide
    Arbitrary<Integer> nonNegativeScores() {
        return Arbitraries.integers().between(0, 1000);
    }

    private SubmissionContext createSubmissionContext(String correctKey, int points) {
        Quiz quiz = new Quiz("Test Quiz", "Description", "123-456", QuizStatus.READY);
        Team team = new Team(quiz, "Test Team", "ABC-123");
        Question question = new Question(quiz, "What is the answer?", 
                QuestionType.IDENTIFICATION, Difficulty.EASY, correctKey);
        question.setPoints(points);
        
        return new SubmissionContext(quiz, team, question);
    }

    private record SubmissionContext(Quiz quiz, Team team, Question question) {}
}
