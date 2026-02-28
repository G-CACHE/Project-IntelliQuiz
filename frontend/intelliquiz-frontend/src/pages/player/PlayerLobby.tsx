import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getParticipantSession } from '../../services/sessionStorage';
import '../../styles/participant.css';

const PlayerLobby: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get session data
  const [session] = useState(() => {
    const stored = getParticipantSession();
    if (stored) return stored;
    
    // Fallback to URL params
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

  // WebSocket connection
  const {
    connected,
    connecting,
    error,
    gameState,
    connectedTeams,
    reconnect,
  } = useWebSocket(
    session?.quizId || 0,
    'PARTICIPANT',
    session?.teamId,
    session?.teamName,
    session?.teamCode
  );

  // Redirect to login if no session
  useEffect(() => {
    if (!session) {
      navigate('/participant/login');
    }
  }, [session, navigate]);

  // Navigate to game when quiz starts
  useEffect(() => {
    if (gameState === 'ACTIVE' || gameState === 'QUESTION' || gameState === 'BUFFER') {
      navigate(`/player/game?quizId=${session?.quizId}&teamId=${session?.teamId}`);
    }
  }, [gameState, session, navigate]);

  if (!session) {
    return null;
  }

  return (
    <div className="participant-page">
      {/* Page Header */}
      <div className="participant-page-header">
        <div className="participant-header-decoration participant-header-decoration-1"></div>
        <div className="participant-header-decoration participant-header-decoration-2"></div>
        <p className="participant-page-subtitle">Your Team</p>
        <h1 className="participant-page-title">{session.teamName}</h1>
        <div className="participant-connection-badge">
          <span className={`participant-status-dot ${
            connected ? 'participant-status-connected' : 
            connecting ? 'participant-status-connecting' : 
            'participant-status-disconnected'
          }`}></span>
          <span>
            {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="participant-content participant-content-centered">
        <div className="participant-waiting-container">
          {/* Error State */}
          {error && (
            <div className="participant-alert-error">
              <span className="participant-alert-icon">⚠</span>
              <p>{error}</p>
              <button onClick={reconnect} className="participant-btn-danger participant-btn-small">
                Try Again
              </button>
            </div>
          )}

          {/* Waiting Animation */}
          {!error && (
            <>
              <div className="participant-waiting-spinner">
                <div className="participant-spinner-outer"></div>
                <div className="participant-spinner-inner"></div>
              </div>

              <h2 className="participant-waiting-title">
                Waiting for host to start...
              </h2>
              <p className="participant-waiting-text">
                Get ready! The quiz will begin soon.
              </p>

              {/* Team Count */}
              {connectedTeams.length > 0 && (
                <div className="participant-team-count">
                  <span className="participant-status-dot participant-status-connected"></span>
                  <span>
                    {connectedTeams.length} team{connectedTeams.length !== 1 ? 's' : ''} connected
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="participant-footer">
        <p className="participant-footer-text">
          Stay on this page. You'll be automatically taken to the quiz when it starts.
        </p>
      </div>
    </div>
  );
};

export default PlayerLobby;
