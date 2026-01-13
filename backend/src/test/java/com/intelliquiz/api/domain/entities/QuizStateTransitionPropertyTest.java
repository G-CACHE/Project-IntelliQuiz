package com.intelliquiz.api.domain.entities;

import com.intelliquiz.api.domain.enums.Difficulty;
import com.intelliquiz.api.domain.enums.QuestionType;
import com.intelliquiz.api.domain.enums.QuizStatus;
import com.intelliquiz.api.domain.exceptions.InvalidQuizStateException;
import com.intelliquiz.api.domain.exceptions.QuizNotReadyException;
import net.jqwik.api.*;
import net.jqwik.api.constraints.NotBlank;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Property-based tests for Quiz state transitions.
 * 
 * Feature: application-layer, Property 3: Quiz State Transition Validity
 * Validates: Requirements 3.4, 3.5, 3.6, 4.2, 4.5, 4.6
 */
public class QuizStateTransitionPropertyTest {

    /**
     * Property 3: activate() succeeds only when status is READY
     */
    @Property(tries = 20)
    void activateSucceedsOnlyWhenReady(@ForAll("quizStatuses") QuizStatus status) {
        Quiz quiz = createQuiz("Test Quiz", status);
        
        if (status == QuizStatus.READY) {
            quiz.activate();
            assertThat(quiz.isLiveSession()).isTrue();
        } else {
            assertThatThrownBy(quiz::activate)
                    .isInstanceOf(QuizNotReadyException.class);
        }
    }

    /**
     * Property 3: deactivate() sets isLiveSession to false
     */
    @Property(tries = 20)
    void deactivateSetsLiveSessionFalse(@ForAll boolean initialLiveState) {
        Quiz quiz = createQuiz("Test Quiz", QuizStatus.READY);
        quiz.setLiveSession(initialLiveState);
        
        quiz.deactivate();
        
        assertThat(quiz.isLiveSession()).isFalse();
    }

    /**
     * Property 3: transitionToReady() succeeds only when questions exist
     */
    @Property(tries = 20)
    void transitionToReadyRequiresQuestions(@ForAll @NotBlank String questionText) {
        Quiz quizWithoutQuestions = createQuiz("Test Quiz", QuizStatus.DRAFT);
        
        assertThatThrownBy(quizWithoutQuestions::transitionToReady)
                .isInstanceOf(InvalidQuizStateException.class)
                .hasMessageContaining("at least one question");
        
        Quiz quizWithQuestions = createQuiz("Test Quiz", QuizStatus.DRAFT);
        Question question = new Question(quizWithQuestions, questionText, 
                QuestionType.IDENTIFICATION, Difficulty.EASY, "answer");
        quizWithQuestions.addQuestion(question);
        
        quizWithQuestions.transitionToReady();
        
        assertThat(quizWithQuestions.getStatus()).isEqualTo(QuizStatus.READY);
    }

    /**
     * Property 3: archive() sets status to ARCHIVED and isLiveSession to false
     */
    @Property(tries = 20)
    void archiveSetsCorrectState(
            @ForAll("quizStatuses") QuizStatus initialStatus,
            @ForAll boolean initialLiveState) {
        Quiz quiz = createQuiz("Test Quiz", initialStatus);
        quiz.setLiveSession(initialLiveState);
        
        quiz.archive();
        
        assertThat(quiz.getStatus()).isEqualTo(QuizStatus.ARCHIVED);
        assertThat(quiz.isLiveSession()).isFalse();
    }

    /**
     * Property 3: New quizzes start with DRAFT status (via constructor)
     */
    @Property(tries = 20)
    void newQuizzesStartWithDraftStatus(@ForAll @NotBlank String title) {
        Quiz quiz = new Quiz(title, "Description", "123-456", QuizStatus.DRAFT);
        
        assertThat(quiz.getStatus()).isEqualTo(QuizStatus.DRAFT);
        assertThat(quiz.isLiveSession()).isFalse();
    }

    /**
     * Property 3: validateTitle throws for blank title
     */
    @Property(tries = 5)
    void validateTitleThrowsForBlankTitle() {
        Quiz quiz = new Quiz("", "Description", "123-456", QuizStatus.DRAFT);
        
        assertThatThrownBy(quiz::validateTitle)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("title cannot be blank");
    }

    /**
     * Property 3: validateTitle passes for non-blank title
     */
    @Property(tries = 20)
    void validateTitlePassesForNonBlankTitle(@ForAll @NotBlank String title) {
        Quiz quiz = new Quiz(title, "Description", "123-456", QuizStatus.DRAFT);
        
        // Should not throw
        quiz.validateTitle();
    }

    /**
     * Property 3: getLeaderboard returns teams sorted by score descending
     */
    @Property(tries = 20)
    void getLeaderboardReturnsSortedTeams(
            @ForAll("positiveScores") int score1,
            @ForAll("positiveScores") int score2,
            @ForAll("positiveScores") int score3) {
        Quiz quiz = createQuiz("Test Quiz", QuizStatus.READY);
        
        Team team1 = new Team(quiz, "Team 1", "AAA-111");
        team1.setTotalScore(score1);
        Team team2 = new Team(quiz, "Team 2", "BBB-222");
        team2.setTotalScore(score2);
        Team team3 = new Team(quiz, "Team 3", "CCC-333");
        team3.setTotalScore(score3);
        
        quiz.addTeam(team1);
        quiz.addTeam(team2);
        quiz.addTeam(team3);
        
        var leaderboard = quiz.getLeaderboard();
        
        assertThat(leaderboard).hasSize(3);
        // Verify descending order
        for (int i = 0; i < leaderboard.size() - 1; i++) {
            assertThat(leaderboard.get(i).getTotalScore())
                    .isGreaterThanOrEqualTo(leaderboard.get(i + 1).getTotalScore());
        }
    }

    @Provide
    Arbitrary<QuizStatus> quizStatuses() {
        return Arbitraries.of(QuizStatus.values());
    }

    @Provide
    Arbitrary<Integer> positiveScores() {
        return Arbitraries.integers().between(0, 1000);
    }

    private Quiz createQuiz(String title, QuizStatus status) {
        return new Quiz(title, "Description", "123-456", status);
    }
}
