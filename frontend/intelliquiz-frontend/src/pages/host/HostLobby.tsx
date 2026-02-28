import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getProctorSession, clearSession } from '../../services/sessionStorage';
import TeamGrid from '../../components/game/TeamGrid';
import '../../styles/proctor.css';

const HostLobby: React.FC = () => {
  const navigate = useNavigate();
  const [session] = useState(() => getProctorSession());
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      navigate('/proctor/login');
    }
  }, [session, navigate]);

  const {
    connected,
    connecting,
    error,
    gameState,
    connectedTeams,
    sendCommand,
    reconnect,
    disconnect,
  } = useWebSocket(
    session?.quizId || 0,
    'PROCTOR',
    undefined,
    undefined,
    session?.proctorPin
  );

  // Navigate to game when quiz starts
  useEffect(() => {
    if (gameState === 'ACTIVE' || gameState === 'QUESTION' || gameState === 'BUFFER') {
      navigate('/host/game');
    }
  }, [gameState, navigate]);

  const handleStartQuiz = () => {
    if (connectedTeams.length === 0) {
      alert('No teams connected. Wait for teams to join before starting.');
      return;
    }
    sendCommand({ type: 'START_ROUND', payload: { round: 'EASY' } });
  };

  const handleLeave = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeave = () => {
    disconnect();
    clearSession();
    navigate('/');
  };

  if (!session) {
    return null;
  }


  return (
    <div className="proctor-page">
      {/* Page Header */}
      <div className="proctor-page-header">
        <div className="proctor-header-decoration proctor-header-decoration-1"></div>
        <div className="proctor-header-decoration proctor-header-decoration-2"></div>
        <h1 className="proctor-page-title">{session.quizTitle}</h1>
        <p className="proctor-page-subtitle">Proctor Lobby</p>
      </div>

      <div className="proctor-content">
        <div className="proctor-container">
          {/* Proctor PIN Card */}
          <div className="proctor-card proctor-pin-card">
            <div className="proctor-pin-label">Proctor PIN</div>
            <div className="proctor-pin-value">{session.proctorPin}</div>
          </div>

          {/* Connection Status */}
          <div className="proctor-connection-status">
            <span className={`proctor-status-dot ${
              connected ? 'proctor-status-connected' : 
              connecting ? 'proctor-status-connecting' : 
              'proctor-status-disconnected'
            }`}></span>
            <span className="proctor-status-text">
              {connected ? 'Connected to server' : 
               connecting ? 'Connecting...' : 
               'Disconnected'}
            </span>
            {!connected && !connecting && (
              <button onClick={reconnect} className="proctor-btn-link">
                Reconnect
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="proctor-alert-error">
              <span className="proctor-alert-icon">⚠</span>
              <p>{error}</p>
            </div>
          )}

          {/* Teams Section */}
          <div className="proctor-section">
            <h2 className="proctor-section-title">
              <span>Connected Teams</span>
              <span className="proctor-badge-accent">{connectedTeams.length}</span>
            </h2>
            
            <TeamGrid teams={connectedTeams} />
          </div>

          {/* Action Buttons */}
          <div className="proctor-actions">
            <button
              onClick={handleStartQuiz}
              disabled={!connected || connectedTeams.length === 0}
              className="proctor-btn-primary proctor-btn-large"
            >
              Start Quiz
            </button>
            <button
              onClick={handleLeave}
              className="proctor-btn-secondary"
            >
              Leave Lobby
            </button>
          </div>

          {/* Help Text */}
          <p className="proctor-help-text">
            {connectedTeams.length === 0
              ? 'Share team codes with participants to let them join'
              : `${connectedTeams.length} team${connectedTeams.length !== 1 ? 's' : ''} ready to play`}
          </p>
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="proctor-modal-overlay">
          <div className="proctor-modal-content">
            <div className="proctor-modal-header">
              <h3 className="proctor-modal-title">Leave Lobby?</h3>
            </div>
            <div className="proctor-modal-body">
              <p>Are you sure you want to leave? Connected teams will be disconnected.</p>
            </div>
            <div className="proctor-modal-footer">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="proctor-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeave}
                className="proctor-btn-danger"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostLobby;
