package com.intelliquiz.api.submission.internal.domain.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Submission entity representing a team's answer submission with correctness and points.
 * Maps to the "submission" database table.
 * 
 * Decoupled from Team and Question entities — stores only foreign key IDs.
 */
@Entity
@Table(name = "submission")
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "submitted_answer")
    private String submittedAnswer;

    @Column(name = "is_correct")
    private boolean isCorrect;

    @Column(name = "awarded_points")
    private int awardedPoints;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "is_graded")
    private boolean isGraded;

    public Submission() {
    }

    public Submission(Long teamId, Long questionId, String submittedAnswer) {
        this.teamId = teamId;
        this.questionId = questionId;
        this.submittedAnswer = submittedAnswer;
        this.submittedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTeamId() {
        return teamId;
    }

    public void setTeamId(Long teamId) {
        this.teamId = teamId;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getSubmittedAnswer() {
        return submittedAnswer;
    }

    public void setSubmittedAnswer(String submittedAnswer) {
        this.submittedAnswer = submittedAnswer;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public void setCorrect(boolean correct) {
        isCorrect = correct;
    }

    public int getAwardedPoints() {
        return awardedPoints;
    }

    public void setAwardedPoints(int awardedPoints) {
        this.awardedPoints = awardedPoints;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public boolean isGraded() {
        return isGraded;
    }

    public void setGraded(boolean graded) {
        isGraded = graded;
    }

    // ==================== Rich Domain Behavior ====================

    /**
     * Grades this submission by checking correctness against the provided correct answer
     * and awarding points if correct.
     * 
     * Note: Team score update is handled by the service layer via TeamFacade.
     *
     * @param correctAnswer the correct answer key to compare against
     * @param questionPoints the points to award if the answer is correct
     */
    public void grade(String correctAnswer, int questionPoints) {
        this.isCorrect = correctAnswer != null
                && correctAnswer.trim().equalsIgnoreCase(
                        this.submittedAnswer != null ? this.submittedAnswer.trim() : "");
        if (this.isCorrect) {
            this.awardedPoints = questionPoints;
        } else {
            this.awardedPoints = 0;
        }
        this.isGraded = true;
    }

    /**
     * Validates that the submission timestamp is not in the future.
     * 
     * @throws IllegalArgumentException if submittedAt is in the future
     */
    public void validateSubmittedAt() {
        if (this.submittedAt != null && this.submittedAt.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Submission time cannot be in the future");
        }
    }
}
