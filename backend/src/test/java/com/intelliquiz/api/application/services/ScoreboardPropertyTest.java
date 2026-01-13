package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.enums.QuizStatus;
import com.intelliquiz.api.domain.ports.QuizRepository;
import com.intelliquiz.api.domain.ports.TeamRepository;
import net.jqwik.api.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for ScoreboardService.
 * 
 * Feature: application-layer, Property 9: Scoreboard Ranking Correctness
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 */
public class ScoreboardPropertyTest {

    /**
     * Property 9: Scoreboard entries are sorted by score descending
     */
    @Property(tries = 20)
    void scoreboardIsSortedByScoreDescending(@ForAll("teamScores") List<Integer> scores) {
        QuizRepository quizRepository = mock(QuizRepository.class);
        TeamRepository teamRepository = mock(TeamRepository.class);
        
        Quiz quiz = createQuizWithTeams(scores);
        
        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(teamRepository.findByQuiz(quiz)).thenReturn(quiz.getTeams());
        
        ScoreboardService service = new ScoreboardService(quizRepository, teamRepository);
        List<ScoreboardService.ScoreboardEntry> scoreboard = service.getScoreboard(1L);
        
        // Verify descending order
        for (int i = 0; i < scoreboard.size() - 1; i++) {
            assertThat(scoreboard.get(i).score())
                    .as("Score at position %d should be >= score at position %d", i, i + 1)
                    .isGreaterThanOrEqualTo(scoreboard.get(i + 1).score());
        }
    }

    /**
     * Property 9: Teams with equal scores have the same rank
     */
    @Property(tries = 20)
    void teamsWithEqualScoresHaveSameRank(@ForAll("tiedScores") int score, 
                                          @ForAll("teamCounts") int teamCount) {
        QuizRepository quizRepository = mock(QuizRepository.class);
        TeamRepository teamRepository = mock(TeamRepository.class);
        
        // Create teams all with the same score
        List<Integer> scores = new ArrayList<>();
        for (int i = 0; i < teamCount; i++) {
            scores.add(score);
        }
        
        Quiz quiz = createQuizWithTeams(scores);
        
        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(teamRepository.findByQuiz(quiz)).thenReturn(quiz.getTeams());
        
        ScoreboardService service = new ScoreboardService(quizRepository, teamRepository);
        List<ScoreboardService.ScoreboardEntry> scoreboard = service.getScoreboard(1L);
        
        // All teams should have rank 1 since they all have the same score
        for (ScoreboardService.ScoreboardEntry entry : scoreboard) {
            assertThat(entry.rank())
                    .as("All teams with equal scores should have rank 1")
                    .isEqualTo(1);
        }
    }

    /**
     * Property 9: Rank skips correctly after ties
     * If 2 teams tie for 1st, the next team should be rank 3
     */
    @Property(tries = 20)
    void rankSkipsCorrectlyAfterTies() {
        QuizRepository quizRepository = mock(QuizRepository.class);
        TeamRepository teamRepository = mock(TeamRepository.class);
        
        // Create teams: 2 tied for 1st (100 points), 1 in 3rd (50 points)
        List<Integer> scores = List.of(100, 100, 50);
        Quiz quiz = createQuizWithTeams(scores);
        
        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(teamRepository.findByQuiz(quiz)).thenReturn(quiz.getTeams());
        
        ScoreboardService service = new ScoreboardService(quizRepository, teamRepository);
        List<ScoreboardService.ScoreboardEntry> scoreboard = service.getScoreboard(1L);
        
        assertThat(scoreboard).hasSize(3);
        assertThat(scoreboard.get(0).rank()).isEqualTo(1);
        assertThat(scoreboard.get(1).rank()).isEqualTo(1);
        assertThat(scoreboard.get(2).rank()).isEqualTo(3); // Skips rank 2
    }

    /**
     * Property 9: Scoreboard contains all teams
     */
    @Property(tries = 20)
    void scoreboardContainsAllTeams(@ForAll("teamScores") List<Integer> scores) {
        QuizRepository quizRepository = mock(QuizRepository.class);
        TeamRepository teamRepository = mock(TeamRepository.class);
        
        Quiz quiz = createQuizWithTeams(scores);
        
        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(teamRepository.findByQuiz(quiz)).thenReturn(quiz.getTeams());
        
        ScoreboardService service = new ScoreboardService(quizRepository, teamRepository);
        List<ScoreboardService.ScoreboardEntry> scoreboard = service.getScoreboard(1L);
        
        assertThat(scoreboard).hasSize(scores.size());
    }

    /**
     * Property 9: Scoreboard entries have correct scores
     */
    @Property(tries = 20)
    void scoreboardEntriesHaveCorrectScores(@ForAll("teamScores") List<Integer> scores) {
        QuizRepository quizRepository = mock(QuizRepository.class);
        TeamRepository teamRepository = mock(TeamRepository.class);
        
        Quiz quiz = createQuizWithTeams(scores);
        
        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(teamRepository.findByQuiz(quiz)).thenReturn(quiz.getTeams());
        
        ScoreboardService service = new ScoreboardService(quizRepository, teamRepository);
        List<ScoreboardService.ScoreboardEntry> scoreboard = service.getScoreboard(1L);
        
        // Collect all scores from scoreboard
        List<Integer> scoreboardScores = scoreboard.stream()
                .map(ScoreboardService.ScoreboardEntry::score)
                .sorted()
                .toList();
        
        // Compare with original scores (sorted)
        List<Integer> originalScores = scores.stream().sorted().toList();
        
        assertThat(scoreboardScores).isEqualTo(originalScores);
    }

    /**
     * Property 9: Ranks are always positive
     */
    @Property(tries = 20)
    void ranksAreAlwaysPositive(@ForAll("teamScores") List<Integer> scores) {
        QuizRepository quizRepository = mock(QuizRepository.class);
        TeamRepository teamRepository = mock(TeamRepository.class);
        
        Quiz quiz = createQuizWithTeams(scores);
        
        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(teamRepository.findByQuiz(quiz)).thenReturn(quiz.getTeams());
        
        ScoreboardService service = new ScoreboardService(quizRepository, teamRepository);
        List<ScoreboardService.ScoreboardEntry> scoreboard = service.getScoreboard(1L);
        
        for (ScoreboardService.ScoreboardEntry entry : scoreboard) {
            assertThat(entry.rank())
                    .as("Rank should be positive")
                    .isGreaterThan(0);
        }
    }

    @Provide
    Arbitrary<List<Integer>> teamScores() {
        return Arbitraries.integers()
                .between(0, 1000)
                .list()
                .ofMinSize(1)
                .ofMaxSize(10);
    }

    @Provide
    Arbitrary<Integer> tiedScores() {
        return Arbitraries.integers().between(0, 1000);
    }

    @Provide
    Arbitrary<Integer> teamCounts() {
        return Arbitraries.integers().between(2, 5);
    }

    private Quiz createQuizWithTeams(List<Integer> scores) {
        Quiz quiz = new Quiz("Test Quiz", "Description", "123456", QuizStatus.DRAFT);
        quiz.setId(1L);

        for (int i = 0; i < scores.size(); i++) {
            Team team = new Team(quiz, "Team " + i, "CODE" + i);
            team.setId((long) (i + 1));
            team.setTotalScore(scores.get(i));
            quiz.addTeam(team);
        }
        
        return quiz;
    }
}
