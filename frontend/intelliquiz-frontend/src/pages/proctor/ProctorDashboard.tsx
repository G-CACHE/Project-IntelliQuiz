import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getProctorSession } from '../../services/sessionStorage';
import type { ViolationNotification } from '../../services/api';
import '../../styles/proctor.css';

const ProctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [autoKickThreshold, setAutoKickThresholdLocal] = useState(5);
  const [showKickConfirm, setShowKickConfirm] = useState<{ teamId: number; teamName: string } | null>(null);

  // Get session data
  const [session] = useState(() => {
    const stored = getProctorSession();
    if (stored) return stored;
    const quizId = searchParams.get('quizId');
    if (quizId) {
      return { quizId: parseInt(quizId), quizTitle: 'Quiz', proctorPin: '' };
    }
    return null;
  });

  const {
    connected,
    error,
    violations,
    connectedTeams,
    kickTeam,
    setAutoKickThreshold,
    reconnect,
  } = useWebSocket(
    session?.quizId || 0,
    'PROCTOR',
    undefined,
    undefined,
    session?.proctorPin
  );

  // Aggregate violation counts per team
  const teamViolationCounts = useMemo(() => {
    const counts: Record<number, { teamName: string; count: number; lastType: string }> = {};
    violations.forEach((v: ViolationNotification) => {
      if (!counts[v.teamId]) {
        counts[v.teamId] = { teamName: v.teamName, count: 0, lastType: '' };
      }
      counts[v.teamId].count = v.totalCount;
      counts[v.teamId].lastType = v.lastType;
    });
    return counts;
  }, [violations]);

  // Handle threshold change
  const handleThresholdChange = useCallback((value: number) => {
    setAutoKickThresholdLocal(value);
    setAutoKickThreshold(value);
  }, [setAutoKickThreshold]);

  // Handle manual kick
  const handleKick = useCallback((teamId: number, teamName: string) => {
    kickTeam(teamId, teamName);
    setShowKickConfirm(null);
  }, [kickTeam]);

  if (!session) {
    navigate('/proctor/login');
    return null;
  }

  // Get violation severity color
  const getSeverityColor = (count: number): string => {
    if (count >= autoKickThreshold) return '#ef4444';
    if (count >= autoKickThreshold * 0.6) return '#f59e0b';
    return '#10b981';
  };

  // Format violation type for display
  const formatViolationType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="proctor-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fc 0%, #eef1f5 100%)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #880015 0%, #a50019 50%, #6b0012 100%)',
        padding: '20px 32px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
            🛡️ Proctor Dashboard
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.8, margin: '4px 0 0' }}>
            {session.quizTitle} — Real-time Monitoring
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connected ? '#10b981' : '#ef4444',
            }}></span>
            {connected ? 'Live' : 'Disconnected'}
          </span>
          <button
            onClick={() => navigate('/host/game')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            ← Back to Game
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ background: '#fee2e2', padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#991b1b', fontSize: '14px', margin: 0 }}>{error}</p>
          <button onClick={reconnect} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' }}>
            Reconnect
          </button>
        </div>
      )}

      {/* Main Content */}
      <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column - Team Monitor */}
        <div>
          {/* Auto-Kick Threshold */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginBottom: '16px', fontFamily: 'Montserrat, sans-serif' }}>
              ⚙️ Auto-Kick Settings
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                Violation Threshold:
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={autoKickThreshold}
                onChange={(e) => handleThresholdChange(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{
                background: '#880015',
                color: '#fff',
                borderRadius: '8px',
                padding: '4px 12px',
                fontSize: '14px',
                fontWeight: 700,
                minWidth: '36px',
                textAlign: 'center',
              }}>
                {autoKickThreshold}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
              Teams will be automatically kicked after reaching this many violations.
            </p>
          </div>

          {/* Connected Teams */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginBottom: '16px', fontFamily: 'Montserrat, sans-serif' }}>
              👥 Connected Teams ({connectedTeams.length})
            </h3>
            {connectedTeams.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
                No teams connected yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {connectedTeams.map((team) => {
                  const violation = teamViolationCounts[team.id];
                  const count = violation?.count || 0;
                  return (
                    <div key={team.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: count > 0 ? '#fef2f2' : '#f0fdf4',
                      border: `1px solid ${count > 0 ? '#fecaca' : '#bbf7d0'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                          {team.name}
                        </span>
                        {count > 0 && (
                          <span style={{
                            background: getSeverityColor(count),
                            color: '#fff',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}>
                            {count} violation{count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowKickConfirm({ teamId: team.id, teamName: team.name })}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Kick
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Violation Feed */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          maxHeight: 'calc(100vh - 200px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginBottom: '16px', fontFamily: 'Montserrat, sans-serif' }}>
            🚨 Violation Feed ({violations.length})
          </h3>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {violations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>✓</p>
                <p style={{ fontSize: '14px' }}>No violations detected. All teams are behaving.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...violations].reverse().map((v, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: v.autoKicked ? '#fef2f2' : '#fffbeb',
                    border: `1px solid ${v.autoKicked ? '#fecaca' : '#fde68a'}`,
                    position: 'relative',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#1f2937' }}>
                          {v.teamName}
                        </span>
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: v.autoKicked ? '#ef4444' : '#f59e0b',
                          background: v.autoKicked ? '#fee2e2' : '#fef3c7',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}>
                          {formatViolationType(v.lastType)}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>
                        #{v.totalCount}
                      </span>
                    </div>
                    {v.autoKicked && (
                      <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, marginTop: '4px' }}>
                        ⛔ Auto-kicked from session
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kick Confirmation Modal */}
      {showKickConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
              Kick Team?
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
              Are you sure you want to remove <strong>{showKickConfirm.teamName}</strong> from the session? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowKickConfirm(null)}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleKick(showKickConfirm.teamId, showKickConfirm.teamName)}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Kick Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProctorDashboard;
