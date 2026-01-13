package com.intelliquiz.api.domain.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.intelliquiz.api.domain.enums.Difficulty;
import com.intelliquiz.api.domain.enums.QuestionType;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Question entity representing a quiz question with content, type, difficulty, and answer key.
 * Maps to the "question" database table.
 * 
 * Rich domain entity with behavior methods for answer validation.
 */
@Entity
@Table(name = "question")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonBackReference("quiz-questions")
    private Quiz quiz;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    @Enumerated(EnumType.STRING)
    private QuestionType type;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    @Column(name = "correct_key", nullable = false)
    private String correctKey;

    private int points;

    @Column(name = "time_limit")
    private int timeLimit;

    @Column(name = "order_index")
    private int orderIndex;

    @ElementCollection
    @CollectionTable(name = "question_option",
                     joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text")
    private List<String> options = new ArrayList<>();

    public Question() {
    }

    public Question(Quiz quiz, String text, QuestionType type, Difficulty difficulty, String correctKey) {
        this.quiz = quiz;
        this.text = text;
        this.type = type;
        this.difficulty = difficulty;
        this.correctKey = correctKey;
    }

    // ==================== Rich Domain Behavior ====================

    /**
     * Checks if the provided answer is correct.
     * Comparison is case-insensitive and trims whitespace.
     * 
     * @param answer the submitted answer to check
     * @return true if the answer matches the correct key
     */
    public boolean isCorrectAnswer(String answer) {
        if (answer == null || correctKey == null) {
            return false;
        }
        return correctKey.equalsIgnoreCase(answer.trim());
    }

    /**
     * Validates that multiple choice questions have valid options and correct key.
     * 
     * @throws IllegalArgumentException if validation fails
     */
    public void validateOptions() {
        if (this.type == QuestionType.MULTIPLE_CHOICE) {
            if (options == null || options.isEmpty()) {
                throw new IllegalArgumentException("Multiple choice questions must have options");
            }
            // Check if correctKey is a valid option index (A, B, C, D) or matches an option
            if (!isValidOptionKey()) {
                throw new IllegalArgumentException("Correct key must be a valid option (A, B, C, D) for multiple choice questions");
            }
        }
    }

    /**
     * Validates that points are non-negative.
     * 
     * @throws IllegalArgumentException if points are negative
     */
    public void validatePoints() {
        if (this.points < 0) {
            throw new IllegalArgumentException("Points cannot be negative");
        }
    }

    /**
     * Checks if the correct key is a valid option for multiple choice questions.
     * Valid keys are A, B, C, D (case-insensitive) corresponding to option indices.
     */
    private boolean isValidOptionKey() {
        if (correctKey == null) {
            return false;
        }
        String key = correctKey.toUpperCase().trim();
        // Check if it's a letter A-D and within the options range
        if (key.length() == 1 && key.charAt(0) >= 'A' && key.charAt(0) <= 'D') {
            int index = key.charAt(0) - 'A';
            return index < options.size();
        }
        return false;
    }

    // ==================== Getters and Setters ====================

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

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public QuestionType getType() {
        return type;
    }

    public void setType(QuestionType type) {
        this.type = type;
    }

    public Difficulty getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Difficulty difficulty) {
        this.difficulty = difficulty;
    }

    public String getCorrectKey() {
        return correctKey;
    }

    public void setCorrectKey(String correctKey) {
        this.correctKey = correctKey;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public int getTimeLimit() {
        return timeLimit;
    }

    public void setTimeLimit(int timeLimit) {
        this.timeLimit = timeLimit;
    }

    public int getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(int orderIndex) {
        this.orderIndex = orderIndex;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public void addOption(String option) {
        options.add(option);
    }

    public void removeOption(String option) {
        options.remove(option);
    }
}
