package com.intelliquiz.api.submission.internal.application.services;

import com.intelliquiz.api.submission.internal.domain.entities.Submission;
import com.intelliquiz.api.shared.exceptions.DuplicateSubmissionException;
import com.intelliquiz.api.shared.exceptions.EntityNotFoundException;
import com.intelliquiz.api.quiz.QuizFacade;
import com.intelliquiz.api.quiz.dto.QuestionInfoDto;
import com.intelliquiz.api.team.TeamFacade;
import com.intelliquiz.api.team.dto.TeamInfoDto;
import com.intelliquiz.api.submission.internal.domain.ports.SubmissionRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Application service for submission operations.
 * Handles answer submission with duplicate checking and grading.
 * Uses QuizFacade and TeamFacade for cross-module lookups.
 */
@Service
@Transactional
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final QuizFacade quizFacade;
    private final TeamFacade teamFacade;
    private final ApplicationEventPublisher eventPublisher;

    public SubmissionService(SubmissionRepository submissionRepository,
                              QuizFacade quizFacade,
                              TeamFacade teamFacade,
                              ApplicationEventPublisher eventPublisher) {
        this.submissionRepository = submissionRepository;
        this.quizFacade = quizFacade;
        this.teamFacade = teamFacade;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Submits an answer for a team to a question.
     * If a submission already exists, updates it (allows answer changes until timer expires).
     * Does NOT grade immediately - grading happens when timer expires.
     */
    public Submission submitAnswer(Long teamId, Long questionId, String answer) {
        if (!teamFacade.teamExists(teamId)) {
            throw new EntityNotFoundException("Team", teamId);
        }
        if (!quizFacade.questionExists(questionId)) {
            throw new EntityNotFoundException("Question", questionId);
        }

        // Check for existing submission
        var existingSubmission = submissionRepository.findByTeamIdAndQuestionId(teamId, questionId);
        
        if (existingSubmission.isPresent()) {
            // Update existing submission (answer change allowed)
            Submission submission = existingSubmission.get();
            submission.setSubmittedAnswer(answer);
            submission.setGraded(false); // Reset grading for new answer
            return submissionRepository.save(submission);
        }

        // Create new submission (don't grade yet - wait for timer)
        Submission submission = new Submission(teamId, questionId, answer);
        submission.validateSubmittedAt();
        
        return submissionRepository.save(submission);
    }

    /**
     * Submits an answer with immediate grading (legacy behavior).
     * Use submitAnswer() for WebSocket flow where grading happens on timer expiry.
     * 
     * @throws DuplicateSubmissionException if the team has already submitted for this question
     */
    public Submission submitAnswerWithGrading(Long teamId, Long questionId, String answer) {
        TeamInfoDto teamInfo = teamFacade.getTeamInfo(teamId).orElse(null);
        if (teamInfo == null) {
            throw new EntityNotFoundException("Team", teamId);
        }

        QuestionInfoDto questionInfo = quizFacade.getQuestionForGrading(questionId);
        if (questionInfo == null) {
            throw new EntityNotFoundException("Question", questionId);
        }

        // Check for duplicate submission
        if (submissionRepository.findByTeamIdAndQuestionId(teamId, questionId).isPresent()) {
            throw new DuplicateSubmissionException(
                    "Team " + teamInfo.name() + " has already submitted an answer for this question");
        }

        // Create and grade the submission
        Submission submission = new Submission(teamId, questionId, answer);
        submission.validateSubmittedAt();
        submission.grade(questionInfo.correctKey(), questionInfo.points());

        // Update team score if correct
        if (submission.isCorrect()) {
            teamFacade.addPoints(teamId, submission.getAwardedPoints());
        }

        return submissionRepository.save(submission);
    }

    /**
     * Gets a submission by ID.
     */
    public Submission getSubmission(Long submissionId) {
        return submissionRepository.findById(submissionId)
                .orElseThrow(() -> new EntityNotFoundException("Submission", submissionId));
    }

    /**
     * Gets all submissions for a team.
     */
    public List<Submission> getSubmissionsByTeam(Long teamId) {
        if (!teamFacade.teamExists(teamId)) {
            throw new EntityNotFoundException("Team", teamId);
        }
        return submissionRepository.findByTeamId(teamId);
    }

    /**
     * Gets all submissions for a question.
     */
    public List<Submission> getSubmissionsByQuestion(Long questionId) {
        if (!quizFacade.questionExists(questionId)) {
            throw new EntityNotFoundException("Question", questionId);
        }
        return submissionRepository.findByQuestionId(questionId);
    }

    /**
     * Checks if a team has already submitted for a question.
     */
    public boolean hasSubmitted(Long teamId, Long questionId) {
        return submissionRepository.findByTeamIdAndQuestionId(teamId, questionId).isPresent();
    }

    /**
     * Counts how many teams have submitted for a question.
     */
    public int countSubmissionsForQuestion(Long questionId) {
        return submissionRepository.findByQuestionId(questionId).size();
    }

    /**
     * Checks if all teams in a quiz have submitted for a question.
     */
    public boolean haveAllTeamsSubmitted(Long quizId, Long questionId, int totalTeams) {
        int submissionCount = submissionRepository.findByQuestionId(questionId).size();
        return submissionCount >= totalTeams;
    }
}
