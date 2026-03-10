import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../../services/sessionStorage';
import '../../styles/participant.css';

interface SessionTerminatedProps {
  reason?: string;
}

const SessionTerminated: React.FC<SessionTerminatedProps> = () => {
  const navigate = useNavigate();

  // Retrieve kick reason from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const reason = searchParams.get('reason') || 'You have been removed from the session.';

  const handleReturnToHome = () => {
    clearSession();
    navigate('/');
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
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '36px',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
        }}>
          ✕
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#880015',
          marginBottom: '12px',
          fontFamily: 'Montserrat, sans-serif',
        }}>
          Session Terminated
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          marginBottom: '24px',
          lineHeight: '1.6',
        }}>
          You have been removed from the quiz session.
        </p>

        {/* Reason Card */}
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '32px',
        }}>
          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#991b1b',
            marginBottom: '4px',
          }}>
            Reason
          </p>
          <p style={{
            fontSize: '15px',
            color: '#b91c1c',
          }}>
            {reason}
          </p>
        </div>

        {/* Info */}
        <p style={{
          fontSize: '13px',
          color: '#9ca3af',
          marginBottom: '24px',
        }}>
          If you believe this was an error, please contact your proctor or examiner.
        </p>

        {/* Return Button */}
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
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 15px rgba(136, 0, 21, 0.3)',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default SessionTerminated;
