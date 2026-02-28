import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getProctorSession, clearSession } from '../../services/sessionStorage';
import ScoreboardDisplay from '../../components/game/ScoreboardDisplay';
import '../../styles/proctor.css';

const HostScoreboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFinal = searchParams.get('final') === 'true';
  
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

  // WebSocket connection - pass proctorPin as accessCode for authentication
  const {
    connected,
    error,
    questionNumber,
    totalQuestions,
    rankings,
    sendCommand,
    reconnect,
    disconnect,
  } = useWebSocket(
    session?.quizId || 0,
    'PROCTOR',
    undefined,  // teamId (not used for proctor)
    undefined,  // teamName (not used for proctor)
    session?.proctorPin  // accessCode for WebSocket authentication
  );

  // Redirect to login if no session
  useEffect(() => {
    if (!session) {
      navigate('/proctor/login');
    }
  }, [session, navigate]);

  const handleNextQuestion = () => {
    sendCommand({ type: 'NEXT_QUESTION' });
    navigate(`/host/game?quizId=${session?.quizId}`);
  };

  const handleEndQuiz = () => {
    sendCommand({ type: 'END_QUIZ' });
  };

  const handleReturnToLogin = () => {
    disconnect();
    clearSession();
    navigate('/proctor/login');
  };

  const handleNewQuiz = () => {
    disconnect();
    clearSession();
    navigate('/proctor/login');
  };

  if (!session) return null;

  return (
    <div className="proctor-page">
      {/* Page Header */}
      <div className="proctor-page-header">
        <div className="proctor-header-decoration proctor-header-decoration-1"></div>
        <div className="proctor-header-decoration proctor-header-decoration-2"></div>
        <h1 className="proctor-page-title">{session.quizTitle}</h1>
        <p className="proctor-page-subtitle">
          {isFinal ? 'Final Results' : `Question ${questionNumber} of ${totalQuestions}`}
        </p>
        <div className="proctor-connection-badge">
          <span className={`proctor-status-dot ${connected ? 'proctor-status-connected' : 'proctor-status-disconnected'}`}></span>
          <span>{connected ? 'Live' : 'Disconnected'}</span>
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
      <div className="proctor-content">
        <div className="proctor-container proctor-container-narrow">
          {/* Scoreboard */}
          <ScoreboardDisplay
            rankings={rankings}
            isFinal={isFinal}
          />

          {/* Controls */}
          <div className="proctor-scoreboard-controls">
            {isFinal ? (
              <div className="proctor-final-controls">
                <p className="proctor-final-message">
                  🎉 Quiz Complete! Thank you for hosting.
                </p>
                <div className="proctor-actions">
                  <button
                    onClick={handleNewQuiz}
                    className="proctor-btn-primary proctor-btn-large"
                  >
                    Host Another Quiz
                  </button>
                  <button
                    onClick={handleReturnToLogin}
                    className="proctor-btn-secondary"
                  >
                    Return to Login
                  </button>
                </div>
              </div>
            ) : (
              <div className="proctor-actions">
                {questionNumber < totalQuestions ? (
                  <button
                    onClick={handleNextQuestion}
                    disabled={!connected}
                    className="proctor-btn-success proctor-btn-large"
                  >
                    Next Question →
                  </button>
                ) : (
                  <button
                    onClick={handleEndQuiz}
                    disabled={!connected}
                    className="proctor-btn-primary proctor-btn-large"
                  >
                    🏆 Show Final Results
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostScoreboard;
