import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ChevronDown, 
  Settings2, 
  LayoutDashboard, 
  RefreshCw, 
  Power,
  AlertCircle,
  Volume2,
  VolumeX,
  Palette,
  Check
} from 'lucide-react';
import { useSSE } from '../../hooks/useSSE';
import { accessApi } from '../../services/api';
import { getOrCreateDeviceId } from '../../services/deviceId';
import { getProctorSession, clearSession } from '../../services/sessionStorage';
import TeamGrid from '../../components/game/TeamGrid';
import './HostLobby.css';

const HostLobby: React.FC = () => {
  const navigate = useNavigate();
  const [session] = useState(() => getProctorSession());
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [noticeModal, setNoticeModal] = useState<{ title: string; message: string; onClose?: () => void } | null>(null);
  const [accessChecking, setAccessChecking] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activeBg, setActiveBg] = useState<string | null>(() => {
    if (session?.quizId) {
      return localStorage.getItem(`lobby_bg_${session.quizId}`);
    }
    return null;
  });
  const [showThemePalette, setShowThemePalette] = useState(false);

  // List of standard background images in public/lobby-backgrounds
  // User will name their images bg-1.jpg, bg-2.jpg etc. or we can just list them
  const availableBgs = [
    { id: 'none', label: 'Default Pearl' },
    { id: 'bg-1.png', label: 'Theme 1' },
    { id: 'bg-2.jpg', label: 'Theme 2' },
    { id: 'bg-3.jpg', label: 'Theme 3' },
    { id: 'bg-4.png', label: 'Theme 4' },
    { id: 'bg-5.png', label: 'Theme 5' },
    { id: 'bg-6.png', label: 'Theme 6' },
    { id: 'bg-7.jpg', label: 'Theme 7' },
  ];

  // Audio Logic
  useEffect(() => {
    const audio = new Audio('/host-lobby.mp3');
    audio.loop = true;
    audio.muted = isMuted;
    audioRef.current = audio;

    const playAudio = async () => {
      try {
        await audio.play();
      } catch (err) {
        console.log('Audio autoplay blocked or failed:', err);
      }
    };

    playAudio();

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setShowThemePalette(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectBg = (bgId: string) => {
    const selection = bgId === 'none' ? null : bgId;
    setActiveBg(selection);
    if (session?.quizId) {
      if (selection) {
        localStorage.setItem(`lobby_bg_${session.quizId}`, selection);
      } else {
        localStorage.removeItem(`lobby_bg_${session.quizId}`);
      }
    }
    setShowThemePalette(false);
  };

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
    error,
    gameState,
    connectedTeams,
    sendCommand,
    reconnect,
    disconnect,
  } = useSSE(
    session?.quizId || 0,
    'PROCTOR',
    undefined,
    session?.proctorPin
  );

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
    setShowActions(false);
  };

  const handleLeave = () => {
    setShowLeaveConfirm(true);
    setShowActions(false);
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
      <div className="host-lobby-page">
        <div className="host-lobby-container" style={{ textAlign: 'center', marginTop: '100px' }}>
          <p className="host-lobby-subtitle" style={{ color: '#64748b' }}>Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="host-lobby-page">
      <header className="host-lobby-top-bar">
        <div className="host-lobby-header-left">
          <h1 className="host-lobby-title">{session.quizTitle}</h1>
          <p className="host-lobby-subtitle">Game Lobby Waiting Room</p>
        </div>
        
        <div className="host-lobby-header-actions" ref={dropdownRef}>
          <div className="theme-selection-wrapper" ref={themeDropdownRef}>
            <button 
              className="header-icon-btn theme-btn" 
              onClick={() => setShowThemePalette(!showThemePalette)}
              title="Change Lobby Background"
            >
              <Palette size={18} />
            </button>

            {showThemePalette && (
              <div className="theme-palette-dropdown">
                <p className="theme-dropdown-title">Lobby Backgrounds</p>
                <div className="theme-options-grid">
                  {availableBgs.map((bg) => (
                    <button 
                      key={bg.id}
                      className={`theme-option-btn ${activeBg === bg.id || (bg.id === 'none' && !activeBg) ? 'active' : ''}`}
                      onClick={() => handleSelectBg(bg.id)}
                    >
                      {bg.id === 'none' ? (
                        <div className="theme-preview-none"></div>
                      ) : (
                        <img 
                          src={`/lobby-backgrounds/${bg.id}`} 
                          alt={bg.label} 
                          className="theme-preview-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x45?text=Empty';
                          }}
                        />
                      )}
                      <span>{bg.label}</span>
                      {(activeBg === bg.id || (bg.id === 'none' && !activeBg)) && <Check size={12} className="check-icon" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            className="header-icon-btn audio-toggle-btn" 
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <div className="header-status-tag">
            <Users size={14} className="badge-icon" />
            <span style={{ color: 'white', fontSize: '12px', fontWeight: 800, marginRight: '8px' }}>
              {connectedTeams.length} JOINED
            </span>
            <span className={`status-dot ${connected ? 'status-connected' : 'status-disconnected'}`} />
            <span style={{ color: 'white', fontSize: '12px', fontWeight: 800 }}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          <button className="header-action-trigger" onClick={() => setShowActions(!showActions)}>
            <Settings2 size={18} />
            <span>Quick Actions</span>
            <ChevronDown size={18} style={{ transform: showActions ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>

          {showActions && (
            <div className="quick-actions-palette">
              <button 
                className="palette-item-btn palette-start-btn" 
                onClick={handleStartQuiz}
                disabled={!connected || connectedTeams.length === 0}
              >
                Launch Game Session
              </button>
              <button className="palette-item-btn" onClick={() => navigate('/host/dashboard')}>
                <LayoutDashboard size={18} />
                Open Dashboard
              </button>
              <button className="palette-item-btn" onClick={reconnect}>
                <RefreshCw size={18} />
                Refresh Connection
              </button>
              <button className="palette-item-btn palette-exit-btn" onClick={handleLeave}>
                <Power size={18} />
                End Session
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="host-lobby-container">
        {error && (
          <div className="host-lobby-section" style={{ borderColor: '#f87171', background: '#fef2f2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#dc2626' }}>
              <AlertCircle size={24} />
              <p style={{ margin: 0, fontWeight: 600 }}>Connection Error: {error}</p>
            </div>
          </div>
        )}

        {/* CENTERED TEAMS VIEW */}
        <section 
          className="host-lobby-section"
          style={activeBg ? { 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(/lobby-backgrounds/${activeBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: 'none',
            color: '#ffffff'
          } : {}}
        >
          {connectedTeams.length > 0 ? (
            <TeamGrid teams={connectedTeams} />
          ) : (
            <div className="empty-lobby-state" style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '60px 0'
            }}>
              <p style={{ 
                color: activeBg ? 'rgba(255,255,255,0.7)' : '#64748b', 
                fontSize: '1.2rem',
                fontWeight: 600
              }}>
                Waiting for participants to join...
              </p>
            </div>
          )}
        </section>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
          Session ID: {session.quizId} • Protected by IntelliQuiz Aurum
        </p>
      </div>

      {/* Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="lobby-modal-overlay">
          <div className="lobby-modal">
            <div style={{ background: '#fee2e2', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Power size={32} style={{ color: '#ef4444' }} />
            </div>
            <h3>Terminate Session?</h3>
            <p>Ending the session will disconnect all joined teams and reset the lobby environment.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={confirmLeave} className="palette-item-btn palette-exit-btn" style={{ padding: '16px', justifyContent: 'center' }}>
                End Session for All
              </button>
              <button onClick={() => setShowLeaveConfirm(false)} className="palette-item-btn" style={{ padding: '16px', justifyContent: 'center' }}>
                Go Back to Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {noticeModal && (
        <div className="lobby-modal-overlay">
          <div className="lobby-modal">
            <h3>{noticeModal.title}</h3>
            <p>{noticeModal.message}</p>
            <button
              onClick={() => {
                const handler = noticeModal.onClose;
                setNoticeModal(null);
                if (handler) handler();
              }}
              className="palette-item-btn palette-start-btn"
              style={{ justifyContent: 'center' }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostLobby;
