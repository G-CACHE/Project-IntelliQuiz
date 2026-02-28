package com.intelliquiz.api.submission.internal.application.listeners;

import com.intelliquiz.api.quiz.events.QuestionDeletedEvent;
import com.intelliquiz.api.team.events.TeamRemovedEvent;
import com.intelliquiz.api.submission.internal.domain.ports.SubmissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Listens for cross-module events that require submission cleanup.
 */
@Component
public class SubmissionEventListener {

    private static final Logger logger = LoggerFactory.getLogger(SubmissionEventListener.class);
    private final SubmissionRepository submissionRepository;

    public SubmissionEventListener(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    /**
     * When a question is deleted, cascade-delete all submissions for that question.
     */
    @EventListener
    @Transactional
    public void onQuestionDeleted(QuestionDeletedEvent event) {
        logger.info("Question {} deleted — removing associated submissions", event.questionId());
        submissionRepository.deleteByQuestionId(event.questionId());
    }

    /**
     * When a team is removed, cascade-delete all submissions for that team.
     */
    @EventListener
    @Transactional
    public void onTeamRemoved(TeamRemovedEvent event) {
        logger.info("Team {} removed — removing associated submissions", event.teamId());
        submissionRepository.deleteByTeamId(event.teamId());
    }
}
