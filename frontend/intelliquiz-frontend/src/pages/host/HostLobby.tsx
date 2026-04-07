import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiErrorCircle, BiGroup } from 'react-icons/bi';
import { useSSE } from '../../hooks/useSSE';
import { accessApi } from '../../services/api';
import { getOrCreateDeviceId } from '../../services/deviceId';
import { getProctorSession, clearSession } from '../../services/sessionStorage';
import TeamGrid from '../../components/game/TeamGrid';
import ScoreboardDisplay from '../../components/game/ScoreboardDisplay';
import '../../styles/proctor.css';

const HostLobby: React.FC = () => {
  const navigate = useNavigate();
  const [session] = useState(() => getProctorSession());
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [noticeModal, setNoticeModal] = useState<{ title: string; message: string; onClose?: () => void } | null>(null);
  const [accessChecking, setAccessChecking] = useState(true);

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  useEffect(() => {
    if (!session?.proctorPin) {
      return;
    }

    let active = true;
    const verifyProctorAccess = async () => {
      try {
        const result = await accessApi.resolveCode(session.proctorPin, getOrCreateDeviceId());
        if (!active) return;

        if (result.routeType !== 'HOST' || !result.quiz) {
          clearSession();
          setNoticeModal({
            title: 'Invalid Access',
            message: result.errorMessage || 'Invalid proctor PIN.',
            onClose: () => navigate('/'),
          });
          return;
        }

        if (result.quiz.status === 'DRAFT') {
          clearSession();
          setNoticeModal({
            title: 'Proctoring Not Available',
            message: 'Proctoring is not allowed while quiz is in draft.',
            onClose: () => navigate('/'),
          });
          return;
        }

        // Skip lobby when quiz is already started or completed.
        if (result.quiz.status === 'ARCHIVED' || result.quiz.status === 'ACTIVE' || Boolean(result.quiz.isLive)) {
          navigate('/host/game');
          return;
        }
      } catch {
        if (!active) return;
        clearSession();
        setNoticeModal({
          title: 'Access Check Failed',
          message: 'Proctor access check failed. Please enter a valid PIN again.',
          onClose: () => navigate('/'),
        });
        return;
      } finally {
        if (active) {
          setAccessChecking(false);
        }
      }
    };

    verifyProctorAccess();
    return () => {
      active = false;
    };
  }, [session?.proctorPin, navigate]);

  const {
    connected,
    connecting,
    error,
    gameState,
    connectedTeams,
    rankings,
    sendCommand,
    reconnect,
    disconnect,
  } = useSSE(
    session?.quizId || 0,
    'PROCTOR',
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
      setNoticeModal({
        title: 'Cannot Start Quiz',
        message: 'No teams connected. Wait for teams to join before starting.',
      });
      return;
    }
    sendCommand({ type: 'START_QUIZ' });
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

  if (accessChecking) {
    return (
      <div className="proctor-page">
        <div className="proctor-content">
          <div className="proctor-container">
            <p className="proctor-help-text">Validating proctor access...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="proctor-page">
      <div className="proctor-page-header">
        <div className="proctor-header-decoration proctor-header-decoration-1" />
        <div className="proctor-header-decoration proctor-header-decoration-2" />
        <div className="proctor-page-header-content">
          <h1 className="proctor-page-title">{session.quizTitle}</h1>
          <p className="proctor-page-subtitle">Proctor Lobby</p>
        </div>
      </div>

      <div className="proctor-content">
        <div className="proctor-container">
          {error && (
            <div className="proctor-alert proctor-alert-error">
              <div className="proctor-alert-content">
                <span className="proctor-alert-icon" aria-hidden="true"><BiErrorCircle /></span>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="proctor-section proctor-lobby-teams-section">
            <h2 className="proctor-section-title proctor-lobby-teams-title-row">
              <BiGroup aria-hidden="true" />
              <span>Connected Teams</span>
              <span className="proctor-badge-accent">{connectedTeams.length}</span>
            </h2>
            <TeamGrid teams={connectedTeams} />
            <p className="proctor-help-text proctor-lobby-footnote proctor-lobby-teams-help">
              {connectedTeams.length === 0
                ? 'Share team codes with participants to let them join'
                : `${connectedTeams.length} team${connectedTeams.length !== 1 ? 's' : ''} ready to play`}
            </p>
          </div>

          <div className="proctor-lobby-bottom-stack">
            <div className="proctor-card proctor-card-static proctor-lobby-status-card">
              <h2 className="proctor-section-title">
                <BiGroup aria-hidden="true" />
                <span>Session Status</span>
              </h2>
              <div className="proctor-connection-status">
                <span className={`proctor-status-dot ${
                  connected ? 'proctor-status-connected' :
                  connecting ? 'proctor-status-connecting' :
                  'proctor-status-disconnected'
                }`} />
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
              <div className="proctor-actions proctor-lobby-action-grid">
                <button
                  onClick={handleStartQuiz}
                  disabled={!connected || connectedTeams.length === 0}
                  className="proctor-btn-primary proctor-btn-large"
                >
                  Start Quiz
                </button>
                <button
                  onClick={() => navigate('/proctor/dashboard')}
                  className="proctor-btn-secondary"
                >
                  Open Proctor Dashboard
                </button>
                <button
                  onClick={handleLeave}
                  className="proctor-btn-secondary"
                >
                  Leave Lobby
                </button>
              </div>
            </div>

            <div className="proctor-card proctor-card-static proctor-lobby-ranking-card">
              <h2 className="proctor-section-title">
                <span>Ranking Preview</span>
              </h2>
              <ScoreboardDisplay
                rankings={rankings}
                isFinal={false}
                title="Live Leaderboard"
              />
              <p className="proctor-help-text proctor-lobby-footnote">
                Rankings refresh automatically as soon as answers are graded.
              </p>
            </div>
          </div>
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

      {noticeModal && (
        <div className="proctor-modal-overlay">
          <div className="proctor-modal-content">
            <div className="proctor-modal-header">
              <h3 className="proctor-modal-title">{noticeModal.title}</h3>
            </div>
            <div className="proctor-modal-body">
              <p>{noticeModal.message}</p>
            </div>
            <div className="proctor-modal-footer">
              <button
                onClick={() => {
                  const handler = noticeModal.onClose;
                  setNoticeModal(null);
                  if (handler) handler();
                }}
                className="proctor-btn-primary"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostLobby;
