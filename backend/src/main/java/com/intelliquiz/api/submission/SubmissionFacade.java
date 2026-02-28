package com.intelliquiz.api.submission;

import com.intelliquiz.api.submission.dto.SubmissionInfoDto;
import com.intelliquiz.api.submission.internal.application.services.SubmissionService;
import com.intelliquiz.api.submission.internal.domain.entities.Submission;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Public facade for the Submission module.
 * All cross-module access to submission data should go through this facade.
 */
@Service
public class SubmissionFacade {

    private final SubmissionService submissionService;

    public SubmissionFacade(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    /**
     * Submit an answer (no immediate grading — grading happens on timer expiry).
     */
    public SubmissionInfoDto submitAnswer(Long teamId, Long questionId, String answer) {
        Submission s = submissionService.submitAnswer(teamId, questionId, answer);
        return toDto(s);
    }

    /**
     * Submit an answer with immediate grading.
     */
    public SubmissionInfoDto submitAnswerWithGrading(Long teamId, Long questionId, String answer) {
        Submission s = submissionService.submitAnswerWithGrading(teamId, questionId, answer);
        return toDto(s);
    }

    /**
     * Check if a team has already submitted for a question.
     */
    public boolean hasSubmitted(Long teamId, Long questionId) {
        return submissionService.hasSubmitted(teamId, questionId);
    }

    /**
     * Count submissions for a question.
     */
    public int countSubmissionsForQuestion(Long questionId) {
        return submissionService.countSubmissionsForQuestion(questionId);
    }

    /**
     * Get submissions for a team.
     */
    public List<SubmissionInfoDto> getSubmissionsByTeam(Long teamId) {
        return submissionService.getSubmissionsByTeam(teamId).stream()
                .map(this::toDto)
                .toList();
    }

    private SubmissionInfoDto toDto(Submission s) {
        return new SubmissionInfoDto(
                s.getId(), s.getTeamId(), s.getQuestionId(),
                s.getSubmittedAnswer(), s.isCorrect(), s.getAwardedPoints(),
                s.getSubmittedAt(), s.isGraded());
    }
}
