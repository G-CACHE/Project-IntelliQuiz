package com.intelliquiz.api.domain.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Team entity representing a participant group registered for a specific quiz.
 * Maps to the "team" database table.
 */
@Entity
@Table(name = "team")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonBackReference("quiz-teams")
    private Quiz quiz;

    @Column(nullable = false)
    private String name;

    @Column(name = "access_code", nullable = false)
    private String accessCode;

    @Column(name = "total_score")
    private int totalScore = 0;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL)
    @JsonManagedReference("team-submissions")
    private List<Submission> submissions = new ArrayList<>();

    public Team() {
    }

    public Team(Quiz quiz, String name, String accessCode) {
        this.quiz = quiz;
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

    public Quiz getQuiz() {
        return quiz;
    }

    public void setQuiz(Quiz quiz) {
        this.quiz = quiz;
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

    public List<Submission> getSubmissions() {
        return submissions;
    }

    public void setSubmissions(List<Submission> submissions) {
        this.submissions = submissions;
    }

    public void addSubmission(Submission submission) {
        submissions.add(submission);
        submission.setTeam(this);
    }

    public void removeSubmission(Submission submission) {
        submissions.remove(submission);
        submission.setTeam(null);
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
