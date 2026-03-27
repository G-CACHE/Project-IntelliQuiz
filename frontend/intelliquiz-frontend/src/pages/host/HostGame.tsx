import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSSE } from '../../hooks/useSSE';
import { clearSession, getProctorSession } from '../../services/sessionStorage';
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

  // SSE connection - pass proctorPin as accessCode for authentication
  const {
    connected,
    error,
    gameState,
    participantNavigationEnabled,
    currentQuestion,
    questionNumber,
    totalQuestions,
    timeRemaining,
    timerTotalTime,
    submissions,
    rankings,
    sendCommand,
    reconnect,
  } = useSSE(
    session?.quizId || 0,
    'HOST',
    undefined,  // teamId (not used for proctor)
    session?.proctorPin  // accessCode for SSE authentication
  );
  const isClassMode = participantNavigationEnabled;

  // Redirect to login if no session
  useEffect(() => {
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  if (!session) return null;

  // Command handlers
  const handlePause = () => sendCommand({ type: 'PAUSE' });
  const handleResume = () => sendCommand({ type: 'RESUME' });
  const handleViewLeaderboard = () => sendCommand({ type: 'VIEW_LEADERBOARD' });
  const handleNextQuestion = () => sendCommand({ type: 'NEXT_QUESTION' });
  const handleEndQuiz = () => sendCommand({ type: 'END_QUIZ' });
  const handleOpenProctorMonitor = () => window.open('/proctor/dashboard', '_blank', 'noopener,noreferrer');
  const handleExitHome = () => {
    clearSession();
    navigate('/');
  };
  const isLastQuestion = totalQuestions > 0 && questionNumber >= totalQuestions;
  const gamePhaseLabel = gameState.replace(/_/g, ' ');
  const submittedTeamsCount = new Set(
    submissions
      .map((s) => Number((s as any)?.teamId ?? (s as any)?.id))
      .filter((id) => Number.isFinite(id) && id > 0)
  ).size;

  // Render control buttons based on game state
  const renderControls = () => {
    if (isClassMode && timeRemaining <= 0 && gameState !== 'BUFFER' && gameState !== 'LOBBY') {
      return (
        <button
          onClick={handleExitHome}
          className="proctor-btn-primary proctor-btn-large"
        >
          Go Home
        </button>
      );
    }

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
            <p className="proctor-host-submitted-count">
              {(submittedTeamsCount || submissions.length)} team(s) submitted
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
        if (isLastQuestion) {
          return (
            <div className="proctor-buffer-info">
              <p>Final question complete. Finalizing results...</p>
            </div>
          );
        }
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
        if (isClassMode) {
          return (
            <div className="proctor-buffer-info">
              <p>Class session summary is displayed.</p>
            </div>
          );
        }
        if (isLastQuestion) {
          return (
            <div className="proctor-buffer-info">
              <p>Final scoreboard ready.</p>
            </div>
          );
        }
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
        return null;
      
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

            <button
              onClick={handleOpenProctorMonitor}
              className="proctor-btn proctor-host-monitor-btn"
            >
              Open Proctor Monitor
            </button>
            
            {/* Timer — hide the small header timer in CLASS mode (center timer only). */}
            {(gameState === 'QUESTION' || gameState === 'PAUSED') && !isClassMode && (
              <div className="proctor-timer-container">
                <Timer 
                  timeRemaining={timeRemaining} 
                  totalTime={isClassMode ? (timerTotalTime || 1) : (currentQuestion?.timeLimit || 30)}
                  displayMode={isClassMode ? 'clock' : 'seconds'}
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
          <section className="proctor-host-stage">
            <div className="proctor-host-stage-header">
              <span className="proctor-badge proctor-badge-primary">{gamePhaseLabel}</span>
              <p>
                {isClassMode
                  ? 'Class mode session is synchronized across participants.'
                  : 'Audience mode is live. Controls and reveals are managed from this panel.'}
              </p>
            </div>

          {/* ACTIVE/QUESTION State */}
          {(gameState === 'ACTIVE' || gameState === 'QUESTION') && currentQuestion && !isClassMode && (
            <QuestionDisplay
              question={currentQuestion}
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              disabled={true}
            />
          )}

          {(gameState === 'ACTIVE' || gameState === 'QUESTION') && !currentQuestion && !isClassMode && (
            <div className="proctor-host-state-panel proctor-host-state-panel-neutral">
              <h2 className="proctor-buffer-title">
                Live Audience View
              </h2>
              <p className="proctor-host-panel-subtitle">
                Syncing question payload...
              </p>
              <div className="proctor-host-timer-shell">
                <Timer
                  timeRemaining={timeRemaining}
                  totalTime={timerTotalTime || 1}
                  displayMode="seconds"
                  large
                />
              </div>
            </div>
          )}

          {(gameState === 'ACTIVE' || gameState === 'QUESTION') && isClassMode && (
            <div className="proctor-host-state-panel proctor-host-state-panel-neutral">
              <h2 className="proctor-buffer-title">Class Session In Progress</h2>
              <p className="proctor-host-panel-subtitle">The clock below is synced for all participants.</p>
              <div className="proctor-host-timer-shell">
                <Timer
                  timeRemaining={timeRemaining}
                  totalTime={timerTotalTime || 1}
                  displayMode="clock"
                  large
                />
              </div>
            </div>
          )}

          {/* BUFFER State */}
          {gameState === 'BUFFER' && (
            <div className="proctor-host-state-panel proctor-host-state-panel-buffer">
              <h2 className="proctor-buffer-title">Get Ready!</h2>
              <p className="proctor-host-panel-subtitle">Next question starting soon...</p>

              <div className="proctor-host-countdown-value">
                {timeRemaining > 0 ? timeRemaining : '...'}
              </div>

              <div className="proctor-host-progress-shell">
                <div
                  className="proctor-host-progress-fill"
                  style={{ width: `${(timeRemaining / 10) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* GRADING State */}
          {gameState === 'GRADING' && (
            <div className="proctor-host-state-panel proctor-host-state-panel-neutral">
              <div className="proctor-host-state-icon">⏳</div>
              <h2 className="proctor-buffer-title">Time&apos;s Up!</h2>
              <p className="proctor-host-panel-subtitle">Grading answers...</p>
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
                <div className="proctor-host-reveal-results">
                  <h3 className="proctor-host-reveal-title">
                    Results
                  </h3>
                  <div className="proctor-host-reveal-list">
                    {rankings.slice(0, 10).map((team) => (
                      <div key={team.teamId} className="proctor-host-reveal-item">
                        <span>{team.rank}. {team.teamName}</span>
                        <span>{team.score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAUSED State */}
          {gameState === 'PAUSED' && (
            <div className="proctor-host-state-panel proctor-host-state-panel-neutral">
              <div className="proctor-host-state-icon">⏸️</div>
              <h2 className="proctor-buffer-title">Quiz Paused</h2>
              <p className="proctor-host-panel-subtitle">
                The timer has been paused. Click Resume to continue.
              </p>
              {currentQuestion && (
                <p className="proctor-host-panel-meta">
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

          </section>

          {/* FINAL_RESULTS / ENDED State */}
          {gameState === 'FINAL_RESULTS' && (
            <div className="proctor-host-final-stage">
              <div className="proctor-host-final-banner">
                <div className="proctor-host-final-icon">�</div>
                <h2>Quiz Complete</h2>
                <p>Final results are in. Great run from every team.</p>
                <div className="proctor-host-final-metrics">
                  <div className="proctor-host-final-metric">
                    <span>Teams</span>
                    <strong>{rankings.length}</strong>
                  </div>
                  <div className="proctor-host-final-metric">
                    <span>Questions</span>
                    <strong>{totalQuestions || 0}</strong>
                  </div>
                  <div className="proctor-host-final-metric">
                    <span>Winning Score</span>
                    <strong>{rankings[0]?.score ?? 0}</strong>
                  </div>
                </div>
              </div>

              {rankings.length > 0 && (
                <div className="proctor-host-final-winner-card">
                  <span className="proctor-host-final-winner-label">Champion</span>
                  <div className="proctor-host-final-winner-main">
                    <h3>{rankings[0]?.teamName}</h3>
                    <p>{rankings[0]?.score ?? 0} points</p>
                  </div>
                </div>
              )}

              {rankings.length > 0 && (
                <div className="proctor-host-podium-grid">
                  <div className="proctor-host-podium-title">Top 3 Teams</div>
                  {rankings.slice(0, 3).map((team, idx) => (
                    <div
                      key={team.teamId}
                      className={`proctor-host-podium-item ${idx === 0 ? 'is-first' : ''}`}
                    >
                      <div className="proctor-host-podium-medal">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </div>
                      <p>{team.teamName}</p>
                      <strong>{team.score} pts</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="proctor-host-final-scoreboard">
                <ScoreboardDisplay
                  rankings={rankings}
                  isFinal={true}
                />
              </div>

              <div className="proctor-host-final-actions">
                <button
                  onClick={handleExitHome}
                  className="proctor-btn-primary proctor-btn-large"
                >
                  Go Home
                </button>
              </div>
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