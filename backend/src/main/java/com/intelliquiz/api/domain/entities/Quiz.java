package com.intelliquiz.api.domain.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.intelliquiz.api.domain.enums.QuizStatus;
import com.intelliquiz.api.domain.exceptions.InvalidQuizStateException;
import com.intelliquiz.api.domain.exceptions.QuizNotReadyException;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Quiz entity representing the root event container for a quiz competition.
 * Maps to the "quizz" database table.
 * 
 * Rich domain entity with behavior methods for state transitions and validation.
 */
@Entity
@Table(name = "quiz")
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "proctor_pin", nullable = false)
    private String proctorPin;

    @Column(name = "is_live_session", nullable = false)
    private boolean isLiveSession;

    @Enumerated(EnumType.STRING)
    private QuizStatus status;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    @JsonManagedReference("quiz-questions")
    private List<Question> questions = new ArrayList<>();

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    @JsonManagedReference("quiz-teams")
    private List<Team> teams = new ArrayList<>();

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("quiz-assignments")
    private List<QuizAssignment> assignments = new ArrayList<>();

    public Quiz() {
    }

    public Quiz(String title, String description, String proctorPin, QuizStatus status) {
        this.title = title;
        this.description = description;
        this.proctorPin = proctorPin;
        this.status = status;
        this.isLiveSession = false;
    }

    // ==================== Rich Domain Behavior ====================

    /**
     * Activates this quiz session, making it live for participants.
     * Only quizzes in READY status can be activated.
     * 
     * @throws QuizNotReadyException if the quiz is not in READY status
     */
    public void activate() {
        if (this.status != QuizStatus.READY) {
            throw new QuizNotReadyException("Quiz must be in READY status to activate. Current status: " + this.status);
        }
        this.isLiveSession = true;
    }

    /**
     * Deactivates this quiz session, ending the live session.
     */
    public void deactivate() {
        this.isLiveSession = false;
    }

    /**
     * Transitions the quiz from DRAFT to READY status.
     * Validates that the quiz has at least one question before transitioning.
     * 
     * @throws InvalidQuizStateException if the quiz has no questions
     */
    public void transitionToReady() {
        if (this.questions == null || this.questions.isEmpty()) {
            throw new InvalidQuizStateException("Quiz must have at least one question to transition to READY");
        }
        this.status = QuizStatus.READY;
    }

    /**
     * Archives the quiz, marking it as no longer active.
     * Also deactivates any live session.
     */
    public void archive() {
        this.isLiveSession = false;
        this.status = QuizStatus.ARCHIVED;
    }

    /**
     * Returns the teams sorted by total score in descending order (leaderboard).
     * 
     * @return list of teams sorted by score (highest first)
     */
    @JsonIgnore
    public List<Team> getLeaderboard() {
        return teams.stream()
                .sorted(Comparator.comparingInt(Team::getTotalScore).reversed())
                .toList();
    }

    /**
     * Validates that the quiz title is not blank.
     * 
     * @throws IllegalArgumentException if title is null or blank
     */
    public void validateTitle() {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Quiz title cannot be blank");
        }
    }

    // ==================== Getters and Setters ====================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getProctorPin() {
        return proctorPin;
    }

    public void setProctorPin(String proctorPin) {
        this.proctorPin = proctorPin;
    }

    public boolean isLiveSession() {
        return isLiveSession;
    }

    public void setLiveSession(boolean liveSession) {
        isLiveSession = liveSession;
    }

    public QuizStatus getStatus() {
        return status;
    }

    public void setStatus(QuizStatus status) {
        this.status = status;
    }

    public List<Question> getQuestions() {
        return questions;
    }

    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }

    public List<Team> getTeams() {
        return teams;
    }

    public void setTeams(List<Team> teams) {
        this.teams = teams;
    }

    public List<QuizAssignment> getAssignments() {
        return assignments;
    }

    public void setAssignments(List<QuizAssignment> assignments) {
        this.assignments = assignments;
    }

    public void addQuestion(Question question) {
        questions.add(question);
        question.setQuiz(this);
    }

    public void removeQuestion(Question question) {
        questions.remove(question);
        question.setQuiz(null);
    }

    public void addTeam(Team team) {
        teams.add(team);
        team.setQuiz(this);
    }

    public void removeTeam(Team team) {
        teams.remove(team);
        team.setQuiz(null);
    }

    public void addAssignment(QuizAssignment assignment) {
        assignments.add(assignment);
        assignment.setQuiz(this);
    }

    public void removeAssignment(QuizAssignment assignment) {
        assignments.remove(assignment);
        assignment.setQuiz(null);
    }
}
