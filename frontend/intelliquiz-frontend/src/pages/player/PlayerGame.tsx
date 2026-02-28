import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getParticipantSession } from '../../services/sessionStorage';
import Timer from '../../components/game/Timer';
import QuestionDisplay from '../../components/game/QuestionDisplay';
import ScoreboardDisplay from '../../components/game/ScoreboardDisplay';
import '../../styles/participant.css';

const PlayerGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Local state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [lastQuestionNumber, setLastQuestionNumber] = useState(0);

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
    submitAnswer,
    reconnect,
  } = useWebSocket(
    session?.quizId || 0,
    'PARTICIPANT',
    session?.teamId,
    session?.teamName,
    session?.teamCode  // accessCode for WebSocket authentication
  );

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

  // Navigate to final scoreboard
  useEffect(() => {
    if (gameState === 'FINAL_RESULTS') {
      navigate(`/player/scoreboard?quizId=${session?.quizId}&teamId=${session?.teamId}&final=true`);
    }
  }, [gameState, session, navigate]);

  // Check if answer was correct when answer is revealed
  useEffect(() => {
    if (gameState === 'ANSWER_REVEAL' && currentQuestion?.correctAnswer && selectedOption) {
      setIsCorrect(selectedOption === currentQuestion.correctAnswer);
    }
  }, [gameState, currentQuestion?.correctAnswer, selectedOption]);

  // Handle option selection
  const handleSelectOption = useCallback((option: string) => {
    if (!submitted && gameState === 'QUESTION' && timeRemaining > 0) {
      setSelectedOption(option);
    }
  }, [submitted, gameState, timeRemaining]);

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (selectedOption && !submitted && currentQuestion && session && timeRemaining > 0) {
      submitAnswer({
        teamId: session.teamId,
        questionId: currentQuestion.id,
        selectedOption,
      });
      setSubmitted(true);
    }
  }, [selectedOption, submitted, currentQuestion, session, timeRemaining, submitAnswer]);

  // Block submission when timer expires
  const canSubmit = !submitted && selectedOption && timeRemaining > 0 && gameState === 'QUESTION';

  if (!session) return null;

  return (
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
            {/* Connection Status */}
            <span className={`participant-status-dot ${connected ? 'participant-status-connected' : 'participant-status-disconnected'}`}></span>
            
            {/* Timer */}
            {(gameState === 'QUESTION' || gameState === 'BUFFER') && (
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
          {/* QUESTION State */}
          {gameState === 'QUESTION' && currentQuestion && (
            <>
              <QuestionDisplay
                question={currentQuestion}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                selectedOption={selectedOption}
                onSelectOption={handleSelectOption}
                disabled={submitted || timeRemaining <= 0}
              />

              {/* Submit Button */}
              <div className="participant-submit-section">
                {!submitted ? (
                  <>
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className={`participant-btn-primary participant-btn-large ${!canSubmit ? 'participant-btn-disabled' : ''}`}
                    >
                      {timeRemaining <= 0 ? "Time's Up!" : 'Submit Answer'}
                    </button>
                    {selectedOption && timeRemaining > 0 && (
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
                )}
              </div>
            </>
          )}

          {/* BUFFER State */}
          {gameState === 'BUFFER' && (
            <div className="participant-buffer-state">
              <div className="participant-loading-spinner participant-spinner-large"></div>
              <h2 className="participant-buffer-title">Time's Up!</h2>
              <p className="participant-buffer-text">
                {submitted ? 'Your answer has been recorded.' : 'No answer submitted.'}
              </p>
              <p className="participant-buffer-hint">Waiting for the host to reveal the answer...</p>
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

          {/* SCOREBOARD State */}
          {gameState === 'SCOREBOARD' && (
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
        </div>
      </div>
    </div>
  );
};

export default PlayerGame;
