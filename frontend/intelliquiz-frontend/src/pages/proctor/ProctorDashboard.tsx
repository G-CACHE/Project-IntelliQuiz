import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { accessApi, violationApi, type ViolationLogRecord, type ViolationNotification } from '../../services/api';
import { getOrCreateDeviceId } from '../../services/deviceId';
import { clearSession, getProctorSession } from '../../services/sessionStorage';
import { useSSE } from '../../hooks/useSSE';
import Timer from '../../components/game/Timer';
import '../../styles/proctor.css';

interface LockStatusResponse {
  isLocked: boolean;
  connectedDeviceIds: string[];
}

const ProctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [autoKickThreshold, setAutoKickThresholdLocal] = useState(5);
  const [showKickConfirm, setShowKickConfirm] = useState<{ teamId: number; teamName: string } | null>(null);
  const [accessChecking, setAccessChecking] = useState(true);
  const [lockState, setLockState] = useState<LockStatusResponse>({ isLocked: false, connectedDeviceIds: [] });
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [violationHistory, setViolationHistory] = useState<ViolationLogRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [noticeModal, setNoticeModal] = useState<{ title: string; message: string; onClose?: () => void } | null>(null);

  const [session] = useState(() => {
    const stored = getProctorSession();
    if (stored) return stored;
    const quizId = searchParams.get('quizId');
    if (quizId) {
      return { quizId: parseInt(quizId, 10), quizTitle: 'Quiz', proctorPin: '' };
    }
    return null;
  });

  const {
    connected,
    error,
    gameState,
    participantNavigationEnabled,
    timeRemaining,
    timerTotalTime,
    violations,
    submissions,
    connectedTeams,
    kickedTeams,
    kickTeam,
    approveReentry,
    setAutoKickThreshold,
    reconnect,
    refreshProctorSnapshot,
  } = useSSE(
    session?.quizId || 0,
    'PROCTOR',
    undefined,
    session?.proctorPin
  );

  const refreshLockStatus = useCallback(async () => {
    if (!session?.quizId) return;
    try {
      const response = await fetch(`/api/quiz/${session.quizId}/lock-status`, { credentials: 'include' });
      const payload = await response.json() as LockStatusResponse;
      if (!response.ok) {
        throw new Error('Unable to load lock status');
      }
      setLockState(payload);
      setLockError(null);
    } catch (err) {
      setLockError(err instanceof Error ? err.message : 'Unable to load lock status');
    }
  }, [session?.quizId]);

  const refreshViolationHistory = useCallback(async () => {
    if (!session?.quizId) return;
    setHistoryLoading(true);
    try {
      const records = await violationApi.getHistory(session.quizId, { limit: 500 });
      setViolationHistory(records);
      setHistoryError(null);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Unable to load violation history');
    } finally {
      setHistoryLoading(false);
    }
  }, [session?.quizId]);

  const toggleLockEntry = useCallback(async () => {
    if (!session?.quizId) return;
    setLockLoading(true);
    setLockError(null);
    try {
      const endpoint = lockState.isLocked ? 'unlock' : 'lock';
      const response = await fetch(`/api/quiz/${session.quizId}/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to update lock state');
      }
      await refreshLockStatus();
    } catch (err) {
      setLockError(err instanceof Error ? err.message : 'Failed to update lock state');
    } finally {
      setLockLoading(false);
    }
  }, [lockState.isLocked, refreshLockStatus, session?.quizId]);

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

        // If quiz is archived, go straight to final/results host view.
        if (result.quiz.status === 'ARCHIVED') {
          navigate('/host/game');
          return;
        }

        await Promise.all([refreshLockStatus(), refreshViolationHistory(), refreshProctorSnapshot()]);
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
  }, [navigate, refreshLockStatus, refreshProctorSnapshot, refreshViolationHistory, session?.proctorPin]);

  useEffect(() => {
    if (!session?.quizId || accessChecking) {
      return;
    }
    refreshViolationHistory();
  }, [accessChecking, refreshViolationHistory, session?.quizId, violations.length]);

  const teamViolationCounts = useMemo(() => {
    const counts: Record<number, { teamName: string; count: number; lastType: string }> = {};
    violations.forEach((v: ViolationNotification) => {
      counts[v.teamId] = {
        teamName: v.teamName,
        count: v.totalCount,
        lastType: v.lastType,
      };
    });
    return counts;
  }, [violations]);

  const submittedTeamIds = useMemo(() => {
    const ids = new Set<number>();
    submissions.forEach((s: any) => {
      const id = Number(s?.teamId ?? s?.id ?? s?.payload);
      if (Number.isFinite(id) && id > 0) {
        ids.add(id);
      }
    });
    return ids;
  }, [submissions]);

  const submittedTeams = useMemo(
    () => connectedTeams.filter((team) => submittedTeamIds.has(team.id)),
    [connectedTeams, submittedTeamIds]
  );

  const pendingTeams = useMemo(
    () => connectedTeams.filter((team) => !submittedTeamIds.has(team.id)),
    [connectedTeams, submittedTeamIds]
  );

  const handleThresholdChange = useCallback((value: number) => {
    setAutoKickThresholdLocal(value);
    setAutoKickThreshold(value);
  }, [setAutoKickThreshold]);

  useEffect(() => {
    // Keep backend threshold in sync with the UI's displayed value.
    // Without this, auto-kick stays disabled until the slider is manually moved.
    setAutoKickThreshold(autoKickThreshold);
  }, [autoKickThreshold, setAutoKickThreshold]);

  const handleKick = useCallback((teamId: number, teamName: string) => {
    kickTeam(teamId, teamName);
    void refreshProctorSnapshot();
    setShowKickConfirm(null);
  }, [kickTeam, refreshProctorSnapshot]);

  const handleApproveReentry = useCallback((teamId: number) => {
    approveReentry(teamId);
    void refreshProctorSnapshot();
  }, [approveReentry, refreshProctorSnapshot]);

  const backRoute = gameState === 'LOBBY' ? '/host/lobby' : '/host/game';
  const backLabel = gameState === 'LOBBY' ? 'Back to Lobby' : 'Back to Game';

  if (!session) {
    navigate('/');
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

  const formatViolationType = (type?: string | null): string => {
    const safeType = typeof type === 'string' ? type : 'UNKNOWN';
    return safeType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDetectedAt = (detectedAt: string): string => {
    const date = new Date(detectedAt);
    if (Number.isNaN(date.getTime())) {
      return detectedAt;
    }
    return date.toLocaleString();
  };

  return (
    <div className="proctor-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fffaf2 0%, #fdf4df 100%)' }}>
      <div style={{ background: 'linear-gradient(120deg, #5f1027 0%, #7a1733 58%, #9f2346 100%)', padding: '20px 32px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Proctor Dashboard</h1>
          <p style={{ fontSize: '14px', opacity: 0.85, margin: '4px 0 0' }}>{session.quizTitle} - Real-time Monitoring</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {participantNavigationEnabled && (gameState === 'QUESTION' || gameState === 'ACTIVE' || gameState === 'PAUSED' || gameState === 'SCOREBOARD' || gameState === 'ROUND_SUMMARY') && (
            <div style={{ minWidth: 190 }}>
              <Timer timeRemaining={timeRemaining} totalTime={timerTotalTime || 1} displayMode="clock" />
            </div>
          )}
          <span style={{ background: connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
            {connected ? 'Live' : 'Disconnected'}
          </span>
          <button onClick={() => navigate(backRoute)} style={{ background: 'rgba(250,237,192,0.14)', border: '1px solid rgba(250,237,192,0.36)', color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            {backLabel}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff1f4', padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#991b1b', fontSize: 14, margin: 0 }}>{error}</p>
          <button onClick={reconnect} style={{ background: '#9f2346', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>Reconnect</button>
        </div>
      )}

      <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 10px 24px rgba(95,16,39,0.09)', border: '1px solid #e7d8dc' }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Auto-Kick Settings</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ fontSize: 13, color: '#5d3a43' }}>Violation Threshold:</label>
              <input type="range" min={1} max={20} value={autoKickThreshold} onChange={(e) => handleThresholdChange(parseInt(e.target.value, 10))} style={{ flex: 1 }} />
              <strong>{autoKickThreshold}</strong>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 10px 24px rgba(95,16,39,0.09)', border: '1px solid #e7d8dc' }}>
            <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 16 }}>Lock Entry</h3>
            <p style={{ marginTop: 0, fontSize: 13, color: '#5d3a43' }}>
              Uses browser identity. When locked, only previously recognized devices can rejoin if accidentally disconnected.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: lockState.isLocked ? '#9f2346' : '#7a1733' }}>
                {lockState.isLocked ? 'Locked' : 'Unlocked'}
              </span>
              <button
                onClick={toggleLockEntry}
                disabled={lockLoading}
                style={{ background: lockState.isLocked ? '#d4a017' : '#9f2346', color: lockState.isLocked ? '#2b1a00' : '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                {lockLoading ? 'Saving...' : lockState.isLocked ? 'Unlock Entry' : 'Lock Entry'}
              </button>
              <button onClick={refreshLockStatus} style={{ background: '#fff3dd', border: '1px solid #e8ced6', color: '#7a1733', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                Refresh
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#6f4e57' }}>
              Known devices: {lockState.connectedDeviceIds.length}
            </p>
            {lockError && <p style={{ marginBottom: 0, color: '#b91c1c', fontSize: 12 }}>{lockError}</p>}
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 10px 24px rgba(95,16,39,0.09)', border: '1px solid #e7d8dc' }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Connected Teams ({connectedTeams.length})</h3>
            {connectedTeams.length === 0 ? (
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>No connected teams yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {connectedTeams.map((team) => (
                  <div key={team.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, border: '1px solid #e7d8dc', background: '#fffcf7' }}>
                    <div>
                      <strong style={{ fontSize: 14 }}>{team.name}</strong>
                      {teamViolationCounts[team.id] && (
                        <p style={{ margin: 0, fontSize: 12, color: '#7a1733' }}>
                          Violations: {teamViolationCounts[team.id].count} ({formatViolationType(teamViolationCounts[team.id].lastType)})
                        </p>
                      )}
                    </div>
                    <button onClick={() => setShowKickConfirm({ teamId: team.id, teamName: team.name })} style={{ background: '#9f2346', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                      Kick
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 10px 24px rgba(95,16,39,0.09)', border: '1px solid #e7d8dc' }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Submission Status</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#6f4e57' }}>Submitted: {submittedTeams.length} | Not Yet: {pendingTeams.length}</p>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 10px 24px rgba(95,16,39,0.09)', border: '1px solid #e7d8dc' }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Kicked Teams ({kickedTeams.length})</h3>
            {kickedTeams.length === 0 ? (
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>No kicked teams awaiting approval.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {kickedTeams.map((team) => (
                  <div key={team.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: '#fff1f4', border: '1px solid #f1c7d4' }}>
                    <div>
                      <strong style={{ fontSize: 14, color: '#7a1733' }}>{team.name}</strong>
                      <p style={{ margin: 0, fontSize: 12, color: '#9f2346' }}>{team.reason}</p>
                    </div>
                    <button onClick={() => handleApproveReentry(team.id)} style={{ background: '#d4a017', color: '#2b1a00', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                      Approve Re-entry
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 10px 24px rgba(95,16,39,0.09)', border: '1px solid #e7d8dc', maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Violation History ({violationHistory.length})</h3>
            <button onClick={refreshViolationHistory} style={{ background: '#fff3dd', border: '1px solid #e8ced6', color: '#7a1733', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Refresh
            </button>
          </div>

          {historyError && (
            <p style={{ marginTop: 0, color: '#b91c1c', fontSize: 12 }}>{historyError}</p>
          )}

          {historyLoading ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Loading violation history...</p>
          ) : violationHistory.length === 0 ? (
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>No persisted violations yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {violationHistory.map((v) => (
                <div key={v.id} style={{ border: '1px solid #f1d99b', background: '#fffbf2', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{v.teamName}</strong>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{formatDetectedAt(v.detectedAt)}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7a1733' }}>{formatViolationType(v.violationType)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showKickConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 420, width: '94%', border: '1px solid #e7d8dc' }}>
            <h3 style={{ marginTop: 0 }}>Kick Team?</h3>
            <p style={{ fontSize: 14, color: '#475569' }}>
              Remove <strong>{showKickConfirm.teamName}</strong> from this quiz session?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowKickConfirm(null)} style={{ background: '#fff3dd', border: '1px solid #e8ced6', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#7a1733' }}>Cancel</button>
              <button onClick={() => handleKick(showKickConfirm.teamId, showKickConfirm.teamName)} style={{ background: '#9f2346', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>Kick Team</button>
            </div>
          </div>
        </div>
      )}

      {noticeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 420, width: '94%', border: '1px solid #e7d8dc' }}>
            <h3 style={{ marginTop: 0 }}>{noticeModal.title}</h3>
            <p style={{ fontSize: 14, color: '#475569' }}>{noticeModal.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  const handler = noticeModal.onClose;
                  setNoticeModal(null);
                  if (handler) handler();
                }}
                style={{ background: '#9f2346', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}
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

export default ProctorDashboard;
