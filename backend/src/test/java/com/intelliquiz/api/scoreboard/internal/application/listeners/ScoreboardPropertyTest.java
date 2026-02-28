package com.intelliquiz.api.scoreboard.internal.application.listeners;

import com.intelliquiz.api.scoreboard.internal.domain.entities.ScoreboardEntry;
import com.intelliquiz.api.scoreboard.internal.domain.ports.ScoreboardReadRepository;
import com.intelliquiz.api.submission.events.SubmissionGradedEvent;
import com.intelliquiz.api.team.events.TeamRegisteredEvent;
import com.intelliquiz.api.team.events.TeamRemovedEvent;
import com.intelliquiz.api.team.events.TeamScoreResetEvent;
import net.jqwik.api.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for ScoreboardProjection (CQRS read model).
 * 
 * Feature: application-layer, Property 9: Scoreboard Ranking Correctness
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 */
public class ScoreboardPropertyTest {

    /**
     * Property 9: Scoreboard entries are sorted by score descending after projection
     */
    @Property(tries = 20)
    void scoreboardIsSortedByScoreDescending(@ForAll("teamScores") List<Integer> scores) {
        InMemoryRepo repo = new InMemoryRepo();
        ScoreboardProjection projection = new ScoreboardProjection(repo);

        registerTeamsAndScore(projection, scores);

        List<ScoreboardEntry> entries = repo.findByQuizId(1L);
        entries.sort(Comparator.comparingInt(ScoreboardEntry::getRank));

        for (int i = 0; i < entries.size() - 1; i++) {
            assertThat(entries.get(i).getScore())
                    .as("Score at position %d should be >= score at position %d", i, i + 1)
                    .isGreaterThanOrEqualTo(entries.get(i + 1).getScore());
        }
    }

    /**
     * Property 9: Teams with equal scores have the same rank
     */
    @Property(tries = 20)
    void teamsWithEqualScoresHaveSameRank(@ForAll("tiedScores") int score,
                                          @ForAll("teamCounts") int teamCount) {
        InMemoryRepo repo = new InMemoryRepo();
        ScoreboardProjection projection = new ScoreboardProjection(repo);

        List<Integer> scores = new ArrayList<>();
        for (int i = 0; i < teamCount; i++) {
            scores.add(score);
        }
        registerTeamsAndScore(projection, scores);

        List<ScoreboardEntry> entries = repo.findByQuizId(1L);
        for (ScoreboardEntry entry : entries) {
            assertThat(entry.getRank())
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
        InMemoryRepo repo = new InMemoryRepo();
        ScoreboardProjection projection = new ScoreboardProjection(repo);

        registerTeamsAndScore(projection, List.of(100, 100, 50));

        List<ScoreboardEntry> entries = repo.findByQuizId(1L);
        entries.sort(Comparator.comparingInt(ScoreboardEntry::getRank));

        assertThat(entries).hasSize(3);
        assertThat(entries.get(0).getRank()).isEqualTo(1);
        assertThat(entries.get(1).getRank()).isEqualTo(1);
        assertThat(entries.get(2).getRank()).isEqualTo(3); // Skips rank 2
    }

    /**
     * Property 9: Scoreboard contains all teams
     */
    @Property(tries = 20)
    void scoreboardContainsAllTeams(@ForAll("teamScores") List<Integer> scores) {
        InMemoryRepo repo = new InMemoryRepo();
        ScoreboardProjection projection = new ScoreboardProjection(repo);

        registerTeamsAndScore(projection, scores);

        List<ScoreboardEntry> entries = repo.findByQuizId(1L);
        assertThat(entries).hasSize(scores.size());
    }

    /**
     * Property 9: Scoreboard entries have correct scores
     */
    @Property(tries = 20)
    void scoreboardEntriesHaveCorrectScores(@ForAll("teamScores") List<Integer> scores) {
        InMemoryRepo repo = new InMemoryRepo();
        ScoreboardProjection projection = new ScoreboardProjection(repo);

        registerTeamsAndScore(projection, scores);

        List<ScoreboardEntry> entries = repo.findByQuizId(1L);

        List<Integer> entryScores = entries.stream()
                .map(ScoreboardEntry::getScore)
                .sorted()
                .toList();
        List<Integer> originalScores = scores.stream().sorted().toList();

        assertThat(entryScores).isEqualTo(originalScores);
    }

    /**
     * Property 9: Ranks are always positive
     */
    @Property(tries = 20)
    void ranksAreAlwaysPositive(@ForAll("teamScores") List<Integer> scores) {
        InMemoryRepo repo = new InMemoryRepo();
        ScoreboardProjection projection = new ScoreboardProjection(repo);

        registerTeamsAndScore(projection, scores);

        List<ScoreboardEntry> entries = repo.findByQuizId(1L);
        for (ScoreboardEntry entry : entries) {
            assertThat(entry.getRank())
                    .as("Rank should be positive")
                    .isGreaterThan(0);
        }
    }

    // --- Providers ---

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

    // --- Helpers ---

    private void registerTeamsAndScore(ScoreboardProjection projection, List<Integer> scores) {
        for (int i = 0; i < scores.size(); i++) {
            long teamId = i + 1;
            projection.on(new TeamRegisteredEvent(teamId, "Team " + i, 1L));
        }
        for (int i = 0; i < scores.size(); i++) {
            if (scores.get(i) > 0) {
                long teamId = i + 1;
                projection.on(new SubmissionGradedEvent(0L, teamId, 1L, true, scores.get(i)));
            }
        }
    }

    /**
     * In-memory implementation of ScoreboardReadRepository for testing.
     */
    static class InMemoryRepo implements ScoreboardReadRepository {
        private final List<ScoreboardEntry> entries = new ArrayList<>();
        private long nextId = 1;

        @Override
        public List<ScoreboardEntry> findByQuizIdOrderByRankAsc(Long quizId) {
            return entries.stream()
                    .filter(e -> e.getQuizId().equals(quizId))
                    .sorted(Comparator.comparingInt(ScoreboardEntry::getRank))
                    .toList();
        }

        @Override
        public List<ScoreboardEntry> findByQuizId(Long quizId) {
            return new ArrayList<>(entries.stream()
                    .filter(e -> e.getQuizId().equals(quizId))
                    .toList());
        }

        @Override
        public Optional<ScoreboardEntry> findByTeamId(Long teamId) {
            return entries.stream()
                    .filter(e -> e.getTeamId().equals(teamId))
                    .findFirst();
        }

        @Override
        public ScoreboardEntry save(ScoreboardEntry entry) {
            if (entry.getId() == null) entry.setId(nextId++);
            entries.removeIf(e -> e.getTeamId().equals(entry.getTeamId()));
            entries.add(entry);
            return entry;
        }

        @Override
        public void delete(ScoreboardEntry entry) {
            entries.removeIf(e -> e.getTeamId().equals(entry.getTeamId()));
        }

        @Override
        public void deleteByTeamId(Long teamId) {
            entries.removeIf(e -> e.getTeamId().equals(teamId));
        }

        @Override
        public void deleteByQuizId(Long quizId) {
            entries.removeIf(e -> e.getQuizId().equals(quizId));
        }

        @Override
        public void saveAll(List<ScoreboardEntry> entriesToSave) {
            for (ScoreboardEntry entry : entriesToSave) {
                save(entry);
            }
        }
    }
}
