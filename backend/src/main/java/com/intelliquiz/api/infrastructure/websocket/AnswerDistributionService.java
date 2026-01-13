package com.intelliquiz.api.infrastructure.websocket;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Submission;
import com.intelliquiz.api.domain.enums.QuestionType;
import com.intelliquiz.api.domain.ports.QuestionRepository;
import com.intelliquiz.api.domain.ports.SubmissionRepository;
import com.intelliquiz.api.infrastructure.websocket.dto.AnswerDistribution;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for calculating answer distribution for MCQ questions.
 * Used to generate bar graph data for answer reveal.
 */
@Service
public class AnswerDistributionService {

    private final QuestionRepository questionRepository;
    private final SubmissionRepository submissionRepository;

    public AnswerDistributionService(
            QuestionRepository questionRepository,
            SubmissionRepository submissionRepository
    ) {
        this.questionRepository = questionRepository;
        this.submissionRepository = submissionRepository;
    }

    /**
     * Calculates the answer distribution for a question.
     * For MCQ: counts how many teams chose each option (A, B, C, D).
     * For Identification: counts correct vs incorrect.
     */
    public AnswerDistribution calculateDistribution(Long questionId) {
        Question question = questionRepository.findById(questionId).orElse(null);
        if (question == null) {
            return AnswerDistribution.empty();
        }

        List<Submission> submissions = submissionRepository.findByQuestion(question);
        
        if (question.getType() == QuestionType.MULTIPLE_CHOICE) {
            return calculateMcqDistribution(question, submissions);
        } else {
            return calculateIdentificationDistribution(question, submissions);
        }
    }

    /**
     * Calculates distribution for MCQ questions.
     * Counts submissions per option (A, B, C, D).
     */
    private AnswerDistribution calculateMcqDistribution(Question question, List<Submission> submissions) {
        Map<String, Integer> optionCounts = new HashMap<>();
        
        // Initialize all options with 0
        List<String> options = question.getOptions();
        for (int i = 0; i < options.size() && i < 4; i++) {
            String optionKey = String.valueOf((char) ('A' + i));
            optionCounts.put(optionKey, 0);
        }
        
        int correctCount = 0;
        int incorrectCount = 0;
        
        for (Submission submission : submissions) {
            String answer = submission.getSubmittedAnswer();
            if (answer != null && !answer.isBlank()) {
                String normalizedAnswer = answer.toUpperCase().trim();
                
                // Count the option
                if (optionCounts.containsKey(normalizedAnswer)) {
                    optionCounts.merge(normalizedAnswer, 1, Integer::sum);
                }
                
                // Count correct/incorrect
                if (question.isCorrectAnswer(answer)) {
                    correctCount++;
                } else {
                    incorrectCount++;
                }
            } else {
                incorrectCount++; // No answer counts as incorrect
            }
        }
        
        return new AnswerDistribution(optionCounts, correctCount, incorrectCount);
    }

    /**
     * Calculates distribution for identification questions.
     * Simply counts correct vs incorrect.
     */
    private AnswerDistribution calculateIdentificationDistribution(Question question, List<Submission> submissions) {
        int correctCount = 0;
        int incorrectCount = 0;
        
        for (Submission submission : submissions) {
            if (question.isCorrectAnswer(submission.getSubmittedAnswer())) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        }
        
        // For identification, we don't have option counts
        return new AnswerDistribution(Map.of(), correctCount, incorrectCount);
    }
}
