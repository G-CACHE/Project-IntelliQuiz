package com.intelliquiz.api.domain.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Submission entity representing a team's answer submission with correctness and points.
 * Maps to the "submission" database table.
 */
@Entity
@Table(name = "submission")
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    @JsonBackReference("team-submissions")
    private Team team;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

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

    public Submission(Team team, Question question, String submittedAnswer) {
        this.team = team;
        this.question = question;
        this.submittedAnswer = submittedAnswer;
        this.submittedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question question) {
        this.question = question;
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
     * Grades this submission by evaluating correctness and awarding points.
     * Updates the team's total score if the answer is correct.
     * 
     * This method:
     * 1. Checks if the submitted answer is correct using Question.isCorrectAnswer()
     * 2. Sets awardedPoints to question.points if correct, 0 otherwise
     * 3. Updates the team's totalScore via addPoints()
     * 4. Marks the submission as graded
     */
    public void grade() {
        this.isCorrect = question.isCorrectAnswer(this.submittedAnswer);
        if (this.isCorrect) {
            this.awardedPoints = question.getPoints();
            team.addPoints(this.awardedPoints);
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
