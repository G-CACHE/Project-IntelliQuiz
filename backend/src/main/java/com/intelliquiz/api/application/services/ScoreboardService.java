package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.exceptions.EntityNotFoundException;
import com.intelliquiz.api.domain.ports.QuizRepository;
import com.intelliquiz.api.domain.ports.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Application service for scoreboard operations.
 * Handles leaderboard generation with ranking and tie handling.
 */
@Service
@Transactional(readOnly = true)
public class ScoreboardService {

    private final QuizRepository quizRepository;
    private final TeamRepository teamRepository;

    public ScoreboardService(QuizRepository quizRepository, TeamRepository teamRepository) {
        this.quizRepository = quizRepository;
        this.teamRepository = teamRepository;
    }

    /**
     * Gets the scoreboard for a quiz with rankings.
     * Teams are sorted by total score descending.
     * Ties are handled by assigning the same rank.
     */
    public List<ScoreboardEntry> getScoreboard(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

        List<Team> teams = teamRepository.findByQuiz(quiz);
        
        // Sort teams by score descending
        List<Team> sortedTeams = teams.stream()
                .sorted(Comparator.comparingInt(Team::getTotalScore).reversed())
                .toList();

        return assignRanks(sortedTeams);
    }

    /**
     * Gets the scoreboard using the Quiz entity's getLeaderboard() method.
     */
    public List<ScoreboardEntry> getLeaderboard(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz", quizId));

        List<Team> sortedTeams = quiz.getLeaderboard();
        return assignRanks(sortedTeams);
    }

    /**
     * Assigns ranks to teams, handling ties by giving the same rank.
     * Example: If two teams tie for 1st, both get rank 1, next team gets rank 3.
     */
    private List<ScoreboardEntry> assignRanks(List<Team> sortedTeams) {
        List<ScoreboardEntry> entries = new ArrayList<>();
        
        int currentRank = 1;
        int previousScore = Integer.MAX_VALUE;
        int teamsAtPreviousRank = 0;

        for (int i = 0; i < sortedTeams.size(); i++) {
            Team team = sortedTeams.get(i);
            int score = team.getTotalScore();

            if (score < previousScore) {
                currentRank = i + 1;
                previousScore = score;
                teamsAtPreviousRank = 1;
            } else {
                teamsAtPreviousRank++;
            }

            // Check if this team is tied with others
            boolean isTied = sortedTeams.stream()
                    .filter(t -> t.getTotalScore() == score)
                    .count() > 1;

            entries.add(new ScoreboardEntry(
                    currentRank,
                    team.getId(),
                    team.getName(),
                    score,
                    isTied
            ));
        }

        return entries;
    }

    /**
     * Gets teams that are tied in the top N positions.
     * Used for tiebreaker detection.
     */
    public List<ScoreboardEntry> getTiedTeamsInTopN(Long quizId, int topN) {
        List<ScoreboardEntry> scoreboard = getScoreboard(quizId);
        
        // Get top N entries
        List<ScoreboardEntry> topEntries = scoreboard.stream()
                .filter(e -> e.rank() <= topN)
                .toList();
        
        // Return only those that are tied
        return topEntries.stream()
                .filter(ScoreboardEntry::isTied)
                .toList();
    }

    /**
     * Checks if there are any ties in the top N positions.
     */
    public boolean hasTiesInTopN(Long quizId, int topN) {
        return !getTiedTeamsInTopN(quizId, topN).isEmpty();
    }

    /**
     * Scoreboard entry record containing rank, team info, score, and tie status.
     */
    public record ScoreboardEntry(
            int rank,
            Long teamId,
            String teamName,
            int score,
            boolean isTied
    ) {
        // Constructor for backward compatibility
        public ScoreboardEntry(int rank, Long teamId, String teamName, int score) {
            this(rank, teamId, teamName, score, false);
        }
    }
}
