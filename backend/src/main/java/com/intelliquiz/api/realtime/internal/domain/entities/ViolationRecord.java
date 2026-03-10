package com.intelliquiz.api.realtime.internal.domain.entities;

import com.intelliquiz.api.shared.domain.entities.SoftDeletableEntity;
import com.intelliquiz.api.shared.enums.ViolationType;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

/**
 * Entity recording a proctoring violation detected during a live quiz session.
 * Tracks tab switches, copy attempts, and other anti-cheat violations.
 */
@Entity
@Table(name = "violation_record", indexes = {
    @Index(name = "idx_vr_quiz_id", columnList = "quiz_id"),
    @Index(name = "idx_vr_team_id", columnList = "team_id"),
    @Index(name = "idx_vr_quiz_team", columnList = "quiz_id, team_id")
})
@SQLDelete(sql = "UPDATE violation_record SET deleted = true WHERE id = ?")
@SQLRestriction("deleted = false")
public class ViolationRecord extends SoftDeletableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Enumerated(EnumType.STRING)
    @Column(name = "violation_type", nullable = false)
    private ViolationType violationType;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    public ViolationRecord() {
    }

    public ViolationRecord(Long quizId, Long teamId, ViolationType violationType) {
        this.quizId = quizId;
        this.teamId = teamId;
        this.violationType = violationType;
        this.detectedAt = LocalDateTime.now();
    }

    // ==================== Getters and Setters ====================

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

    public Long getTeamId() {
        return teamId;
    }

    public void setTeamId(Long teamId) {
        this.teamId = teamId;
    }

    public ViolationType getViolationType() {
        return violationType;
    }

    public void setViolationType(ViolationType violationType) {
        this.violationType = violationType;
    }

    public LocalDateTime getDetectedAt() {
        return detectedAt;
    }

    public void setDetectedAt(LocalDateTime detectedAt) {
        this.detectedAt = detectedAt;
    }
}
