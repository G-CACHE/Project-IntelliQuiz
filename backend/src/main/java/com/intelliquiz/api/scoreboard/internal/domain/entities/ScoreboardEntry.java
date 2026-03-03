package com.intelliquiz.api.scoreboard.internal.domain.entities;

import com.intelliquiz.api.shared.domain.entities.SoftDeletableEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * CQRS read model entity for the scoreboard.
 * Denormalized projection maintained by ScoreboardProjection event listener.
 */
@Entity
@Table(name = "scoreboard_entries", indexes = {
    @Index(name = "idx_scoreboard_quiz_id", columnList = "quizId"),
    @Index(name = "idx_scoreboard_team_id", columnList = "teamId")
})
@SQLDelete(sql = "UPDATE scoreboard_entries SET deleted = true WHERE id = ?")
@SQLRestriction("deleted = false")
public class ScoreboardEntry extends SoftDeletableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long quizId;

    @Column(nullable = false, unique = true)
    private Long teamId;

    @Column(nullable = false)
    private String teamName;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private int rank;

    @Column(nullable = false)
    private boolean isTied;

    protected ScoreboardEntry() {
        // JPA
    }

    public ScoreboardEntry(Long quizId, Long teamId, String teamName) {
        this.quizId = quizId;
        this.teamId = teamId;
        this.teamName = teamName;
        this.score = 0;
        this.rank = 1;
        this.isTied = false;
    }

    // --- Domain methods ---

    public void addScore(int points) {
        this.score += points;
    }

    public void resetScore() {
        this.score = 0;
    }

    public void updateRank(int rank, boolean isTied) {
        this.rank = rank;
        this.isTied = isTied;
    }

    // --- Getters ---

    public Long getId() { return id; }
    public Long getQuizId() { return quizId; }
    public Long getTeamId() { return teamId; }
    public String getTeamName() { return teamName; }
    public int getScore() { return score; }
    public int getRank() { return rank; }
    public boolean isTied() { return isTied; }

    // --- Setters for testing ---

    public void setId(Long id) { this.id = id; }
    public void setScore(int score) { this.score = score; }
    public void setRank(int rank) { this.rank = rank; }
    public void setTied(boolean tied) { this.isTied = tied; }
}
