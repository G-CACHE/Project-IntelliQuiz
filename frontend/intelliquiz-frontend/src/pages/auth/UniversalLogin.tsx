import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accessApi, type QuizAccessResponse } from '../../services/api';
import { getOrCreateDeviceId } from '../../services/deviceId';
import { saveParticipantSession, saveProctorSession } from '../../services/sessionStorage';
import '../../styles/landing.css';

const UniversalLogin: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [pendingPublicQuiz, setPendingPublicQuiz] = useState<QuizAccessResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoTapCount, setLogoTapCount] = useState(0);

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
      <div className="landing-hero">
        <div className="landing-orb landing-orb-left" aria-hidden="true"></div>
        <div className="landing-orb landing-orb-right" aria-hidden="true"></div>
        <div className="landing-grid-line" aria-hidden="true"></div>
        <div className="landing-hero-content">
          <p className="landing-hero-kicker">PUP Quiz Experience</p>
          <h1 className="landing-hero-title" onClick={handleLogoTap}>IntelliQuiz</h1>
          <p className="landing-hero-subtitle">Interactive Quiz Platform</p>
        </div>
      </div>

      <div className="landing-content">
        <div className="landing-shell">
          <aside className="landing-info-panel">
            <h2 className="landing-info-title">Fast join, instant play</h2>
            <p className="landing-info-copy">
              Enter your quiz code to continue. IntelliQuiz detects your access type automatically and routes you to the correct experience.
            </p>
            <div className="landing-feature-list">
              <span className="landing-feature-item">Realtime sync</span>
              <span className="landing-feature-item">Role-aware access</span>
              <span className="landing-feature-item">Live leaderboard</span>
            </div>
          </aside>

          <section className="landing-auth-card" aria-label="Quiz Access">
            <div className="landing-auth-header">
              <p className="landing-auth-kicker">Access Portal</p>
              <h3 className="landing-auth-title">
                {!pendingPublicQuiz ? 'Enter your code to continue' : 'Set your team name'}
              </h3>
            </div>

            {!pendingPublicQuiz ? (
              <form onSubmit={handleJoin} className="landing-auth-form">
                <input
                  id="landingCode"
                  type="text"
                  className="landing-entry-input"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''));
                    setError(null);
                  }}
                  placeholder="XXXX-XXXX"
                  autoFocus
                  maxLength={24}
                  disabled={loading}
                />

                {error && (
                  <p className="landing-error-text">{error}</p>
                )}

                <button
                  type="submit"
                  className="landing-entry-btn"
                  disabled={loading || !code.trim()}
                >
                  {loading ? 'Resolving...' : 'Join Quiz'}
                </button>
              </form>
            ) : (
              <>
                <p className="landing-public-notice">
                  Public mode detected for <strong>{pendingPublicQuiz.title}</strong>. Enter your participant/team name.
                </p>

                <form onSubmit={handlePublicJoin} className="landing-auth-form">
                  <label htmlFor="landingPublicName" className="landing-input-label">Participant or Team Name</label>
                  <input
                    id="landingPublicName"
                    type="text"
                    className="landing-entry-input"
                    value={participantName}
                    onChange={(e) => {
                      setParticipantName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter your name"
                    autoFocus
                    maxLength={100}
                    disabled={loading}
                  />

                  {error && (
                    <p className="landing-error-text">{error}</p>
                  )}

                  <div className="landing-public-actions">
                    <button
                      type="button"
                      className="landing-entry-btn-secondary"
                      onClick={resetPublicJoin}
                      disabled={loading}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="landing-entry-btn"
                      disabled={loading || !participantName.trim()}
                    >
                      {loading ? 'Joining...' : 'Continue'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>

      </div>

      <footer className="landing-footer">
        <p className="landing-footer-text">
          © 2026 IntelliQuiz. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default UniversalLogin;
