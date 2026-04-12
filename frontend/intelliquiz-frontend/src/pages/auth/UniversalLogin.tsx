import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { accessApi, type QuizAccessResponse } from '../../services/api';
import { getOrCreateDeviceId } from '../../services/deviceId';
import { saveParticipantSession, saveProctorSession } from '../../services/sessionStorage';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

      if (result.routeType === 'PARTICIPANT' && result.team) {
        const access = await accessApi.checkParticipantAccess(
          result.team.quizId,
          result.team.id,
          getOrCreateDeviceId(),
        );

        if (!access.allowed) {
          setError(access.message || 'You cannot rejoin this quiz right now. Please contact the proctor/admin.');
          return;
        }

        saveParticipantSession(
          result.team.quizId,
          result.team.id,
          result.team.name,
          result.team.accessCode,
        );
        navigate('/player/lobby');
        return;
      }

      // Public quiz pre-join path: code resolved to PARTICIPANT quiz but no team yet.
      if (result.routeType === 'PARTICIPANT' && result.quiz?.accessMode === 'PUBLIC' && !result.team) {
        setPendingPublicQuiz(result.quiz);
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

  const handlePublicJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPublicQuiz) return;
    if (!participantName.trim()) {
      setError('Enter your participant or team name.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const joined = await accessApi.joinPublicQuiz(
        pendingPublicQuiz.id,
        participantName.trim(),
        getOrCreateDeviceId(),
      );
      if (joined.routeType === 'PARTICIPANT' && joined.team) {
        const access = await accessApi.checkParticipantAccess(
          joined.team.quizId,
          joined.team.id,
          getOrCreateDeviceId(),
        );

        if (!access.allowed) {
          setError(access.message || 'You cannot rejoin this quiz right now. Please contact the proctor/admin.');
          return;
        }

        saveParticipantSession(
          joined.team.quizId,
          joined.team.id,
          joined.team.name,
          joined.team.accessCode,
        );
        navigate('/player/lobby');
        return;
      }

      setError(joined.errorMessage || 'Unable to join this quiz right now.');
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to join this quiz right now.'));
    } finally {
      setLoading(false);
    }
  };

  const resetPublicJoin = () => {
    setPendingPublicQuiz(null);
    setParticipantName('');
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
      
      <div className="landing-container">
        <header className="landing-header">
          <h1 className="landing-title" onClick={handleLogoTap}>IntelliQuiz</h1>
        </header>

        <section className="landing-join-card" aria-label="Join Quiz">
          {!pendingPublicQuiz ? (
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

              <form onSubmit={handlePublicJoin} className="landing-form">
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
                    {loading ? 'Joining...' : 'Go'}
                  </button>
                </div>
              </form>
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
