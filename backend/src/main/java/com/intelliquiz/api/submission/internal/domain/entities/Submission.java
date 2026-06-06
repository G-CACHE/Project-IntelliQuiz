package com.intelliquiz.api.submission.internal.domain.entities;

import com.intelliquiz.api.shared.domain.entities.SoftDeletableEntity;
import com.intelliquiz.api.shared.enums.QuestionType;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.Locale;

/**
 * Submission entity representing a team's answer submission with correctness and points.
 * Maps to the "submission" database table.
 * 
 * Decoupled from Team and Question entities — stores only foreign key IDs.
 */
@Entity
@Table(name = "submission")
@SQLDelete(sql = "UPDATE submission SET deleted = true WHERE id = ?")
@SQLRestriction("deleted = false")
public class Submission extends SoftDeletableEntity {

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
        grade(correctAnswer, questionPoints, QuestionType.IDENTIFICATION, false);
    }

    /**
     * Grades this submission with question context.
     * For IDENTIFICATION, matching can be case-sensitive or case-insensitive.
     * For other types, comparison keeps legacy case-insensitive behavior.
     */
    public void grade(String correctAnswer, int questionPoints, QuestionType questionType, boolean caseSensitive) {
        if (questionType == QuestionType.IDENTIFICATION) {
            // Case-sensitive: only trim leading/trailing whitespace, preserve internal spacing and case.
            // Case-insensitive: also collapse internal whitespace and uppercase for comparison.
            String submittedTrimmed = this.submittedAnswer == null ? "" : this.submittedAnswer.trim();
            if (caseSensitive) {
                // Also try the whole correctAnswer as-is before splitting on delimiters,
                // so an answer that contains a comma/semicolon/newline still matches itself.
                String wholeKey = correctAnswer == null ? "" : correctAnswer.trim();
                this.isCorrect = (!wholeKey.isBlank() && wholeKey.equals(submittedTrimmed))
                        || parseAcceptedAnswers(correctAnswer).stream()
                                .map(String::trim)
                                .filter(accepted -> !accepted.isBlank())
                                .anyMatch(accepted -> accepted.equals(submittedTrimmed));
            } else {
                String submittedNormalized = submittedTrimmed.replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
                String wholeKeyNormalized = correctAnswer == null ? ""
                        : correctAnswer.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
                this.isCorrect = (!wholeKeyNormalized.isBlank() && wholeKeyNormalized.equals(submittedNormalized))
                        || parseAcceptedAnswers(correctAnswer).stream()
                                .map(accepted -> accepted.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT))
                                .filter(accepted -> !accepted.isBlank())
                                .anyMatch(accepted -> accepted.equals(submittedNormalized));
            }
        } else if (questionType == QuestionType.TRUE_FALSE) {
            // TRUE_FALSE correctKey is stored as "A" (True) or "B" (False) — same letter system as MCQ.
            // Submitted answer is the text value ("True"/"False") from the frontend.
            // Resolve submitted text to a letter before comparing.
            String normalizedSubmitted = normalizeAnswer(this.submittedAnswer);
            String submittedUpper = normalizedSubmitted.toUpperCase(Locale.ROOT).trim();
            String submittedLetter;
            if ("TRUE".equals(submittedUpper)) {
                submittedLetter = "A";
            } else if ("FALSE".equals(submittedUpper)) {
                submittedLetter = "B";
            } else {
                // Already a letter (legacy or direct submission)
                submittedLetter = submittedUpper;
            }
            // Normalize correctKey to a letter as well, to handle legacy data stored as "True"/"False" text.
            String rawCorrectKey = (correctAnswer == null ? "" : correctAnswer.trim().toUpperCase(Locale.ROOT));
            String correctLetter;
            if ("TRUE".equals(rawCorrectKey)) {
                correctLetter = "A";
            } else if ("FALSE".equals(rawCorrectKey)) {
                correctLetter = "B";
            } else {
                correctLetter = rawCorrectKey;
            }
            this.isCorrect = !submittedLetter.isBlank() && submittedLetter.equals(correctLetter);
        } else {
            // MULTIPLE_CHOICE: correctKey is a letter (A/B/C/D).
            // Submitted answer is the letter of the selected option.
            // Primary: letter-to-letter comparison (always case-insensitive for letters).
            String normalizedSubmitted = normalizeAnswer(this.submittedAnswer);
            String submittedLetter = normalizedSubmitted.toUpperCase(Locale.ROOT).trim();
            String correctLetter = (correctAnswer == null ? "" : correctAnswer.trim().toUpperCase(Locale.ROOT));
            boolean matchByLetter = !submittedLetter.isBlank() && submittedLetter.equals(correctLetter);
            if (matchByLetter) {
                this.isCorrect = true;
            } else {
                // Legacy fallback: text comparison for old submissions stored as option text.
                // Respects caseSensitive flag when comparing option text.
                this.isCorrect = parseAcceptedAnswers(correctAnswer).stream()
                        .map(accepted -> normalizeIdentificationAnswer(accepted, caseSensitive))
                        .anyMatch(accepted -> !accepted.isBlank()
                                && accepted.equals(normalizeIdentificationAnswer(normalizedSubmitted, caseSensitive)));
            }
        }
        if (this.isCorrect) {
            this.awardedPoints = questionPoints;
        } else {
            this.awardedPoints = 0;
        }
        this.isGraded = true;
    }

    private static java.util.List<String> parseAcceptedAnswers(String correctAnswer) {
        if (correctAnswer == null || correctAnswer.isBlank()) {
            return java.util.List.of();
        }
        return correctAnswer.lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .toList();
    }

    private static String normalizeAnswer(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
    }

    private static String normalizeIdentificationAnswer(String value, boolean caseSensitive) {
        String normalized = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        return caseSensitive ? normalized : normalized.toUpperCase(Locale.ROOT);
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
