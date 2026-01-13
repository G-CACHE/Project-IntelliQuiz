package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Quiz;
import com.intelliquiz.api.domain.entities.Submission;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.enums.QuestionType;
import com.intelliquiz.api.domain.ports.QuestionRepository;
import com.intelliquiz.api.domain.ports.SubmissionRepository;
import com.intelliquiz.api.infrastructure.websocket.dto.AnswerDistribution;
import net.jqwik.api.*;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for answer distribution calculation.
 * Feature: websocket-realtime
 */
class AnswerDistributionPropertyTest {

    /**
     * Feature: websocket-realtime, Property 17: Answer Distribution Accuracy
     * For any MCQ question reveal, the AnswerDistribution SHALL accurately reflect
     * the count of submissions for each option (A, B, C, D).
     * 
     * **Validates: Requirements 2.5**
     */
    @Example
    void answerDistributionAccuratelyCountsOptions() {
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        
        Long questionId = 100L;
        
        Quiz quiz = new Quiz();
        quiz.setId(1L);
        
        Question question = new Question();
        question.setId(questionId);
        question.setType(QuestionType.MULTIPLE_CHOICE);
        question.setOptions(List.of("Option A", "Option B", "Option C", "Option D"));
        question.setCorrectKey("B");
        question.setQuiz(quiz);
        
        // Create teams and submissions
        Team team1 = new Team(); team1.setId(1L); team1.setName("Team 1");
        Team team2 = new Team(); team2.setId(2L); team2.setName("Team 2");
        Team team3 = new Team(); team3.setId(3L); team3.setName("Team 3");
        Team team4 = new Team(); team4.setId(4L); team4.setName("Team 4");
        Team team5 = new Team(); team5.setId(5L); team5.setName("Team 5");
        
        Submission sub1 = new Submission(team1, question, "A");
        Submission sub2 = new Submission(team2, question, "B"); // Correct
        Submission sub3 = new Submission(team3, question, "B"); // Correct
        Submission sub4 = new Submission(team4, question, "C");
        Submission sub5 = new Submission(team5, question, "A");
        
        List<Submission> submissions = List.of(sub1, sub2, sub3, sub4, sub5);
        
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));
        when(submissionRepository.findByQuestion(question)).thenReturn(submissions);
        
        AnswerDistributionService service = new AnswerDistributionService(
                questionRepository, submissionRepository
        );
        
        AnswerDistribution distribution = service.calculateDistribution(questionId);
        
        // Verify counts
        assertThat(distribution.optionCounts().get("A"))
                .as("Option A should have 2 submissions")
                .isEqualTo(2);
        assertThat(distribution.optionCounts().get("B"))
                .as("Option B should have 2 submissions")
                .isEqualTo(2);
        assertThat(distribution.optionCounts().get("C"))
                .as("Option C should have 1 submission")
                .isEqualTo(1);
        assertThat(distribution.optionCounts().get("D"))
                .as("Option D should have 0 submissions")
                .isEqualTo(0);
        
        // Verify correct/incorrect counts
        assertThat(distribution.correctCount())
                .as("Correct count should be 2 (B is correct)")
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
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        
        Long questionId = 100L;
        
        Quiz quiz = new Quiz();
        quiz.setId(1L);
        
        Question question = new Question();
        question.setId(questionId);
        question.setType(QuestionType.MULTIPLE_CHOICE);
        question.setOptions(List.of("A", "B", "C", "D"));
        question.setCorrectKey("A");
        question.setQuiz(quiz);
        
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));
        when(submissionRepository.findByQuestion(question)).thenReturn(List.of());
        
        AnswerDistributionService service = new AnswerDistributionService(
                questionRepository, submissionRepository
        );
        
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
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        
        Long questionId = 100L;
        
        Quiz quiz = new Quiz();
        quiz.setId(1L);
        
        Question question = new Question();
        question.setId(questionId);
        question.setType(QuestionType.MULTIPLE_CHOICE);
        question.setOptions(List.of("A", "B", "C", "D"));
        question.setCorrectKey("C");
        question.setQuiz(quiz);
        
        Team team1 = new Team(); team1.setId(1L);
        Team team2 = new Team(); team2.setId(2L);
        Team team3 = new Team(); team3.setId(3L);
        
        List<Submission> submissions = List.of(
                new Submission(team1, question, "A"),
                new Submission(team2, question, "C"),
                new Submission(team3, question, "D")
        );
        
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));
        when(submissionRepository.findByQuestion(question)).thenReturn(submissions);
        
        AnswerDistributionService service = new AnswerDistributionService(
                questionRepository, submissionRepository
        );
        
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
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        
        Long questionId = 100L;
        
        Quiz quiz = new Quiz();
        quiz.setId(1L);
        
        Question question = new Question();
        question.setId(questionId);
        question.setType(QuestionType.IDENTIFICATION);
        question.setCorrectKey("Paris");
        question.setQuiz(quiz);
        
        Team team1 = new Team(); team1.setId(1L);
        
        List<Submission> submissions = List.of(
                new Submission(team1, question, "Paris")
        );
        
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));
        when(submissionRepository.findByQuestion(question)).thenReturn(submissions);
        
        AnswerDistributionService service = new AnswerDistributionService(
                questionRepository, submissionRepository
        );
        
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
