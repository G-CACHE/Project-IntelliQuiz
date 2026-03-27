package com.intelliquiz.api.team.internal.domain.entities;

import com.intelliquiz.api.shared.domain.entities.SoftDeletableEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * Team entity representing a participant group registered for a specific quiz.
 * Maps to the "team" database table.
 */
@Entity
@Table(name = "team")
@SQLDelete(sql = "UPDATE team SET deleted = true WHERE id = ?")
@SQLRestriction("deleted = false")
public class Team extends SoftDeletableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(nullable = false)
    private String name;

    @Column(name = "access_code", nullable = false)
    private String accessCode;

    @Column(name = "total_score")
    private int totalScore = 0;

    @Column(name = "device_id")
    private String deviceId;

    public Team() {
    }

    public Team(Long quizId, String name, String accessCode) {
        this.quizId = quizId;
        this.name = name;
        this.accessCode = accessCode;
        this.totalScore = 0;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAccessCode() {
        return accessCode;
    }

    public void setAccessCode(String accessCode) {
        this.accessCode = accessCode;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public void addPoints(int points) {
        this.totalScore += points;
    }

    // ==================== Rich Domain Behavior ====================

    /**
     * Resets the team's total score to zero.
     * Used when restarting a quiz or clearing scores.
     */
    public void resetScore() {
        this.totalScore = 0;
    }

    /**
     * Validates that the total score is non-negative.
     * 
     * @throws IllegalArgumentException if total score is negative
     */
    public void validateScore() {
        if (this.totalScore < 0) {
            throw new IllegalArgumentException("Total score cannot be negative");
        }
    }
}
