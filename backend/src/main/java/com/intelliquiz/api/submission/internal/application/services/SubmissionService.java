package com.intelliquiz.api.submission.internal.application.services;

import com.intelliquiz.api.submission.internal.domain.entities.Submission;
import com.intelliquiz.api.submission.events.SubmissionGradedEvent;
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
import java.util.Optional;

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

        QuestionInfoDto questionInfo = quizFacade.getQuestionForGrading(questionId);
        String normalizedAnswer = questionInfo.normalizeSubmissionOnSave(answer, teamId);

        // Check for existing submission
        var existingSubmission = submissionRepository.findByTeamIdAndQuestionId(teamId, questionId);
        
        if (existingSubmission.isPresent()) {
            // Update existing submission (answer change allowed)
            Submission submission = existingSubmission.get();
            submission.setSubmittedAnswer(normalizedAnswer);
            submission.setGraded(false);
            submission.setCorrect(false);
            submission.setAwardedPoints(0);
            return submissionRepository.save(submission);
        }

        // Create new submission (don't grade yet - wait for timer)
        Submission submission = new Submission(teamId, questionId, normalizedAnswer);
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
        gradeSubmission(submission, questionInfo);

        // Update team score if correct
        if (submission.isCorrect()) {
            teamFacade.addPoints(teamId, submission.getAwardedPoints());
        }

        submission = submissionRepository.save(submission);

        eventPublisher.publishEvent(new SubmissionGradedEvent(
            submission.getId(),
            submission.getTeamId(),
            submission.getQuestionId(),
            submission.isCorrect(),
            submission.getAwardedPoints()
        ));

        return submission;
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

    /**
     * Find a submission by team and question IDs.
     */
    public Optional<Submission> findByTeamAndQuestion(Long teamId, Long questionId) {
        return submissionRepository.findByTeamIdAndQuestionId(teamId, questionId);
    }

    /**
     * Grade a submission for a team/question using the provided correct answer and points.
     * Does NOT update team score — that is the caller's responsibility via TeamFacade.
     */
    public Submission gradeSubmission(Long teamId, Long questionId, QuestionInfoDto questionInfo) {
        Submission submission = submissionRepository.findByTeamIdAndQuestionId(teamId, questionId)
                .orElseThrow(() -> new EntityNotFoundException("Submission", 0L));
        if (!submission.isGraded()) {
            gradeSubmission(submission, questionInfo);
            submission = submissionRepository.save(submission);

            eventPublisher.publishEvent(new SubmissionGradedEvent(
                submission.getId(),
                submission.getTeamId(),
                submission.getQuestionId(),
                submission.isCorrect(),
                submission.getAwardedPoints()
            ));
        }
        return submission;
    }

    private void gradeSubmission(Submission submission, QuestionInfoDto questionInfo) {
        boolean correct = questionInfo.isCorrectSubmission(
                submission.getSubmittedAnswer(), submission.getTeamId());
        submission.setCorrect(correct);
        submission.setAwardedPoints(correct ? questionInfo.points() : 0);
        submission.setGraded(true);
    }

    /**
     * Clears all submissions for every question in the given quiz.
     * This is used when starting a fresh live run so prior attempts don't leak into a new session.
     */
    public void clearSubmissionsForQuiz(Long quizId) {
        if (!quizFacade.quizExists(quizId)) {
            throw new EntityNotFoundException("Quiz", quizId);
        }

        List<QuestionInfoDto> questions = quizFacade.getOrderedQuestions(quizId);
        for (QuestionInfoDto question : questions) {
            submissionRepository.deleteByQuestionId(question.id());
        }
    }
}
