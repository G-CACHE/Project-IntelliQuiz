import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleX, AlarmClock, ListChecks, Home, Trophy, Award, BarChart3, PauseCircle } from 'lucide-react';
import { useSSE } from '../../hooks/useSSE';
import { getParticipantSession } from '../../services/sessionStorage';
import { quizResultsApi, type ParticipantQuestionResult } from '../../services/api';
import Timer from '../../components/game/Timer';
import QuestionDisplay from '../../components/game/QuestionDisplay';
import ScoreboardDisplay from '../../components/game/ScoreboardDisplay';
import AntiCheatWrapper from '../../components/game/AntiCheatWrapper';
import QuestionPalette from '../../components/game/QuestionPalette';
import RoundAnnouncementModal from '../../components/game/RoundAnnouncementModal';
import { ConfettiCanvas, ErrorParticles } from '../../components/game/ResultEffects';
import '../../styles/participant.css';

const PlayerGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Local state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [lastQuestionNumber, setLastQuestionNumber] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [earlySubmittedQuiz, setEarlySubmittedQuiz] = useState(false);
  const [submittingEarly, setSubmittingEarly] = useState(false);
  const [showEarlySubmitConfirm, setShowEarlySubmitConfirm] = useState(false);
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [questionReview, setQuestionReview] = useState<ParticipantQuestionResult[]>([]);
  const [showRoundAnnouncement, setShowRoundAnnouncement] = useState(false);

  // Get session data
  const [session] = useState(() => {
    const stored = getParticipantSession();
    if (stored) return stored;
    
    const quizId = searchParams.get('quizId');
    const teamId = searchParams.get('teamId');
    const teamName = searchParams.get('teamName');
    
    if (quizId && teamId) {
      return {
        quizId: parseInt(quizId),
        teamId: parseInt(teamId),
        teamName: teamName || 'Team',
        teamCode: '',
      };
    }
    return null;
  });

  const getEarlySubmitKey = useCallback(() => {
    if (!session) return null;
    return `early-submitted:${session.quizId}:${session.teamId}`;
  }, [session]);

  // WebSocket connection - pass teamCode as accessCode for authentication
  const {
    connected,
    error,
    gameState,
    participantNavigationEnabled,
    currentQuestion,
    currentRound,
    questionNumber,
    totalQuestions,
    timeRemaining,
    timerTotalTime,
    rankings,
    kicked,
    kickReason,
    isNavigating,
    submitAnswer,
    reconnect,
    reportViolation,
    navigateToQuestion,
  } = useSSE(
    session?.quizId || 0,
    'PARTICIPANT',
    session?.teamId,
    session?.teamCode
  );

  // CLASS mode (participant-paced) is controlled by backend SSE flag.
  const canNavigate = participantNavigationEnabled;

  // Redirect to login if no session
  useEffect(() => {
    if (!session) {
      navigate('/participant/login');
    }
  }, [session, navigate]);

  useEffect(() => {
    const key = getEarlySubmitKey();
    if (!key) return;
    if (sessionStorage.getItem(key) === '1') {
      setEarlySubmittedQuiz(true);
    }
  }, [getEarlySubmitKey]);

  // Reset state when question changes
  useEffect(() => {
    if (questionNumber !== lastQuestionNumber) {
      const questionId = Number(currentQuestion?.id ?? 0);
      // Only restore cached answers in participant-navigated mode.
      setSelectedOption(canNavigate && questionId > 0 ? (selectedAnswers[questionId] ?? null) : null);
      if (!canNavigate) {
        setSubmitted(false);
      }
      setIsCorrect(null);
      setLastQuestionNumber(questionNumber);
    }
  }, [questionNumber, lastQuestionNumber, currentQuestion?.id, selectedAnswers, canNavigate]);

  // Also reset selection state whenever gameState transitions to QUESTION
  // This catches edge cases where questionNumber hasn't updated yet
  useEffect(() => {
    if (gameState === 'QUESTION') {
      if (!canNavigate) {
        setSubmitted(false);
      }
      setIsCorrect(null);
    }
  }, [gameState, canNavigate]);

  // Safety reset: if a new active question is running and timer has started, clear stale submitted lock.
  useEffect(() => {
    if (!canNavigate && gameState === 'QUESTION' && timeRemaining > 0) {
      setSubmitted(false);
    }
  }, [canNavigate, gameState, timeRemaining, currentQuestion?.id]);

  // Redirect if kicked
  useEffect(() => {
    if (kicked) {
      navigate(`/player/terminated?reason=${encodeURIComponent(kickReason || 'Removed by proctor')}`);
    }
  }, [kicked, kickReason, navigate]);

  const handleShowAnswers = useCallback(async () => {
    if (!session) return;
    try {
      setReviewLoading(true);
      setReviewError(null);
      const results = await quizResultsApi.getParticipantResults(session.quizId, session.teamId);
      setQuestionReview(results);
      setShowAnswersModal(true);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to load quiz answers');
    } finally {
      setReviewLoading(false);
    }
  }, [session]);

  // Navigate to final scoreboard — show inline instead of navigating away
  // (Removed: we now render FINAL_RESULTS inline in this component)

  // Use server-graded reveal result so correctness matches persisted score.
  useEffect(() => {
    if (gameState === 'ANSWER_REVEAL' && currentQuestion?.correctAnswer) {
      if (currentQuestion.type === 'IDENTIFICATION') {
        setIsCorrect(null);
      } else {
        const myResult = rankings.find((r: any) => r.teamId === session?.teamId);
        if (myResult && typeof myResult.isCorrect === 'boolean') {
          setIsCorrect(myResult.isCorrect);
        } else if (!submitted) {
          setIsCorrect(null); // No answer submitted
        }
      }
    }
  }, [gameState, currentQuestion?.correctAnswer, currentQuestion?.type, rankings, session?.teamId, submitted]);

  const myRevealResult = rankings.find((r: any) => r.teamId === session?.teamId);
  const revealPoints = typeof myRevealResult?.pointsEarned === 'number'
    ? myRevealResult.pointsEarned
    : (isCorrect ? currentQuestion?.points ?? 0 : 0);

  // Auto-submit when timer expires (LINEAR mode only)
  useEffect(() => {
    if (!canNavigate && gameState === 'QUESTION' && timerTotalTime > 0 && timeRemaining <= 0 && !submitted && currentQuestion && session) {
      const hasAnswer = typeof selectedOption === 'string' && selectedOption.trim().length > 0;

      // Tournament mode fallback: submit typed identification answer at timeout.
      if (hasAnswer && currentQuestion.type === 'IDENTIFICATION') {
        submitAnswer({
          teamId: session.teamId,
          questionId: currentQuestion.id,
          selectedOption,
        });
      }

      // Only show "Answer Submitted" when an answer actually exists.
      if (hasAnswer) {
        setSubmitted(true);
      } else {
        setSubmitted(false);
      }
    }
  }, [canNavigate, gameState, timeRemaining, timerTotalTime, submitted, currentQuestion, session, selectedOption, submitAnswer]);

  // Show round announcement when BUFFER state is received
  useEffect(() => {
    if (gameState === 'BUFFER' && currentRound) {
      setShowRoundAnnouncement(true);
      return;
    }
    setShowRoundAnnouncement(false);
  }, [gameState, currentRound]);

  // Handle option selection — click to select/change freely (submitted on timer expiry in LINEAR mode)
  const handleSelectOption = useCallback((option: string) => {
    if (gameState !== 'QUESTION' || earlySubmittedQuiz) {
      return;
    }

    if (canNavigate) {
      if (!currentQuestion || !session || timeRemaining <= 0) {
        return;
      }

      setSelectedOption(option);
      const questionId = Number(currentQuestion.id);
      setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
      setAnsweredQuestions((prev) => {
        const next = new Set(prev);
        next.add(questionNumber);
        return next;
      });

      // Class mode autosaves immediately while timer is running.
      submitAnswer({
        teamId: session.teamId,
        questionId,
        selectedOption: option,
      });
      return;
    }

    if (!submitted) {
      // Tournament mode: persist updates immediately (including identification typing).
      setSelectedOption(option);
      if (currentQuestion && session && timeRemaining > 0) {
        void submitAnswer({
          teamId: session.teamId,
          questionId: Number(currentQuestion.id),
          selectedOption: option,
        });
      }
    }
  }, [submitted, gameState, earlySubmittedQuiz, canNavigate, currentQuestion, session, timeRemaining, submitAnswer, questionNumber]);

  const handleEarlySubmitQuiz = useCallback(async () => {
    if (!canNavigate || earlySubmittedQuiz || !session) {
      return;
    }

    try {
      setShowEarlySubmitConfirm(false);
      setSubmittingEarly(true);
      if (currentQuestion) {
        const questionId = Number(currentQuestion.id);
        const fallbackAnswer = selectedAnswers[questionId] ?? selectedOption ?? '';
        const response = await submitAnswer({
          teamId: session.teamId,
          questionId,
          selectedOption: fallbackAnswer,
        });
        if (response?.status === 'rejected') {
          return;
        }
      }
      setEarlySubmittedQuiz(true);
      const key = getEarlySubmitKey();
      if (key) {
        sessionStorage.setItem(key, '1');
      }
    } finally {
      setSubmittingEarly(false);
    }
  }, [canNavigate, earlySubmittedQuiz, session, currentQuestion, selectedAnswers, selectedOption, submitAnswer, getEarlySubmitKey]);

  const handleOpenEarlySubmitConfirm = useCallback(() => {
    if (!canNavigate || earlySubmittedQuiz || submittingEarly || timeRemaining <= 0) {
      return;
    }
    setShowEarlySubmitConfirm(true);
  }, [canNavigate, earlySubmittedQuiz, submittingEarly, timeRemaining]);

  // Handle NON_LINEAR question navigation
  const handleNavigate = useCallback((questionIndex: number) => {
    if (earlySubmittedQuiz) {
      return;
    }
    navigateToQuestion(questionIndex);
    if (!canNavigate) {
      setSelectedOption(null);
      setSubmitted(false);
    }
    setIsCorrect(null);
  }, [navigateToQuestion, canNavigate, earlySubmittedQuiz]);

  // Find current team score from rankings
  const myTeamScore = rankings.find((r: any) => r.teamId === session?.teamId)?.score;
  const myFinalResult = rankings.find((r: any) => r.teamId === session?.teamId);
  const classTimerExpired = canNavigate && timerTotalTime > 0 && timeRemaining <= 0;

  if (!session) return null;

  return (
    <AntiCheatWrapper onViolation={reportViolation} enabled={gameState === 'QUESTION' && !earlySubmittedQuiz}>
    <div className="participant-page participant-game-page">
      {/* Visual Effects */}
      {gameState === 'ANSWER_REVEAL' && isCorrect === true && <ConfettiCanvas />}
      {gameState === 'ANSWER_REVEAL' && isCorrect === false && <ErrorParticles />}

      <RoundAnnouncementModal 
        isVisible={showRoundAnnouncement}
        roundName={currentRound || ''}
        message={`Waiting for host to start ${currentRound || 'next'} round...`}
        manualStart
        manualStartLabel="Waiting for host..."
      />
      {/* Sticky Header */}
      <div className="participant-game-header">
        <div className="participant-game-header-content">
          <div className="participant-game-header-left">
            <p className="participant-game-question-info participant-game-progress-chip">
              Q{questionNumber}/{totalQuestions}
            </p>
            <p className="participant-game-team-name">{session.teamName}</p>
          </div>
          
          <div className="participant-game-header-right">
            {/* Score Display */}
            {myTeamScore !== undefined && (
              <span className="participant-game-score-chip">
                <span className="participant-game-score-chip-label">SCORE</span>
                <span className="participant-game-score-chip-value">{myTeamScore}</span>
              </span>
            )}
            
            {/* Connection Status */}
            <span className={`participant-status-dot ${connected ? 'participant-status-connected' : 'participant-status-disconnected'}`}></span>
            
            {/* Timer — only show during active question, not buffer */}
            {gameState === 'QUESTION' && (
              <div className={`participant-timer-container ${
                timeRemaining <= 3 ? 'participant-timer-critical' : 
                timeRemaining <= 5 ? 'participant-timer-low' : ''
              }`}>
                <Timer 
                  timeRemaining={timeRemaining} 
                  totalTime={canNavigate ? (timerTotalTime || 1) : (currentQuestion?.timeLimit || 30)}
                  displayMode={canNavigate ? 'clock' : 'seconds'}
                  large
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="participant-error-banner">
          <div className="participant-error-content">
            <p>{error}</p>
            <button onClick={reconnect} className="participant-btn-danger participant-btn-small">
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="participant-game-content">
        <div className="participant-container">
          {/* NON_LINEAR Question Palette */}
          {canNavigate && gameState === 'QUESTION' && !earlySubmittedQuiz && (
            <div className="participant-palette-wrap">
              <QuestionPalette
                totalQuestions={totalQuestions}
                currentQuestion={questionNumber}
                answeredQuestions={answeredQuestions}
                onNavigate={handleNavigate}
                disabled={isNavigating}
              />
            </div>
          )}

          {/* QUESTION State */}
          {gameState === 'QUESTION' && currentQuestion && (
            earlySubmittedQuiz ? (
              <div className="participant-alert-success participant-submitted-alert" style={{ marginTop: '12px' }}>
                <div className="participant-submitted-icon"><CheckCircle2 size={18} /></div>
                <span className="participant-submitted-text">Quiz Submitted Early</span>
                <p className="participant-submitted-hint">Your participation is complete. Waiting for final results...</p>
              </div>
            ) : (
              <>
                <QuestionDisplay
                  question={currentQuestion}
                  questionNumber={questionNumber}
                  totalQuestions={totalQuestions}
                  selectedOption={selectedOption}
                  onSelectOption={handleSelectOption}
                  disabled={submitted || (!canNavigate && timeRemaining <= 0)}
                  variant="participant"
                />

                {/* Navigation Buttons for Participant-Navigated Quiz */}
                {canNavigate && (
                  <div className="participant-navigation-section">
                    <button
                      onClick={() => handleNavigate(questionNumber - 2)}
                      disabled={questionNumber <= 1 || isNavigating}
                      className={`participant-btn-secondary participant-btn-nav participant-btn-prev ${(questionNumber <= 1 || isNavigating) ? 'participant-btn-disabled' : ''}`}
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => handleNavigate(questionNumber)}
                      disabled={questionNumber >= totalQuestions || isNavigating}
                      className={`participant-btn-secondary participant-btn-nav participant-btn-next ${(questionNumber >= totalQuestions || isNavigating) ? 'participant-btn-disabled' : ''}`}
                    >
                      Next →
                    </button>
                  </div>
                )}

                {/* Submit Section */}
                <div className="participant-submit-section">
                  {canNavigate ? (
                    // Class mode: autosave on every selection + optional early quiz submit.
                    <>
                      <button
                        onClick={handleOpenEarlySubmitConfirm}
                        disabled={submittingEarly || timeRemaining <= 0}
                        className={`participant-btn-primary participant-btn-large ${(submittingEarly || timeRemaining <= 0) ? 'participant-btn-disabled' : ''}`}
                      >
                        {submittingEarly ? 'Submitting...' : 'Submit Quiz Early'}
                      </button>
                      <p className="participant-submit-hint">
                        Answers are saved instantly. You can still change answers until time runs out.
                      </p>
                    </>
                  ) : (
                    // LINEAR mode: select answer, auto-submitted on timer expiry
                    submitted ? (
                      <div className="participant-alert-success participant-submitted-alert">
                        <div className="participant-submitted-icon"><CheckCircle2 size={18} /></div>
                        <span className="participant-submitted-text">Answer Submitted!</span>
                        <p className="participant-submitted-hint">Waiting for results...</p>
                      </div>
                    ) : selectedOption ? (
                      <p className="participant-submit-hint" style={{ textAlign: 'center', color: '#7a1733', marginTop: '16px', fontWeight: 700 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          Your answer is recorded — you can change it until time runs out
                        </span>
                      </p>
                    ) : (
                      <p className="participant-submit-hint" style={{ textAlign: 'center', color: '#6b7280', marginTop: '16px' }}>
                        Tap an answer to select it
                      </p>
                    )
                  )}
                </div>
              </>
            )
          )}

          {/* BUFFER State */}
          {gameState === 'BUFFER' && (
            <div className="participant-buffer-state">
              <div className="participant-loading-spinner participant-spinner-large"></div>
              <h2 className="participant-buffer-title">Get Ready!</h2>
              <p className="participant-buffer-text">
                The quiz is about to begin...
              </p>
              
              {/* Prominent countdown */}
              <div style={{
                fontVariantNumeric: 'tabular-nums'
              }}>
                <span className="participant-buffer-countdown">{timeRemaining > 0 ? timeRemaining : '...'}</span>
              </div>
              
              <p className="participant-buffer-hint">The first question will appear shortly.</p>
            </div>
          )}

          {/* ANSWER_REVEAL State */}
          {(gameState === 'REVEAL' || gameState === 'ANSWER_REVEAL') && currentQuestion && (
            <div>
              {/* Result Banner */}
              <div className={`participant-result-banner ${
                isCorrect === true ? 'participant-result-correct' : 
                isCorrect === false ? 'participant-result-incorrect' : 
                'participant-result-none'
              }`}>
                {isCorrect === true && (
                  <>
                    <div className="participant-result-icon" aria-hidden="true">
                      <CheckCircle2 className="participant-result-icon-svg" />
                    </div>
                    <h2 className="participant-result-title">Correct!</h2>
                    <p className="participant-result-points">+{revealPoints} points</p>
                  </>
                )}
                {isCorrect === false && (
                  <>
                    <div className="participant-result-icon" aria-hidden="true">
                      <CircleX className="participant-result-icon-svg" />
                    </div>
                    <h2 className="participant-result-title">Incorrect</h2>
                    <p className="participant-result-hint">Better luck next time!</p>
                    {currentQuestion.correctAnswer && (
                      <p className="participant-result-correct-answer">
                        Correct answer: {currentQuestion.correctAnswer}
                      </p>
                    )}
                  </>
                )}
                {isCorrect === null && currentQuestion.type === 'IDENTIFICATION' && (
                  <>
                    <div className="participant-result-icon" aria-hidden="true">
                      <ListChecks className="participant-result-icon-svg" />
                    </div>
                    <h2 className="participant-result-title">Answer Recorded</h2>
                    <p className="participant-result-hint">Your response was checked using accepted-answer matching.</p>
                  </>
                )}
                {isCorrect === null && currentQuestion.type !== 'IDENTIFICATION' && !submitted && (
                  <>
                    <div className="participant-result-icon" aria-hidden="true">
                      <AlarmClock className="participant-result-icon-svg" />
                    </div>
                    <h2 className="participant-result-title">No Answer</h2>
                    <p className="participant-result-hint">You didn't submit an answer</p>
                  </>
                )}
              </div>

              {/* Question with correct answer highlighted */}
              <QuestionDisplay
                question={currentQuestion}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                selectedOption={selectedOption}
                correctAnswer={currentQuestion.correctAnswer}
                showCorrectAnswer={true}
                disabled={true}
                variant="participant"
              />

              <div className="participant-waiting-message">
                <p>Waiting for scoreboard...</p>
              </div>
            </div>
          )}

          {/* SCOREBOARD / ROUND_SUMMARY — full leaderboard, question hidden */}
          {(gameState === 'SCOREBOARD' || gameState === 'ROUND_SUMMARY') && (
            <div>
              <ScoreboardDisplay
                rankings={rankings}
                highlightTeamId={session.teamId}
                isFinal={classTimerExpired}
                title={classTimerExpired ? 'Congratulations' : undefined}
              />
              {classTimerExpired ? (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  {canNavigate && (
                    <button
                      onClick={handleShowAnswers}
                      disabled={reviewLoading}
                      className="participant-btn-primary participant-btn-large participant-results-action"
                    >
                      {reviewLoading ? 'Loading...' : 'Show Answers'}
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/')}
                    className="participant-btn-secondary participant-btn-large participant-home-action"
                  >
                    Go Home
                  </button>
                </div>
              ) : (
                <div className="participant-waiting-message">
                  <p>Waiting for next question...</p>
                </div>
              )}
            </div>
          )}

          {/* GRADING State */}
          {gameState === 'GRADING' && (
            <div className="participant-buffer-state">
              <div className="participant-loading-spinner participant-spinner-large"></div>
              <h2 className="participant-buffer-title">Time's Up!</h2>
              <p className="participant-buffer-text">Grading answers...</p>
            </div>
          )}

          {/* REVEAL State (brief transition before ANSWER_REVEAL) */}
          {gameState === 'REVEAL' && currentQuestion && (
            <div className="participant-buffer-state">
              <div className="participant-loading-spinner participant-spinner-large"></div>
              <h2 className="participant-buffer-title">Results Coming...</h2>
            </div>
          )}

          {/* PAUSED State */}
          {gameState === 'PAUSED' && (
            <div className="participant-buffer-state">
              <div className="participant-paused-icon"><PauseCircle size={48} /></div>
              <h2 className="participant-buffer-title">Quiz Paused</h2>
              <p className="participant-buffer-text">Waiting for the host to resume...</p>
            </div>
          )}

          {/* FINAL_RESULTS / ENDED State */}
          {gameState === 'FINAL_RESULTS' && (
            <div className="participant-final-results">
              {/* Celebration Header */}
              <div className="participant-final-banner">
                <div className="participant-final-banner-icon-wrapper">
                  <Trophy className="participant-final-banner-icon" />
                </div>
                <h2 className="participant-final-banner-title">Quiz Complete!</h2>
                <p className="participant-final-banner-subtitle">
                  Great job, everyone!
                </p>
              </div>

              {/* Player's Own Result Card */}
              {myFinalResult ? (
                  <div className="participant-final-result-card">
                    <div className="participant-final-result-header">
                      <Award className="participant-final-result-icon" />
                      <p className="participant-final-result-label">Your Result</p>
                    </div>
                    <div className="participant-final-result-main">
                      <div className="participant-final-result-rank-section">
                        <span className="participant-final-result-rank-label">Rank</span>
                        <p className="participant-final-result-rank">#{myFinalResult.rank}</p>
                      </div>
                      <div className="participant-final-result-divider"></div>
                      <div className="participant-final-result-score-section">
                        <span className="participant-final-result-score-label">Score</span>
                        <p className="participant-final-result-score">{myFinalResult.score}</p>
                      </div>
                    </div>
                    <div className="participant-final-stats">
                      <div className="participant-final-stat-cell">
                        <BarChart3 size={16} className="participant-final-stat-icon" />
                        <div>
                          <span>Teams</span>
                          <strong>{rankings.length}</strong>
                        </div>
                      </div>
                      <div className="participant-final-stat-cell">
                        <ListChecks size={16} className="participant-final-stat-icon" />
                        <div>
                          <span>Questions</span>
                          <strong>{totalQuestions || 0}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

              <ScoreboardDisplay
                rankings={rankings}
                highlightTeamId={session.teamId}
                isFinal={true}
                title="Final Rankings"
              />

              {/* Exit Button */}
              <div className="participant-final-actions">
                <button
                  onClick={handleShowAnswers}
                  disabled={reviewLoading}
                  className="participant-btn-primary participant-btn-large participant-results-action"
                >
                  <ListChecks size={20} aria-hidden="true" />
                  {reviewLoading ? 'Loading...' : 'Review Answers'}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="participant-btn-secondary participant-btn-large participant-home-action"
                >
                  <Home size={20} aria-hidden="true" />
                  Go Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showEarlySubmitConfirm && (
        <div className="participant-modal-overlay" onClick={() => !submittingEarly && setShowEarlySubmitConfirm(false)}>
          <div className="participant-modal-content participant-early-submit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="participant-modal-header">
              <h3 className="participant-modal-title">Submit Quiz Early?</h3>
            </div>
            <div className="participant-modal-body">
              <p className="participant-early-submit-warning">
                After early submission, you cannot change any of your answers anymore.
              </p>
              <p className="participant-early-submit-note">
                You will stay on this page and wait until the quiz ends.
              </p>
            </div>
            <div className="participant-modal-footer">
              <button
                onClick={() => setShowEarlySubmitConfirm(false)}
                disabled={submittingEarly}
                className="participant-btn-secondary participant-btn-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEarlySubmitQuiz}
                disabled={submittingEarly}
                className="participant-btn-primary participant-btn-medium"
              >
                {submittingEarly ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnswersModal && (
        <div className="participant-modal-overlay" onClick={() => setShowAnswersModal(false)}>
          <div className="participant-answer-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="participant-answer-review-header">
              <h3 className="participant-answer-review-title">Quiz Answer Review</h3>
              <button onClick={() => setShowAnswersModal(false)} className="participant-answer-review-close">Close</button>
            </div>

            {reviewError && (
              <p className="participant-answer-review-error">{reviewError}</p>
            )}

            {questionReview.length === 0 ? (
              <p className="participant-answer-review-empty">No answer details available yet.</p>
            ) : (
              <div className="participant-answer-review-list">
                {questionReview.map((entry) => (
                  <div key={entry.questionId} className="participant-answer-review-item">
                    <p className="participant-answer-review-question">
                      Q{entry.questionNumber}. {entry.questionText}
                    </p>
                    <p className="participant-answer-review-line">
                      Your answer: <strong>{entry.participantAnswer || 'No answer'}</strong>
                    </p>
                    <p className="participant-answer-review-line">
                      Correct answer: <strong>{entry.correctAnswer}</strong>
                    </p>
                    <p className={`participant-answer-review-score ${entry.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                      {entry.isCorrect ? 'Correct' : 'Incorrect'} - {entry.pointsEarned}/{entry.maxPoints} pts
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </AntiCheatWrapper>
  );
};

export default PlayerGame;
