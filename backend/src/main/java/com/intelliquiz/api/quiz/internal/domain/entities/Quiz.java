package com.intelliquiz.api.quiz.internal.domain.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.intelliquiz.api.shared.domain.entities.SoftDeletableEntity;
import com.intelliquiz.api.shared.enums.NavigationMode;
import com.intelliquiz.api.shared.enums.QuizAccessMode;
import com.intelliquiz.api.shared.enums.QuizStatus;
import com.intelliquiz.api.shared.exceptions.InvalidQuizStateException;
import com.intelliquiz.api.shared.exceptions.QuizNotReadyException;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.util.ArrayList;
import java.util.List;

/**
 * Quiz entity representing the root event container for a quiz competition.
 * Maps to the "quizz" database table.
 * 
 * Rich domain entity with behavior methods for state transitions and validation.
 */
@Entity
@Table(name = "quiz", uniqueConstraints = {
    @UniqueConstraint(name = "uk_quiz_quiz_code", columnNames = "quiz_code")
})
@SQLDelete(sql = "UPDATE quiz SET deleted = true WHERE id = ?")
@SQLRestriction("deleted = false")
public class Quiz extends SoftDeletableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "proctor_pin", nullable = false)
    private String proctorPin;

    @Column(name = "quiz_code", length = 6, unique = true)
    private String quizCode;

    @Column(name = "is_live_session", nullable = false)
    private boolean isLiveSession;

    @Enumerated(EnumType.STRING)
    private QuizStatus status;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "navigation_mode", nullable = false)
    private NavigationMode navigationMode = NavigationMode.TOURNAMENT;

    @Column(name = "global_time_limit_seconds", nullable = false)
    private int globalTimeLimitSeconds = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_mode", nullable = false)
    private QuizAccessMode accessMode = QuizAccessMode.RESTRICTED;

    @Column(name = "randomize_questions", nullable = false)
    private boolean randomizeQuestions = false;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    @JsonManagedReference("quiz-questions")
    private List<Question> questions = new ArrayList<>();

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
     * Returns the quiz back to DRAFT from READY.
     */
    public void transitionToDraft() {
        if (this.status != QuizStatus.READY) {
            throw new InvalidQuizStateException("Only READY quizzes can be marked as DRAFT");
        }
        this.status = QuizStatus.DRAFT;
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

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public List<Question> getQuestions() {
        return questions;
    }

    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }

    public void addQuestion(Question question) {
        questions.add(question);
        question.setQuiz(this);
    }

    public void removeQuestion(Question question) {
        questions.remove(question);
        question.setQuiz(null);
    }

    public NavigationMode getNavigationMode() {
        return navigationMode;
    }

    public void setNavigationMode(NavigationMode navigationMode) {
        this.navigationMode = navigationMode;
    }

    public int getGlobalTimeLimitSeconds() {
        return globalTimeLimitSeconds;
    }

    public void setGlobalTimeLimitSeconds(int globalTimeLimitSeconds) {
        this.globalTimeLimitSeconds = globalTimeLimitSeconds;
    }

    public QuizAccessMode getAccessMode() {
        return accessMode;
    }

    public void setAccessMode(QuizAccessMode accessMode) {
        this.accessMode = accessMode;
    }

    public String getQuizCode() {
        return quizCode;
    }

    public void setQuizCode(String quizCode) {
        this.quizCode = quizCode;
    }

    public boolean isRandomizeQuestions() {
        return randomizeQuestions;
    }

    public void setRandomizeQuestions(boolean randomizeQuestions) {
        this.randomizeQuestions = randomizeQuestions;
    }
}
