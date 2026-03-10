package com.intelliquiz.api.realtime.internal;

import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.quiz.dto.QuestionInfoDto;
import com.intelliquiz.api.submission.SubmissionFacade;
import com.intelliquiz.api.submission.dto.SubmissionInfoDto;
import com.intelliquiz.api.shared.enums.QuestionType;
import com.intelliquiz.api.realtime.internal.application.services.AnswerDistributionService;
import com.intelliquiz.api.realtime.internal.presentation.dto.AnswerDistribution;
import net.jqwik.api.*;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for answer distribution calculation.
 * Feature: websocket-realtime
 */
class AnswerDistributionPropertyTest {

    /** Helper to create a SubmissionInfoDto with only the fields relevant to distribution. */
    private static SubmissionInfoDto submission(Long teamId, Long questionId, String answer) {
        return new SubmissionInfoDto(null, teamId, questionId, answer, false, 0, LocalDateTime.now(), false);
    }

    /**
     * Feature: websocket-realtime, Property 17: Answer Distribution Accuracy
     * For any MCQ question reveal, the AnswerDistribution SHALL accurately reflect
     * the count of submissions for each option (by option text).
     * 
     * **Validates: Requirements 2.5**
     */
    @Example
    void answerDistributionAccuratelyCountsOptions() {
        QuizFacade quizFacade = mock(QuizFacade.class);
        SubmissionFacade submissionFacade = mock(SubmissionFacade.class);
        
        Long questionId = 100L;
        
        QuestionInfoDto question = new QuestionInfoDto(
                questionId, "Test Question", QuestionType.MULTIPLE_CHOICE,
                List.of("Option A", "Option B", "Option C", "Option D"),
                "B", 10, 30, 1, "EASY"
        );
        
        // Submissions use option TEXT (what the frontend actually sends)
        List<SubmissionInfoDto> submissions = List.of(
                submission(1L, questionId, "Option A"),
                submission(2L, questionId, "Option B"),  // Correct (B → "Option B")
                submission(3L, questionId, "Option B"),  // Correct
                submission(4L, questionId, "Option C"),
                submission(5L, questionId, "Option A")
        );
        
        when(quizFacade.getQuestionForGrading(questionId)).thenReturn(question);
        when(submissionFacade.getSubmissionsByQuestion(questionId)).thenReturn(submissions);
        
        AnswerDistributionService service = new AnswerDistributionService(quizFacade, submissionFacade);
        
        AnswerDistribution distribution = service.calculateDistribution(questionId);
        
        // Verify counts — keyed by option text
        assertThat(distribution.optionCounts().get("Option A"))
                .as("Option A should have 2 submissions")
                .isEqualTo(2);
        assertThat(distribution.optionCounts().get("Option B"))
                .as("Option B should have 2 submissions")
                .isEqualTo(2);
        assertThat(distribution.optionCounts().get("Option C"))
                .as("Option C should have 1 submission")
                .isEqualTo(1);
        assertThat(distribution.optionCounts().get("Option D"))
                .as("Option D should have 0 submissions")
                .isEqualTo(0);
        
        // Verify correct/incorrect counts
        assertThat(distribution.correctCount())
                .as("Correct count should be 2 (B → 'Option B' is correct)")
                .isEqualTo(2);
        assertThat(distribution.incorrectCount())
                .as("Incorrect count should be 3")
                .isEqualTo(3);
    }

    /**
     * Property: Distribution handles no submissions gracefully.
     */
    @Example
    void answerDistributionHandlesNoSubmissions() {
        QuizFacade quizFacade = mock(QuizFacade.class);
        SubmissionFacade submissionFacade = mock(SubmissionFacade.class);
        
        Long questionId = 100L;
        
        QuestionInfoDto question = new QuestionInfoDto(
                questionId, "Test Question", QuestionType.MULTIPLE_CHOICE,
                List.of("Alpha", "Beta", "Gamma", "Delta"), "A", 10, 30, 1, "EASY"
        );
        
        when(quizFacade.getQuestionForGrading(questionId)).thenReturn(question);
        when(submissionFacade.getSubmissionsByQuestion(questionId)).thenReturn(List.of());
        
        AnswerDistributionService service = new AnswerDistributionService(quizFacade, submissionFacade);
        
        AnswerDistribution distribution = service.calculateDistribution(questionId);
        
        assertThat(distribution.optionCounts().values())
                .as("All option counts should be 0")
                .allMatch(count -> count == 0);
        assertThat(distribution.correctCount()).isEqualTo(0);
        assertThat(distribution.incorrectCount()).isEqualTo(0);
    }

    /**
     * Property: Total submissions equals sum of option counts.
     */
    @Example
    void totalSubmissionsEqualsSumOfOptionCounts() {
        QuizFacade quizFacade = mock(QuizFacade.class);
        SubmissionFacade submissionFacade = mock(SubmissionFacade.class);
        
        Long questionId = 100L;
        
        QuestionInfoDto question = new QuestionInfoDto(
                questionId, "Test Question", QuestionType.MULTIPLE_CHOICE,
                List.of("Alpha", "Beta", "Gamma", "Delta"), "C", 10, 30, 1, "EASY"
        );
        
        // Submissions use option text (what the frontend sends)
        List<SubmissionInfoDto> submissions = List.of(
                submission(1L, questionId, "Alpha"),
                submission(2L, questionId, "Gamma"),
                submission(3L, questionId, "Delta")
        );
        
        when(quizFacade.getQuestionForGrading(questionId)).thenReturn(question);
        when(submissionFacade.getSubmissionsByQuestion(questionId)).thenReturn(submissions);
        
        AnswerDistributionService service = new AnswerDistributionService(quizFacade, submissionFacade);
        
        AnswerDistribution distribution = service.calculateDistribution(questionId);
        
        int totalFromCounts = distribution.optionCounts().values().stream()
                .mapToInt(Integer::intValue)
                .sum();
        
        assertThat(totalFromCounts)
                .as("Sum of option counts should equal total submissions")
                .isEqualTo(submissions.size());
        
        assertThat(distribution.correctCount() + distribution.incorrectCount())
                .as("Correct + incorrect should equal total submissions")
                .isEqualTo(submissions.size());
    }

    /**
     * Property: Identification questions return empty distribution.
     */
    @Example
    void identificationQuestionsReturnEmptyDistribution() {
        QuizFacade quizFacade = mock(QuizFacade.class);
        SubmissionFacade submissionFacade = mock(SubmissionFacade.class);
        
        Long questionId = 100L;
        
        QuestionInfoDto question = new QuestionInfoDto(
                questionId, "What is the capital of France?", QuestionType.IDENTIFICATION,
                List.of(), "Paris", 10, 30, 1, "EASY"
        );
        
        List<SubmissionInfoDto> submissions = List.of(
                submission(1L, questionId, "Paris")
        );
        
        when(quizFacade.getQuestionForGrading(questionId)).thenReturn(question);
        when(submissionFacade.getSubmissionsByQuestion(questionId)).thenReturn(submissions);
        
        AnswerDistributionService service = new AnswerDistributionService(quizFacade, submissionFacade);
        
        AnswerDistribution distribution = service.calculateDistribution(questionId);
        
        // For identification questions, option counts should be empty
        assertThat(distribution.optionCounts())
                .as("Identification questions should have empty option counts")
                .isEmpty();
        
        // But correct/incorrect counts should still be calculated
        assertThat(distribution.correctCount()).isEqualTo(1);
        assertThat(distribution.incorrectCount()).isEqualTo(0);
    }
}
