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
          <div className="proctor-actions">
            <button
              onClick={handlePause}
              disabled={!connected}
              className="proctor-btn-warning proctor-btn-large"
            >
              ⏸ Pause Quiz
            </button>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              {submissions.length} team(s) submitted
            </p>
          </div>
        );
      
      case 'PAUSED':
        return (
          <button
            onClick={handleResume}
            disabled={!connected}
            className="proctor-btn-success proctor-btn-large"
          >
            ▶ Resume Quiz
          </button>
        );
      
      case 'BUFFER':
        return (
          <div className="proctor-buffer-info">
            <p>Buffer countdown in progress...</p>
            <p>Next question will start automatically</p>
          </div>
        );
      
      case 'GRADING':
        return (
          <div className="proctor-buffer-info">
            <p>Grading answers...</p>
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
            <button
              onClick={handleNextQuestion}
              disabled={!connected}
              className="proctor-btn-success proctor-btn-large"
            >
              Next Question →
            </button>
            <button
              onClick={handleEndQuiz}
              disabled={!connected}
              className="proctor-btn-danger proctor-btn-large"
            >
              🏆 End Quiz
            </button>
          </div>
        );
      
      case 'FINAL_RESULTS':
        return (
          <div className="proctor-buffer-info">
            <p style={{ fontSize: '18px', fontWeight: 600 }}>Quiz Complete!</p>
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
            
            {/* Timer — show during active question or paused */}
            {(gameState === 'QUESTION' || gameState === 'PAUSED') && (
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
            <div className="proctor-buffer-state" style={{ textAlign: 'center', padding: '48px 0' }}>
              <h2 className="proctor-buffer-title" style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>Get Ready!</h2>
              <p className="proctor-buffer-subtitle" style={{ fontSize: '18px', color: '#374151', marginBottom: '24px' }}>Next question starting soon...</p>
              
              {/* Prominent countdown number */}
              <div style={{
                fontSize: '96px',
                fontWeight: 900,
                color: '#f59e0b',
                margin: '16px 0',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}>
                {timeRemaining > 0 ? timeRemaining : '...'}
              </div>
              
              {/* Progress bar */}
              <div style={{
                maxWidth: '400px',
                margin: '24px auto 0',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(timeRemaining / 10) * 100}%`,
                  height: '100%',
                  backgroundColor: '#f59e0b',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          )}

          {/* GRADING State */}
          {gameState === 'GRADING' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937' }}>Time's Up!</h2>
              <p style={{ fontSize: '16px', color: '#6b7280', marginTop: '8px' }}>Grading answers...</p>
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
              
              {currentQuestion.correctAnswer && (
                <div className="proctor-correct-answer">
                  <p>Correct Answer: {currentQuestion.correctAnswer}</p>
                </div>
              )}
              
              {/* Team Results Summary */}
              {rankings.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                    Results
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {rankings.slice(0, 10).map((team) => (
                      <div key={team.teamId} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 16px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <span style={{ fontWeight: 500 }}>{team.rank}. {team.teamName}</span>
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>{team.score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAUSED State */}
          {gameState === 'PAUSED' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏸️</div>
              <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#1f2937' }}>Quiz Paused</h2>
              <p style={{ fontSize: '16px', color: '#6b7280', marginTop: '12px' }}>
                The timer has been paused. Click Resume to continue.
              </p>
              {currentQuestion && (
                <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
                  Question {questionNumber} of {totalQuestions} • {timeRemaining}s remaining
                </p>
              )}
            </div>
          )}

          {/* ROUND_SUMMARY/SCOREBOARD State */}
          {(gameState === 'ROUND_SUMMARY' || gameState === 'SCOREBOARD') && (
            <ScoreboardDisplay
              rankings={rankings}
              isFinal={false}
            />
          )}

          {/* FINAL_RESULTS / ENDED State */}
          {gameState === 'FINAL_RESULTS' && (
            <div>
              {/* Celebration Header */}
              <div style={{
                textAlign: 'center',
                padding: '32px 0 24px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%)',
                borderRadius: '16px',
                marginBottom: '24px',
                color: '#fff',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉🏆🎉</div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Quiz Complete!</h2>
                <p style={{ fontSize: '16px', opacity: 0.9, marginTop: '8px' }}>
                  {rankings.length} team{rankings.length !== 1 ? 's' : ''} competed • Final standings below
                </p>
              </div>

              {/* Winner Spotlight */}
              {rankings.length > 0 && rankings[0] && (
                <div style={{
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  border: '2px solid #f59e0b',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.2)',
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '4px' }}>👑</div>
                  <p style={{ fontSize: '14px', color: '#92400e', fontWeight: 600, margin: '0 0 4px' }}>Winner</p>
                  <p style={{ fontSize: '24px', fontWeight: 900, color: '#78350f', margin: '0 0 4px' }}>
                    {rankings[0].teamName}
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#92400e', margin: 0 }}>
                    {rankings[0].score} points
                  </p>
                </div>
              )}

              <ScoreboardDisplay
                rankings={rankings}
                isFinal={true}
              />
            </div>
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