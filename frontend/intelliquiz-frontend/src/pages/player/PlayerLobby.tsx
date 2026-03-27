import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BiErrorCircle } from 'react-icons/bi';
import { useSSE } from '../../hooks/useSSE';
import { accessApi } from '../../services/api';
import { getOrCreateDeviceId } from '../../services/deviceId';
import { clearSession, getParticipantSession } from '../../services/sessionStorage';
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

  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // SSE connection
  const {
    connected,
    connecting,
    error,
    gameState,
    connectedTeams,
    reconnect,
    disconnect,
    kicked,
    kickReason,
  } = useSSE(
    session?.quizId || 0,
    'PARTICIPANT',
    session?.teamId,
    session?.teamCode
  );

  // Redirect to login if no session
  useEffect(() => {
    if (!session) {
      navigate('/participant/login');
    }
  }, [session, navigate]);

  // Guard stale sessions: blocked users must not proceed to lobby.
  useEffect(() => {
    let active = true;

    const verifyAccess = async () => {
      if (!session) return;
      try {
        const access = await accessApi.checkParticipantAccess(
          session.quizId,
          session.teamId,
          getOrCreateDeviceId(),
        );

        if (!access.allowed && active) {
          clearSession();
          const warning = access.message || 'You cannot rejoin this quiz until approved by the proctor/admin.';
          setAccessDeniedMessage(warning);
          navigate(`/participant/login?warning=${encodeURIComponent(warning)}`);
        }
      } catch {
        // If check fails, keep current UX and let SSE error handling continue.
      }
    };

    verifyAccess();
    return () => {
      active = false;
    };
  }, [session, navigate]);

  // Redirect to kicked screen if team was kicked
  useEffect(() => {
    if (kicked) {
      disconnect();
      const encodedReason = encodeURIComponent(kickReason || 'You have been removed from the quiz');
      navigate(`/player/terminated?reason=${encodedReason}`);
    }
  }, [kicked, kickReason, disconnect, navigate]);

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
          {session.teamCode && (
            <div className="participant-room-code-card">
              <span className="participant-room-code-label">Team Code</span>
              <span className="participant-room-code-value">{session.teamCode}</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="participant-alert-error">
              <span className="participant-alert-icon" aria-hidden="true"><BiErrorCircle /></span>
              <p>{error}</p>
              <button onClick={reconnect} className="participant-btn-danger participant-btn-small">
                Try Again
              </button>
            </div>
          )}

          {accessDeniedMessage && (
            <div className="participant-alert-error">
              <span className="participant-alert-icon" aria-hidden="true"><BiErrorCircle /></span>
              <p>{accessDeniedMessage}</p>
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
