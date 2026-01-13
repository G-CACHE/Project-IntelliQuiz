package com.intelliquiz.api.domain.entities;

import com.intelliquiz.api.domain.enums.QuizStatus;
import net.jqwik.api.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Property-based tests for Team score invariants.
 * 
 * Feature: application-layer, Property 7: Team Score Invariants
 * Validates: Requirements 6.2, 6.3, 6.4, 12.3
 */
public class TeamScorePropertyTest {

    /**
     * Property 7: New teams initialize with totalScore = 0
     */
    @Property(tries = 20)
    void newTeamsInitializeWithZeroScore(@ForAll("teamNames") String teamName) {
        Quiz quiz = createQuiz();
        Team team = new Team(quiz, teamName, "ABC-123");
        
        assertThat(team.getTotalScore()).isEqualTo(0);
    }

    /**
     * Property 7: addPoints(n) increases totalScore by exactly n
     */
    @Property(tries = 20)
    void addPointsIncreasesScoreByExactAmount(
            @ForAll("nonNegativeScores") int initialScore,
            @ForAll("nonNegativeScores") int pointsToAdd) {
        Team team = createTeamWithScore(initialScore);
        int expectedScore = initialScore + pointsToAdd;
        
        team.addPoints(pointsToAdd);
        
        assertThat(team.getTotalScore()).isEqualTo(expectedScore);
    }

    /**
     * Property 7: resetScore() sets totalScore to exactly 0
     */
    @Property(tries = 20)
    void resetScoreSetsScoreToZero(@ForAll("nonNegativeScores") int initialScore) {
        Team team = createTeamWithScore(initialScore);
        
        team.resetScore();
        
        assertThat(team.getTotalScore()).isEqualTo(0);
    }

    /**
     * Property 7: Multiple addPoints calls accumulate correctly
     */
    @Property(tries = 20)
    void multipleAddPointsAccumulateCorrectly(
            @ForAll("smallPositiveScores") int points1,
            @ForAll("smallPositiveScores") int points2,
            @ForAll("smallPositiveScores") int points3) {
        Team team = createTeamWithScore(0);
        int expectedTotal = points1 + points2 + points3;
        
        team.addPoints(points1);
        team.addPoints(points2);
        team.addPoints(points3);
        
        assertThat(team.getTotalScore()).isEqualTo(expectedTotal);
    }

    /**
     * Property 7: validateScore throws for negative score
     */
    @Property(tries = 20)
    void validateScoreThrowsForNegativeScore(@ForAll("negativeScores") int negativeScore) {
        Team team = createTeamWithScore(0);
        team.setTotalScore(negativeScore);
        
        assertThatThrownBy(team::validateScore)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be negative");
    }

    /**
     * Property 7: validateScore passes for non-negative score
     */
    @Property(tries = 20)
    void validateScorePassesForNonNegativeScore(@ForAll("nonNegativeScores") int score) {
        Team team = createTeamWithScore(score);
        
        // Should not throw
        team.validateScore();
    }

    /**
     * Property 7: resetScore followed by addPoints gives correct score
     */
    @Property(tries = 20)
    void resetThenAddGivesCorrectScore(
            @ForAll("nonNegativeScores") int initialScore,
            @ForAll("nonNegativeScores") int newPoints) {
        Team team = createTeamWithScore(initialScore);
        
        team.resetScore();
        team.addPoints(newPoints);
        
        assertThat(team.getTotalScore()).isEqualTo(newPoints);
    }

    @Provide
    Arbitrary<String> teamNames() {
        return Arbitraries.strings()
                .withCharRange('A', 'Z')
                .ofMinLength(1)
                .ofMaxLength(20)
                .map(s -> "Team " + s);
    }

    @Provide
    Arbitrary<Integer> nonNegativeScores() {
        return Arbitraries.integers().between(0, 1000);
    }

    @Provide
    Arbitrary<Integer> smallPositiveScores() {
        return Arbitraries.integers().between(1, 100);
    }

    @Provide
    Arbitrary<Integer> negativeScores() {
        return Arbitraries.integers().between(-1000, -1);
    }

    private Quiz createQuiz() {
        return new Quiz("Test Quiz", "Description", "123-456", QuizStatus.DRAFT);
    }

    private Team createTeamWithScore(int score) {
        Quiz quiz = createQuiz();
        Team team = new Team(quiz, "Test Team", "ABC-123");
        team.setTotalScore(score);
        return team;
    }
}
