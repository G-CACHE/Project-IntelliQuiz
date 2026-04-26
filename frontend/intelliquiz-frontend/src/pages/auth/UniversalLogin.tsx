import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { accessApi, type QuizAccessResponse, type TeamResponse } from '../../services/api';
import { getOrCreateDeviceId } from '../../services/deviceId';
import { saveParticipantSession, saveProctorSession } from '../../services/sessionStorage';
import { formatSmartName, parseSmartName } from '../../utils/nameUtils';
import { 
  GiTrophyCup, 
  GiGamepad, 
  GiBrain, 
  GiRocket, 
  GiCheckeredFlag, 
  GiJeweledChalice,
  GiStarShuriken,
  GiCrownedHeart
} from 'react-icons/gi';
import '../../styles/landing.css';

const UniversalLogin: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [pendingPublicQuiz, setPendingPublicQuiz] = useState<QuizAccessResponse | null>(null);
  const [pendingRestrictedTeam, setPendingRestrictedTeam] = useState<{ team: TeamResponse; quiz: QuizAccessResponse } | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const AVATARS = [
    '1st-avatar.png',
    '2nd-avatar.png',
    '3rd-avatar.png',
    '4th-avatar.png',
    '5th-avatar.png',
    '6th-avatar.png',
    '7th-avatar.png',
    '8th-avatar.png',
    '9th-avatar.png',
    '10th-avatar.png',
  ];

  // Audio setup
  useEffect(() => {
    const audio = new Audio('/landing-page%20sounds.mp3');
    audio.loop = true;
    audio.volume = 1.0;
    audioRef.current = audio;

    const attemptPlay = () => {
      if (audioRef.current && !isMuted) {
        audioRef.current.play().catch(() => {
          // Play failed, wait for interaction
          console.log("Autoplay blocked, waiting for interaction...");
        });
      }
    };

    const handleInteraction = () => {
      attemptPlay();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    // Initial attempt
    attemptPlay();

    return () => {
      audio.pause();
      audio.src = "";
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Sync mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      if (!isMuted) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMuted]);

  const toggleMute = () => setIsMuted(prev => !prev);

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (err instanceof Error && err.message) {
      try {
        const parsed = JSON.parse(err.message) as { message?: string; errorMessage?: string };
        if (parsed?.message) return parsed.message;
        if (parsed?.errorMessage) return parsed.errorMessage;
      } catch {
        // Not JSON; use raw message.
      }
      return err.message;
    }
    return fallback;
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Enter quiz code');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const deviceId = getOrCreateDeviceId();
      const result = await accessApi.resolveCode(code.trim(), deviceId);

      if (result.routeType === 'HOST' && result.quiz) {
        if (result.quiz.status === 'DRAFT') {
          setError('Proctoring is not allowed while quiz is in draft.');
          return;
        }

        saveProctorSession(result.quiz.id, result.quiz.title, result.quiz.proctorPin);

        const shouldOpenGame =
          result.quiz.status === 'ARCHIVED' ||
          result.quiz.status === 'ACTIVE' ||
          Boolean(result.quiz.isLive);

        navigate(shouldOpenGame ? '/host/game' : '/host/lobby');
        return;
      }

      if (result.routeType === 'PARTICIPANT' && result.team && result.quiz) {
        const access = await accessApi.checkParticipantAccess(
          result.team.quizId,
          result.team.id,
          getOrCreateDeviceId(),
        );

        if (!access.allowed) {
          setError(access.message || 'You cannot rejoin this quiz right now. Please contact the proctor/admin.');
          return;
        }

        // If team already has an avatar in their name, we can skip or show selection
        const { avatarId } = parseSmartName(result.team.name);
        if (avatarId) {
          saveParticipantSession(
            result.team.quizId,
            result.team.id,
            result.team.name,
            result.team.accessCode,
          );
          navigate('/player/lobby');
        } else {
          // Show avatar selection for restricted team
          setPendingRestrictedTeam({ team: result.team, quiz: result.quiz });
          setShowAvatarSelection(true);
        }
        return;
      }

      // Public quiz pre-join path: code resolved to PARTICIPANT quiz but no team yet.
      if (result.routeType === 'PARTICIPANT' && result.quiz?.accessMode === 'PUBLIC' && !result.team) {
        setPendingPublicQuiz(result.quiz);
        setShowAvatarSelection(false);
        setError(null);
        return;
      }

      setError(result.errorMessage || 'Code not recognized. Please check and try again.');
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to resolve code right now. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePublicNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) {
      setError('Enter your participant or team name.');
      return;
    }
    setShowAvatarSelection(true);
  };

  const handleAvatarConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      if (pendingPublicQuiz) {
        // Handle Public Join
        const smartName = formatSmartName(participantName.trim(), selectedAvatar);
        const joined = await accessApi.joinPublicQuiz(
          pendingPublicQuiz.id,
          smartName,
          getOrCreateDeviceId(),
        );

        if (joined.routeType === 'PARTICIPANT' && joined.team) {
          saveParticipantSession(
            joined.team.quizId,
            joined.team.id,
            joined.team.name,
            joined.team.accessCode,
          );
          navigate('/player/lobby');
        } else {
          setError(joined.errorMessage || 'Unable to join this quiz right now.');
        }
      } else if (pendingRestrictedTeam) {
        // Handle Restricted Join (Update name if possible, or just proceed)
        // For now, since we can't update backend name for restricted teams easily,
        // we store the avatar selection in the name ONLY if we have an API.
        // If we don't, we can store it in local storage for the current user.
        
        // Let's try to update the name via API (I will add this endpoint)
        const smartName = formatSmartName(pendingRestrictedTeam.team.name, selectedAvatar);
        
        try {
          await accessApi.updateTeamName(pendingRestrictedTeam.team.id, smartName, pendingRestrictedTeam.team.accessCode);
        } catch (err) {
          console.warn('Failed to update name with avatar, proceeding anyway', err);
        }

        saveParticipantSession(
          pendingRestrictedTeam.team.quizId,
          pendingRestrictedTeam.team.id,
          smartName,
          pendingRestrictedTeam.team.accessCode,
        );
        navigate('/player/lobby');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to join right now.'));
    } finally {
      setLoading(false);
    }
  };

  const resetPublicJoin = () => {
    setPendingPublicQuiz(null);
    setPendingRestrictedTeam(null);
    setShowAvatarSelection(false);
    setParticipantName('');
    setSelectedAvatar(null);
    setError(null);
  };

  const handleLogoTap = () => {
    const next = logoTapCount + 1;
    if (next >= 3) {
      setLogoTapCount(0);
      navigate('/portal');
      return;
    }
    setLogoTapCount(next);
    window.setTimeout(() => setLogoTapCount(0), 900);
  };

  return (
    <div className="landing-page">
      <button 
        className="landing-audio-toggle" 
        onClick={toggleMute} 
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      <div className="landing-bg-icons">
        <GiTrophyCup className="floating-icon icon-1" />
        <GiGamepad className="floating-icon icon-2" />
        <GiBrain className="floating-icon icon-3" />
        <GiRocket className="floating-icon icon-4" />
        <GiCheckeredFlag className="floating-icon icon-5" />
        <GiJeweledChalice className="floating-icon icon-6" />
        <GiStarShuriken className="floating-icon icon-7" />
        <GiCrownedHeart className="floating-icon icon-8" />
        <GiBrain className="floating-icon icon-9" />
        <GiGamepad className="floating-icon icon-10" />
      </div>
      
      <div className={`landing-container ${showAvatarSelection ? 'avatar-step' : ''}`}>
        <header className="landing-header">
          <h1 className="landing-title" onClick={handleLogoTap}>IntelliQuiz</h1>
        </header>

        <section className={`landing-join-card ${showAvatarSelection ? 'wide' : ''}`} aria-label="Join Quiz">
          {!showAvatarSelection ? (
            !pendingPublicQuiz ? (
              <form onSubmit={handleJoin} className="landing-form">
                <input
                  id="landingCode"
                  type="text"
                  className="landing-input"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''));
                    setError(null);
                  }}
                  placeholder="Game Code"
                  autoFocus
                  maxLength={24}
                  disabled={loading}
                />

                {error && (
                  <p className="landing-error-text">{error}</p>
                )}

                <button
                  type="submit"
                  className="landing-submit-btn"
                  disabled={loading || !code.trim()}
                >
                  {loading ? 'Entering...' : 'Enter'}
                </button>
              </form>
            ) : (
              <div className="landing-public-flow">
                <p className="landing-public-subtitle">
                  Joining <strong>{pendingPublicQuiz.title}</strong>
                </p>

                <form onSubmit={handlePublicNameSubmit} className="landing-form">
                  <input
                    id="landingPublicName"
                    type="text"
                    className="landing-input"
                    value={participantName}
                    onChange={(e) => {
                      setParticipantName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Your Name"
                    autoFocus
                    maxLength={100}
                    disabled={loading}
                  />

                  {error && (
                    <p className="landing-error-text">{error}</p>
                  )}

                  <div className="landing-actions">
                    <button
                      type="button"
                      className="landing-btn-back"
                      onClick={resetPublicJoin}
                      disabled={loading}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="landing-submit-btn"
                      disabled={loading || !participantName.trim()}
                    >
                      {loading ? 'Next' : 'Next'}
                    </button>
                  </div>
                </form>
              </div>
            )
          ) : (
            <div className="landing-avatar-selection">
              <h3 className="landing-avatar-title">Choose Your Avatar</h3>
              <p className="landing-avatar-subtitle">Make your team stand out!</p>
              
              <div className="landing-avatar-options">
                <label className="landing-default-toggle">
                  <input
                    type="checkbox"
                    checked={selectedAvatar === null}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedAvatar(null);
                      else setSelectedAvatar(AVATARS[0]);
                    }}
                  />
                  <span className="landing-toggle-slider"></span>
                  <span className="landing-toggle-label">Use Default Initial Avatar</span>
                </label>
              </div>

              <div className={`landing-avatar-grid ${selectedAvatar === null ? 'disabled' : ''}`}>
                {AVATARS.map((avatar, idx) => (
                  <button
                    key={avatar}
                    className={`landing-avatar-item ${selectedAvatar === avatar ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedAvatar(avatar);
                    }}
                    disabled={selectedAvatar === null}
                  >
                    <img src={`/avatars/${avatar}`} alt={`Avatar ${idx + 1}`} className="landing-avatar-img" />
                  </button>
                ))}
              </div>

              {error && (
                <p className="landing-error-text">{error}</p>
              )}

              <div className="landing-actions">
                <button
                  type="button"
                  className="landing-btn-back"
                  onClick={() => setShowAvatarSelection(false)}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="landing-submit-btn"
                  onClick={handleAvatarConfirm}
                  disabled={loading}
                >
                  {loading ? 'Joining...' : 'Let\'s Go!'}
                </button>
              </div>
            </div>
          )}
        </section>

        <footer className="landing-minimal-footer">
          <p>© 2026 IntelliQuiz</p>
        </footer>
      </div>
    </div>
  );
};

export default UniversalLogin;
