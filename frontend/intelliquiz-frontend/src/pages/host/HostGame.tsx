import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getProctorSession } from '../../services/sessionStorage';
import Timer from '../../components/game/Timer';
import QuestionDisplay from '../../components/game/QuestionDisplay';
import ScoreboardDisplay from '../../components/game/ScoreboardDisplay';
import '../../styles/proctor.css';

const HostGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get session data
  const [session] = useState(() => {
    const stored = getProctorSession();
    if (stored) return stored;
    
    const quizId = searchParams.get('quizId');
    if (quizId) {
      return {
        quizId: parseInt(quizId),
        quizTitle: 'Quiz',
        proctorPin: '',
      };
    }
    return null;
  });

  // WebSocket connection - pass proctorPin as accessCode for authentication
  const {
    connected,
    error,
    gameState,
    currentQuestion,
    questionNumber,
    totalQuestions,
    timeRemaining,
    submissions,
    rankings,
    sendCommand,
    reconnect,
  } = useWebSocket(
    session?.quizId || 0,
    'PROCTOR',
    undefined,  // teamId (not used for proctor)
    undefined,  // teamName (not used for proctor)
    session?.proctorPin  // accessCode for WebSocket authentication
  );

  // Redirect to login if no session
  useEffect(() => {
    if (!session) {
      navigate('/proctor/login');
    }
  }, [session, navigate]);

  // Navigate to final scoreboard
  useEffect(() => {
    if (gameState === 'FINAL_RESULTS') {
      navigate(`/host/scoreboard?quizId=${session?.quizId}&final=true`);
    }
  }, [gameState, session, navigate]);

  if (!session) return null;

  // Command handlers
  const handlePause = () => sendCommand({ type: 'PAUSE' });
  const handleResume = () => sendCommand({ type: 'RESUME' });
  const handleViewLeaderboard = () => sendCommand({ type: 'VIEW_LEADERBOARD' });
  const handleNextQuestion = () => sendCommand({ type: 'NEXT_QUESTION' });
  const handleEndQuiz = () => sendCommand({ type: 'END_QUIZ' });

  // Render control buttons based on game state
  const renderControls = () => {
    switch (gameState) {
      case 'ACTIVE':
      case 'QUESTION':
        return (
          <button
            onClick={handlePause}
            disabled={!connected}
            className="proctor-btn-warning proctor-btn-large"
          >
            ⏸ Pause Quiz
          </button>
        );
      
      case 'BUFFER':
        return (
          <div className="proctor-buffer-info">
            <p>Buffer countdown in progress...</p>
            <p>Next question will start automatically</p>
          </div>
        );
      
      case 'REVEAL':
      case 'ANSWER_REVEAL':
        return (
          <div className="proctor-actions">
            <button
              onClick={handleViewLeaderboard}
              disabled={!connected}
              className="proctor-btn-primary proctor-btn-large"
            >
              📊 View Leaderboard
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={!connected}
              className="proctor-btn-success proctor-btn-large"
            >
              Next Question →
            </button>
          </div>
        );
      
      case 'ROUND_SUMMARY':
      case 'SCOREBOARD':
        return (
          <div className="proctor-actions">
            {questionNumber < totalQuestions ? (
              <button
                onClick={handleNextQuestion}
                disabled={!connected}
                className="proctor-btn-success proctor-btn-large"
              >
                Next Question →
              </button>
            ) : (
              <button
                onClick={handleEndQuiz}
                disabled={!connected}
                className="proctor-btn-primary proctor-btn-large"
              >
                🏆 End Quiz & Show Final Results
              </button>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="proctor-page proctor-game-page">
      {/* Sticky Header */}
      <div className="proctor-game-header">
        <div className="proctor-game-header-content">
          <div className="proctor-game-header-left">
            <p className="proctor-game-question-info">
              Question {questionNumber} of {totalQuestions}
            </p>
            <h1 className="proctor-game-title">{session.quizTitle}</h1>
          </div>
          
          <div className="proctor-game-header-right">
            {/* Connection Status */}
            <div className="proctor-connection-status proctor-connection-compact">
              <span className={`proctor-status-dot ${connected ? 'proctor-status-connected' : 'proctor-status-disconnected'}`}></span>
              <span className="proctor-status-text">
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            
            {/* Timer */}
            {(gameState === 'QUESTION' || gameState === 'BUFFER') && (
              <div className="proctor-timer-container">
                <Timer 
                  timeRemaining={timeRemaining} 
                  totalTime={currentQuestion?.timeLimit || 30}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="proctor-error-banner">
          <div className="proctor-error-content">
            <p>{error}</p>
            <button onClick={reconnect} className="proctor-btn-danger proctor-btn-small">
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="proctor-game-content">
        <div className="proctor-container">
          {/* ACTIVE/QUESTION State */}
          {(gameState === 'ACTIVE' || gameState === 'QUESTION') && currentQuestion && (
            <QuestionDisplay
              question={currentQuestion}
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              disabled={true}
            />
          )}

          {/* BUFFER State */}
          {gameState === 'BUFFER' && (
            <div className="proctor-buffer-state">
              <h2 className="proctor-buffer-title">Get Ready!</h2>
              <p className="proctor-buffer-subtitle">Next question starting soon...</p>
              
              {/* Timer Display */}
              <div className="proctor-timer-container proctor-timer-large">
                <Timer 
                  timeRemaining={timeRemaining} 
                  totalTime={10}
                />
              </div>
            </div>
          )}

          {/* REVEAL/ANSWER_REVEAL State */}
          {(gameState === 'REVEAL' || gameState === 'ANSWER_REVEAL') && currentQuestion && (
            <div>
              <QuestionDisplay
                question={currentQuestion}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                correctAnswer={currentQuestion.correctAnswer}
                showCorrectAnswer={true}
                disabled={true}
              />
              
              <div className="proctor-correct-answer">
                <p>Correct Answer: {currentQuestion.correctAnswer}</p>
              </div>
            </div>
          )}

          {/* ROUND_SUMMARY/SCOREBOARD State */}
          {(gameState === 'ROUND_SUMMARY' || gameState === 'SCOREBOARD') && (
            <ScoreboardDisplay
              rankings={rankings}
              isFinal={false}
            />
          )}

          {/* Controls */}
          <div className="proctor-game-controls">
            {renderControls()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostGame;
