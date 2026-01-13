package com.intelliquiz.api.application.services;

import com.intelliquiz.api.domain.entities.Question;
import com.intelliquiz.api.domain.entities.Submission;
import com.intelliquiz.api.domain.entities.Team;
import com.intelliquiz.api.domain.exceptions.DuplicateSubmissionException;
import com.intelliquiz.api.domain.exceptions.EntityNotFoundException;
import com.intelliquiz.api.domain.ports.QuestionRepository;
import com.intelliquiz.api.domain.ports.SubmissionRepository;
import com.intelliquiz.api.domain.ports.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Application service for submission operations.
 * Handles answer submission with duplicate checking and grading.
 */
@Service
@Transactional
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final TeamRepository teamRepository;
    private final QuestionRepository questionRepository;

    public SubmissionService(SubmissionRepository submissionRepository,
                              TeamRepository teamRepository,
                              QuestionRepository questionRepository) {
        this.submissionRepository = submissionRepository;
        this.teamRepository = teamRepository;
        this.questionRepository = questionRepository;
    }

    /**
     * Submits an answer for a team to a question.
     * If a submission already exists, updates it (allows answer changes until timer expires).
     * Does NOT grade immediately - grading happens when timer expires.
     */
    public Submission submitAnswer(Long teamId, Long questionId, String answer) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team", teamId));
        
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));

        // Check for existing submission
        var existingSubmission = submissionRepository.findByTeamAndQuestion(team, question);
        
        if (existingSubmission.isPresent()) {
            // Update existing submission (answer change allowed)
            Submission submission = existingSubmission.get();
            submission.setSubmittedAnswer(answer);
            submission.setGraded(false); // Reset grading for new answer
            return submissionRepository.save(submission);
        }

        // Create new submission (don't grade yet - wait for timer)
        Submission submission = new Submission(team, question, answer);
        submission.validateSubmittedAt();
        
        team.addSubmission(submission);
        teamRepository.save(team);
        
        return submissionRepository.save(submission);
    }

    /**
     * Submits an answer with immediate grading (legacy behavior).
     * Use submitAnswer() for WebSocket flow where grading happens on timer expiry.
     * 
     * @throws DuplicateSubmissionException if the team has already submitted for this question
     */
    public Submission submitAnswerWithGrading(Long teamId, Long questionId, String answer) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team", teamId));
        
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));

        // Check for duplicate submission
        if (submissionRepository.findByTeamAndQuestion(team, question).isPresent()) {
            throw new DuplicateSubmissionException(
                    "Team " + team.getName() + " has already submitted an answer for this question");
        }

        // Create and grade the submission
        Submission submission = new Submission(team, question, answer);
        submission.validateSubmittedAt();
        submission.grade();
        
        team.addSubmission(submission);
        teamRepository.save(team);
        
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
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team", teamId));
        return submissionRepository.findByTeam(team);
    }

    /**
     * Gets all submissions for a question.
     */
    public List<Submission> getSubmissionsByQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));
        return submissionRepository.findByQuestion(question);
    }

    /**
     * Checks if a team has already submitted for a question.
     */
    public boolean hasSubmitted(Long teamId, Long questionId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team", teamId));
        
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));
        
        return submissionRepository.findByTeamAndQuestion(team, question).isPresent();
    }

    /**
     * Counts how many teams have submitted for a question.
     */
    public int countSubmissionsForQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));
        return submissionRepository.findByQuestion(question).size();
    }

    /**
     * Checks if all teams in a quiz have submitted for a question.
     */
    public boolean haveAllTeamsSubmitted(Long quizId, Long questionId, int totalTeams) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));
        int submissionCount = submissionRepository.findByQuestion(question).size();
        return submissionCount >= totalTeams;
    }
}
