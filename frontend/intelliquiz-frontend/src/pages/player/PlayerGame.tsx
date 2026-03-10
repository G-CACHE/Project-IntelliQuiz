import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getParticipantSession } from '../../services/sessionStorage';
import Timer from '../../components/game/Timer';
import QuestionDisplay from '../../components/game/QuestionDisplay';
import ScoreboardDisplay from '../../components/game/ScoreboardDisplay';
import AntiCheatWrapper from '../../components/game/AntiCheatWrapper';
import QuestionPalette from '../../components/game/QuestionPalette';
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

  // WebSocket connection - pass teamCode as accessCode for authentication
  const {
    connected,
    error,
    gameState,
    currentQuestion,
    questionNumber,
    totalQuestions,
    timeRemaining,
    rankings,
    kicked,
    kickReason,
    submitAnswer,
    reconnect,
    reportViolation,
    navigateToQuestion,
  } = useWebSocket(
    session?.quizId || 0,
    'PARTICIPANT',
    session?.teamId,
    session?.teamName,
    session?.teamCode  // accessCode for WebSocket authentication
  );

  // TODO: detect navigation mode from game state message; for now check URL param
  const isNonLinear = searchParams.get('mode') === 'NON_LINEAR';

  // Redirect to login if no session
  useEffect(() => {
    if (!session) {
      navigate('/participant/login');
    }
  }, [session, navigate]);

  // Reset state when question changes
  useEffect(() => {
    if (questionNumber !== lastQuestionNumber) {
      setSelectedOption(null);
      setSubmitted(false);
      setIsCorrect(null);
      setLastQuestionNumber(questionNumber);
    }
  }, [questionNumber, lastQuestionNumber]);

  // Also reset selection state whenever gameState transitions to QUESTION
  // This catches edge cases where questionNumber hasn't updated yet
  useEffect(() => {
    if (gameState === 'QUESTION') {
      setSubmitted(false);
      setIsCorrect(null);
    }
  }, [gameState]);

  // Redirect if kicked
  useEffect(() => {
    if (kicked) {
      navigate(`/player/terminated?reason=${encodeURIComponent(kickReason || 'Removed by proctor')}`);
    }
  }, [kicked, kickReason, navigate]);

  // Navigate to final scoreboard — show inline instead of navigating away
  // (Removed: we now render FINAL_RESULTS inline in this component)

  // Check if answer was correct when answer is revealed
  useEffect(() => {
    if (gameState === 'ANSWER_REVEAL' && currentQuestion?.correctAnswer) {
      if (selectedOption) {
        setIsCorrect(selectedOption === currentQuestion.correctAnswer);
      } else if (!submitted) {
        setIsCorrect(null); // No answer submitted
      }
    }
  }, [gameState, currentQuestion?.correctAnswer, selectedOption, submitted]);

  // Auto-submit when timer expires (LINEAR mode only)
  useEffect(() => {
    if (!isNonLinear && gameState === 'QUESTION' && timeRemaining <= 0 && !submitted && currentQuestion && session) {
      if (selectedOption) {
        // Auto-submit selected answer
        submitAnswer({
          teamId: session.teamId,
          questionId: currentQuestion.id,
          selectedOption,
        });
      }
      setSubmitted(true);
    }
  }, [isNonLinear, gameState, timeRemaining, submitted, currentQuestion, session, selectedOption, submitAnswer]);

  // Handle option selection — click to select/change freely (submitted on timer expiry in LINEAR mode)
  const handleSelectOption = useCallback((option: string) => {
    if (!submitted && gameState === 'QUESTION') {
      setSelectedOption(option);
      // In NON_LINEAR mode, no auto-submit; user must explicitly click Submit
      // In LINEAR mode, selection is stored and auto-submitted when timer expires
    }
  }, [submitted, gameState]);

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (selectedOption && !submitted && currentQuestion && session && (isNonLinear || timeRemaining > 0)) {
      submitAnswer({
        teamId: session.teamId,
        questionId: currentQuestion.id,
        selectedOption,
      });
      setSubmitted(true);
      // Track answered questions for NON_LINEAR mode
      if (isNonLinear) {
        setAnsweredQuestions(prev => {
          const next = new Set(prev);
          next.add(questionNumber);
          return next;
        });
      }
    }
  }, [selectedOption, submitted, currentQuestion, session, timeRemaining, submitAnswer, isNonLinear, questionNumber]);

  // Handle NON_LINEAR question navigation
  const handleNavigate = useCallback((questionIndex: number) => {
    navigateToQuestion(questionIndex);
    setSelectedOption(null);
    setSubmitted(false);
    setIsCorrect(null);
  }, [navigateToQuestion]);

  // Block submission when timer expires (NON_LINEAR has no per-question timer)
  const canSubmit = !submitted && selectedOption && (isNonLinear || timeRemaining > 0) && gameState === 'QUESTION';

  // Find current team score from rankings
  const myTeamScore = rankings.find(r => r.teamId === session?.teamId)?.score;

  if (!session) return null;

  return (
    <AntiCheatWrapper onViolation={reportViolation} enabled={gameState === 'QUESTION'}>
    <div className="participant-page participant-game-page">
      {/* Sticky Header */}
      <div className="participant-game-header">
        <div className="participant-game-header-content">
          <div className="participant-game-header-left">
            <p className="participant-game-question-info">
              Q{questionNumber}/{totalQuestions}
            </p>
            <p className="participant-game-team-name">{session.teamName}</p>
          </div>
          
          <div className="participant-game-header-right">
            {/* Score Display */}
            {myTeamScore !== undefined && (
              <span style={{
                fontWeight: 700,
                fontSize: '14px',
                color: '#f59e0b',
                marginRight: '12px',
              }}>
                {myTeamScore} pts
              </span>
            )}
            
            {/* Connection Status */}
            <span className={`participant-status-dot ${connected ? 'participant-status-connected' : 'participant-status-disconnected'}`}></span>
            
            {/* Timer — only show during active question, not buffer */}
            {gameState === 'QUESTION' && (
              <div className="participant-timer-container">
                <Timer 
                  timeRemaining={timeRemaining} 
                  totalTime={currentQuestion?.timeLimit || 30}
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
          {isNonLinear && gameState === 'QUESTION' && (
            <div style={{ marginBottom: '16px' }}>
              <QuestionPalette
                totalQuestions={totalQuestions}
                currentQuestion={questionNumber}
                answeredQuestions={answeredQuestions}
                onNavigate={handleNavigate}
              />
            </div>
          )}

          {/* QUESTION State */}
          {gameState === 'QUESTION' && currentQuestion && (
            <>
              <QuestionDisplay
                question={currentQuestion}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                selectedOption={selectedOption}
                onSelectOption={handleSelectOption}
                disabled={submitted || (!isNonLinear && timeRemaining <= 0)}
              />

              {/* Submit Section */}
              <div className="participant-submit-section">
                {isNonLinear ? (
                  // NON_LINEAR mode: explicit submit button
                  !submitted ? (
                    <>
                      <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={`participant-btn-primary participant-btn-large ${!canSubmit ? 'participant-btn-disabled' : ''}`}
                      >
                        Submit Answer
                      </button>
                      {selectedOption && (
                        <p className="participant-submit-hint">
                          Click to lock in your answer
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="participant-alert-success participant-submitted-alert">
                      <div className="participant-submitted-icon">✓</div>
                      <span className="participant-submitted-text">Answer Submitted!</span>
                      <p className="participant-submitted-hint">Waiting for results...</p>
                    </div>
                  )
                ) : (
                  // LINEAR mode: select answer, auto-submitted on timer expiry
                  submitted ? (
                    <div className="participant-alert-success participant-submitted-alert">
                      <div className="participant-submitted-icon">✓</div>
                      <span className="participant-submitted-text">Answer Submitted!</span>
                      <p className="participant-submitted-hint">Waiting for results...</p>
                    </div>
                  ) : selectedOption ? (
                    <p className="participant-submit-hint" style={{ textAlign: 'center', color: '#10b981', marginTop: '16px', fontWeight: 600 }}>
                      ✓ Selected — you can change your answer before time runs out
                    </p>
                  ) : (
                    <p className="participant-submit-hint" style={{ textAlign: 'center', color: '#6b7280', marginTop: '16px' }}>
                      Tap an answer to select it
                    </p>
                  )
                )}
              </div>
            </>
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
                fontSize: '72px',
                fontWeight: 900,
                color: '#f59e0b',
                margin: '24px 0',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {timeRemaining > 0 ? timeRemaining : '...'}
              </div>
              
              <p className="participant-buffer-hint">The first question will appear shortly.</p>
            </div>
          )}

          {/* ANSWER_REVEAL State */}
          {gameState === 'ANSWER_REVEAL' && currentQuestion && (
            <div>
              {/* Result Banner */}
              <div className={`participant-result-banner ${
                isCorrect === true ? 'participant-result-correct' : 
                isCorrect === false ? 'participant-result-incorrect' : 
                'participant-result-none'
              }`}>
                {isCorrect === true && (
                  <>
                    <div className="participant-result-icon">✓</div>
                    <h2 className="participant-result-title">Correct!</h2>
                    <p className="participant-result-points">+{currentQuestion.points} points</p>
                  </>
                )}
                {isCorrect === false && (
                  <>
                    <div className="participant-result-icon">✗</div>
                    <h2 className="participant-result-title">Incorrect</h2>
                    <p className="participant-result-hint">Better luck next time!</p>
                  </>
                )}
                {isCorrect === null && !submitted && (
                  <>
                    <div className="participant-result-icon">⏱</div>
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
              />

              <div className="participant-waiting-message">
                <p>Waiting for scoreboard...</p>
              </div>
            </div>
          )}

          {/* SCOREBOARD / ROUND_SUMMARY State */}
          {(gameState === 'SCOREBOARD' || gameState === 'ROUND_SUMMARY') && (
            <div>
              <ScoreboardDisplay
                rankings={rankings}
                highlightTeamId={session.teamId}
                isFinal={false}
              />
              <div className="participant-waiting-message">
                <p>Waiting for next question...</p>
              </div>
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
              <div style={{
                fontSize: '64px',
                marginBottom: '16px',
              }}>⏸️</div>
              <h2 className="participant-buffer-title">Quiz Paused</h2>
              <p className="participant-buffer-text">Waiting for the host to resume...</p>
            </div>
          )}

          {/* FINAL_RESULTS / ENDED State */}
          {gameState === 'FINAL_RESULTS' && (
            <div style={{ textAlign: 'center' }}>
              {/* Celebration Header */}
              <div style={{
                padding: '32px 0 24px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%)',
                borderRadius: '16px',
                marginBottom: '24px',
                color: '#fff',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉🏆🎉</div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Quiz Complete!</h2>
                <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>
                  Great job, everyone!
                </p>
              </div>

              {/* Player's Own Result Card */}
              {(() => {
                const myResult = rankings.find(r => r.teamId === session?.teamId);
                return myResult ? (
                  <div style={{
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    border: '2px solid #f59e0b',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
                  }}>
                    <p style={{ fontSize: '14px', color: '#92400e', fontWeight: 600, margin: '0 0 4px' }}>
                      Your Result
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 900, color: '#78350f', margin: '0 0 4px' }}>
                      #{myResult.rank}
                    </p>
                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#92400e', margin: 0 }}>
                      {myResult.score} points
                    </p>
                  </div>
                ) : null;
              })()}

              <ScoreboardDisplay
                rankings={rankings}
                highlightTeamId={session.teamId}
                isFinal={true}
              />

              {/* Exit Button */}
              <button
                onClick={() => navigate('/participant/login')}
                style={{
                  marginTop: '24px',
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#fff',
                  backgroundColor: '#6366f1',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                }}
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </AntiCheatWrapper>
  );
};

export default PlayerGame;
