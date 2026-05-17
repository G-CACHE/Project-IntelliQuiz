import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accessApi } from '../../services/api';
import { getOrCreateDeviceId } from '../../services/deviceId';
import { clearSession, getParticipantSession } from '../../services/sessionStorage';
import '../../styles/participant.css';

interface SessionTerminatedProps {
  reason?: string;
}

const POLL_INTERVAL_MS = 5000;

const SessionTerminated: React.FC<SessionTerminatedProps> = () => {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const reason = searchParams.get('reason') || 'You have been removed from the session.';

  const session = getParticipantSession();
  const [waitingForApproval, setWaitingForApproval] = useState(!!session);
  const [approved, setApproved] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll the access check endpoint so the participant knows the moment they're approved.
  useEffect(() => {
    if (!session || !waitingForApproval) return;

    const check = async () => {
      try {
        const access = await accessApi.checkParticipantAccess(
          session.quizId,
          session.teamId,
          getOrCreateDeviceId(),
        );
        if (access.allowed) {
          setApproved(true);
          setWaitingForApproval(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Network error — keep polling
      }
    };

    pollRef.current = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [session, waitingForApproval]);

  const handleReturnToHome = () => {
    clearSession();
    navigate('/');
  };

  const handleRejoin = () => {
    if (session) {
      navigate(`/player/lobby?quizId=${session.quizId}&teamId=${session.teamId}`);
    }
  };

  return (
    <div className="participant-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '48px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
      }}>
        {/* Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: approved
            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '36px',
          color: '#fff',
          boxShadow: approved
            ? '0 4px 20px rgba(34, 197, 94, 0.3)'
            : '0 4px 20px rgba(239, 68, 68, 0.3)',
          transition: 'background 0.4s, box-shadow 0.4s',
        }}>
          {approved ? '✓' : '✕'}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          color: approved ? '#15803d' : '#880015',
          marginBottom: '12px',
          fontFamily: 'Montserrat, sans-serif',
          transition: 'color 0.4s',
        }}>
          {approved ? 'Approved to Rejoin' : 'Session Terminated'}
        </h1>

        {approved ? (
          <>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px', lineHeight: '1.6' }}>
              The host has approved your re-entry. You can now rejoin the quiz.
            </p>
            <button
              onClick={handleRejoin}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                fontFamily: 'Montserrat, sans-serif',
                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
              }}
            >
              Rejoin Quiz
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>
              You have been removed from the quiz session.
            </p>

            {/* Reason Card */}
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#991b1b', marginBottom: '4px' }}>
                Reason
              </p>
              <p style={{ fontSize: '15px', color: '#b91c1c' }}>{reason}</p>
            </div>

            {waitingForApproval && (
              <div style={{
                background: '#fef9c3',
                border: '1px solid #fde047',
                borderRadius: '12px',
                padding: '14px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{ fontSize: '20px' }}>⏳</span>
                <p style={{ fontSize: '14px', color: '#854d0e', margin: 0 }}>
                  Waiting for the host to approve your re-entry...
                </p>
              </div>
            )}

            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px' }}>
              If you believe this was an error, please contact your proctor or examiner.
            </p>

            <button
              onClick={handleReturnToHome}
              style={{
                background: 'linear-gradient(135deg, #880015 0%, #a50019 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                fontFamily: 'Montserrat, sans-serif',
                boxShadow: '0 4px 15px rgba(136, 0, 21, 0.3)',
              }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.transform = 'translateY(0)' }}
            >
              Return to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SessionTerminated;
