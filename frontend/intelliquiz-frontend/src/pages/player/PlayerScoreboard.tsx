import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getParticipantSession, clearSession } from '../../services/sessionStorage';
import ScoreboardDisplay from '../../components/game/ScoreboardDisplay';
import '../../styles/participant.css';

const PlayerScoreboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFinal = searchParams.get('final') === 'true';
  
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
    questionNumber,
    totalQuestions,
    rankings,
    reconnect,
    disconnect,
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

  // Navigate back to game if state changes
  useEffect(() => {
    if (gameState === 'QUESTION' && !isFinal) {
      navigate(`/player/game?quizId=${session?.quizId}&teamId=${session?.teamId}`);
    }
  }, [gameState, isFinal, session, navigate]);

  const handleReturnToLogin = () => {
    disconnect();
    clearSession();
    navigate('/participant/login');
  };

  const handlePlayAgain = () => {
    disconnect();
    clearSession();
    navigate('/participant/login');
  };

  // Find current team's rank
  const currentTeamRanking = rankings.find(r => r.teamId === session?.teamId);
  const currentRank = currentTeamRanking?.rank || 0;

  if (!session) return null;

  return (
    <div className="participant-page">
      {/* Page Header */}
      <div className="participant-page-header">
        <div className="participant-header-decoration participant-header-decoration-1"></div>
        <div className="participant-header-decoration participant-header-decoration-2"></div>
        <p className="participant-page-subtitle">Your Team</p>
        <h1 className="participant-page-title">{session.teamName}</h1>
        <div className="participant-header-info">
          <div className="participant-connection-badge">
            <span className={`participant-status-dot ${connected ? 'participant-status-connected' : 'participant-status-disconnected'}`}></span>
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {!isFinal && (
            <span className="participant-question-info">Q{questionNumber}/{totalQuestions}</span>
          )}
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
      <div className="participant-content">
        <div className="participant-container participant-container-narrow">
          {/* Your Rank Banner (Final Results) */}
          {isFinal && currentRank > 0 && (
            <div className={`participant-rank-banner ${
              currentRank === 1 ? 'participant-rank-gold' :
              currentRank === 2 ? 'participant-rank-silver' :
              currentRank === 3 ? 'participant-rank-bronze' :
              'participant-rank-default'
            }`}>
              <p className="participant-rank-label">Your Final Rank</p>
              <p className="participant-rank-value">
                {currentRank <= 3 ? ['🥇', '🥈', '🥉'][currentRank - 1] : `#${currentRank}`}
              </p>
              {currentTeamRanking && (
                <p className="participant-rank-score">{currentTeamRanking.score} points</p>
              )}
            </div>
          )}

          {/* Scoreboard */}
          <ScoreboardDisplay
            rankings={rankings}
            highlightTeamId={session.teamId}
            isFinal={isFinal}
          />

          {/* Footer */}
          <div className="participant-scoreboard-controls">
            {isFinal ? (
              <div className="participant-final-controls">
                <p className="participant-final-message">
                  🎉 Thanks for playing! Great job, {session.teamName}!
                </p>
                <div className="participant-actions">
                  <button
                    onClick={handlePlayAgain}
                    className="participant-btn-primary participant-btn-large"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={handleReturnToLogin}
                    className="participant-btn-secondary"
                  >
                    Return to Login
                  </button>
                </div>
              </div>
            ) : (
              <div className="participant-waiting-card">
                <div className="participant-loading-spinner participant-spinner-small"></div>
                <p>Waiting for next question...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerScoreboard;
