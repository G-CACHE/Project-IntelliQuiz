package com.intelliquiz.api.quiz.internal.domain.entities;

import com.intelliquiz.api.shared.enums.Difficulty;
import com.intelliquiz.api.shared.enums.QuestionType;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a reusable question in an Admin's personal Question Bank.
 * Question Bank items are independent copies — edits to quiz questions don't affect the bank, and vice versa.
 */
@Entity
@Table(name = "question_bank_item", indexes = {
    @Index(name = "idx_qbi_owner", columnList = "owner_user_id"),
    @Index(name = "idx_qbi_type", columnList = "question_type"),
    @Index(name = "idx_qbi_difficulty", columnList = "difficulty")
})
public class QuestionBankItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_user_id", nullable = false)
    private Long ownerUserId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType type;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    @Column(name = "correct_key", nullable = false)
    private String correctKey;

    private int points;

    @Column(name = "time_limit")
    private int timeLimit;

    @ElementCollection
    @CollectionTable(name = "question_bank_option", joinColumns = @JoinColumn(name = "question_bank_item_id"))
    @Column(name = "option_text")
    private List<String> options = new ArrayList<>();

    @Column(name = "source_quiz_id")
    private Long sourceQuizId;

    @Column(name = "source_question_id")
    private Long sourceQuestionId;

    @Column(name = "category")
    private String category;

    @Column(name = "is_harvested", nullable = false)
    private boolean isHarvested = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public QuestionBankItem() {
    }

    // ==================== Rich Domain Methods ====================

    /**
     * Creates a new quiz Question from this bank item.
     */
    public Question toQuizQuestion(Quiz quiz, int orderIndex) {
        Question q = new Question();
        q.setQuiz(quiz);
        q.setText(this.text);
        q.setType(this.type);
        q.setDifficulty(this.difficulty);
        q.setCorrectKey(this.correctKey);
        q.setPoints(this.points);
        q.setTimeLimit(this.timeLimit);
        q.setOrderIndex(orderIndex);
        q.setOptions(new ArrayList<>(this.options));
        return q;
    }

    /**
     * Creates a QuestionBankItem from an existing quiz Question.
     */
    public static QuestionBankItem fromQuestion(Question question, Long ownerUserId) {
        QuestionBankItem item = new QuestionBankItem();
        item.setOwnerUserId(ownerUserId);
        item.setText(question.getText());
        item.setType(question.getType());
        item.setDifficulty(question.getDifficulty());
        item.setCorrectKey(question.getCorrectKey());
        item.setPoints(question.getPoints());
        item.setTimeLimit(question.getTimeLimit());
        item.setOptions(new ArrayList<>(question.getOptions()));
        item.setSourceQuizId(question.getQuiz().getId());
        item.setSourceQuestionId(question.getId());
        return item;
    }

    // ==================== Getters & Setters ====================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(Long ownerUserId) {
        this.ownerUserId = ownerUserId;
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

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public Long getSourceQuizId() {
        return sourceQuizId;
    }

    public void setSourceQuizId(Long sourceQuizId) {
        this.sourceQuizId = sourceQuizId;
    }

    public Long getSourceQuestionId() {
        return sourceQuestionId;
    }

    public void setSourceQuestionId(Long sourceQuestionId) {
        this.sourceQuestionId = sourceQuestionId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public boolean isHarvested() {
        return isHarvested;
    }

    public void setHarvested(boolean harvested) {
        isHarvested = harvested;
    }
}
