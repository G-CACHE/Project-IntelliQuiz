import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { accessApi, violationApi, type ViolationLogRecord, type ViolationNotification } from '../../services/api';
import { getOrCreateDeviceId } from '../../services/deviceId';
import { clearSession, getProctorSession, saveProctorSession } from '../../services/sessionStorage';
import { useSSE } from '../../hooks/useSSE';
import Timer from '../../components/game/Timer';
import { parseSmartName } from '../../utils/nameUtils';
import '../../styles/proctor.css';

const Tooltip = ({ text }: { text: string }) => (
  <div className="proctor-tooltip-wrapper">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    <div className="proctor-tooltip-content">{text}</div>
  </div>
);

interface LockStatusResponse {
  isLocked: boolean;
  connectedDeviceIds: string[];
}

const ProctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [autoKickThreshold, setAutoKickThresholdLocal] = useState(5);
  const [showKickConfirm, setShowKickConfirm] = useState<{ teamId: number; teamName: string } | null>(null);
  const [kickReasons, setKickReasons] = useState<string[]>([]);
  const [accessChecking, setAccessChecking] = useState(true);
  const [lockState, setLockState] = useState<LockStatusResponse>({ isLocked: false, connectedDeviceIds: [] });
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [violationHistory, setViolationHistory] = useState<ViolationLogRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [noticeModal, setNoticeModal] = useState<{ title: string; message: string; onClose?: () => void } | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [resettingDeviceTeamId, setResettingDeviceTeamId] = useState<number | null>(null);

  const [session] = useState(() => {
    const stored = getProctorSession();
    if (stored) return stored;
    const quizId = searchParams.get('quizId');
    const pin = searchParams.get('pin');
    if (quizId && pin) {
      // Opened in a new tab from HostGame — bootstrap the session from URL params
      return saveProctorSession(parseInt(quizId, 10), 'Quiz', pin);
    }
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
        teamName: parseSmartName(v.teamName).name,
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
    const reasonText = kickReasons.length > 0
      ? kickReasons.join(', ')
      : 'No specific reason provided';
    kickTeam(teamId, `${teamName}: ${reasonText}`);
    void refreshProctorSnapshot();
    setShowKickConfirm(null);
    setKickReasons([]);
  }, [kickTeam, kickReasons, refreshProctorSnapshot]);

  const handleApproveReentry = useCallback((teamId: number) => {
    approveReentry(teamId);
    void refreshProctorSnapshot();
  }, [approveReentry, refreshProctorSnapshot]);

  const handleResetDevice = useCallback(async (teamId: number) => {
    if (!session?.quizId) return;
    setResettingDeviceTeamId(teamId);
    try {
      await violationApi.resetTeamDevice(session.quizId, teamId);
    } catch {
      // ignore — the action is best-effort; the team can try again
    } finally {
      setResettingDeviceTeamId(null);
    }
  }, [session?.quizId]);

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
    <div className="proctor-root">
      <div className="proctor-sticky-header">
        <div>
          <h1 className="proctor-sticky-header-title">{session.quizTitle}</h1>
          <p className="proctor-sticky-header-subtitle">Real-time Dashboard & Control</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {participantNavigationEnabled && (gameState === 'QUESTION' || gameState === 'ACTIVE' || gameState === 'PAUSED' || gameState === 'SCOREBOARD' || gameState === 'ROUND_SUMMARY') && (
            <div style={{ minWidth: 190, color: '#fff' }}>
              <Timer timeRemaining={timeRemaining} totalTime={timerTotalTime || 1} displayMode="clock" />
            </div>
          )}
          <span className={`proctor-badge ${connected ? 'proctor-badge-success' : 'proctor-badge-danger'}`} style={{ border: 'none', background: connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: '#fff' }}>
            {connected ? 'LIVE' : 'DISCONNECTED'}
          </span>
          <button onClick={() => setShowGuideModal(true)} className="proctor-btn" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
             Help & Guide
          </button>
          <button onClick={() => navigate(backRoute)} className="proctor-btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            {backLabel}
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {error && (
          <div className="proctor-alert proctor-alert-error">
            <div className="proctor-alert-content">
              <p style={{ margin: 0 }}>{error}</p>
            </div>
            <button onClick={reconnect} className="proctor-btn proctor-btn-danger">Reconnect</button>
          </div>
        )}

        <div className="proctor-bento-container">
          {/* LEFT COLUMN: Controls & Stats */}
          <div className="proctor-bento-left">
            {/* Quick Stats Row */}
            <div className="proctor-grid-3">
               <div className="proctor-stat-card">
                 <div className="proctor-stat-value">{connectedTeams.length}</div>
                 <div className="proctor-stat-label">Teams Connected</div>
               </div>
               <div className="proctor-stat-card">
                 <div className="proctor-stat-value">{submittedTeams.length}</div>
                 <div className="proctor-stat-label">Submissions</div>
               </div>
               <div className="proctor-stat-card">
                 <div className="proctor-stat-value">{kickedTeams.length}</div>
                 <div className="proctor-stat-label">Kicked Teams</div>
               </div>
            </div>

            {/* Settings & Teams */}
            <div className="proctor-grid-2">
              <div className="proctor-card">
                <h3 className="proctor-data-card-title">Security & Access</h3>
                
                <div style={{ marginTop: 20 }}>
                  <label className="proctor-form-label">
                    Auto-Kick Threshold
                    <Tooltip text="Automatically kicks a team out of the quiz if they exceed this many tab switches or focus losses." />
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <input type="range" min={1} max={20} value={autoKickThreshold} onChange={(e) => handleThresholdChange(parseInt(e.target.value, 10))} style={{ flex: 1, accentColor: '#f8c107' }} />
                    <strong style={{ fontSize: 18, color: '#1e293b' }}>{autoKickThreshold}</strong>
                  </div>
                </div>

                <div style={{ marginTop: 32 }}>
                  <label className="proctor-form-label" style={{ marginBottom: 16 }}>
                    Lock Quiz Entry
                    <Tooltip text="When locked, no new devices can join the session. Previously recognized devices can still reconnect if they drop out." />
                  </label>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      onClick={toggleLockEntry}
                      disabled={lockLoading}
                      className={`proctor-btn ${lockState.isLocked ? 'proctor-btn-warning' : 'proctor-btn-primary'}`}
                    >
                      {lockLoading ? 'Saving...' : lockState.isLocked ? 'Unlock Entry' : 'Lock Entry'}
                    </button>
                    <button onClick={refreshLockStatus} className="proctor-btn proctor-btn-info">
                      Refresh
                    </button>
                    <span className={`proctor-badge ${lockState.isLocked ? 'proctor-badge-danger' : 'proctor-badge-gray'}`} style={{ marginLeft: 'auto' }}>
                      {lockState.isLocked ? 'LOCKED' : 'UNLOCKED'}
                    </span>
                  </div>
                  {lockError && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{lockError}</p>}
                </div>
              </div>

              {/* Connected Teams List */}
              <div className="proctor-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 className="proctor-data-card-title">Active Teams ({connectedTeams.length})</h3>
                
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px', marginTop: 12 }}>
                  {connectedTeams.length === 0 ? (
                    <div className="proctor-empty-state" style={{ padding: '40px 20px' }}>
                      <div style={{ opacity: 0.3, marginBottom: 10 }}>
                         <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      </div>
                      <p style={{ color: '#475569', fontSize: 14, fontWeight: 600, margin: '0 0 4px 0' }}>Waiting for teams...</p>
                      <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, maxWidth: 220, marginLeft: 'auto', marginRight: 'auto' }}>Teams will automatically appear here once they join your session via their devices.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {connectedTeams.map((team) => {
                        const { name } = parseSmartName(team.name);
                        return (
                          <div key={team.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <div>
                              <strong style={{ fontSize: 14 }}>{name}</strong>
                              {teamViolationCounts[team.id] && teamViolationCounts[team.id].count > 0 && (
                                <p style={{ margin: 0, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                                  {teamViolationCounts[team.id].count} Violations
                                </p>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={() => handleResetDevice(team.id)}
                                disabled={resettingDeviceTeamId === team.id}
                                className="proctor-btn proctor-btn-info"
                                style={{ padding: '6px 12px', fontSize: 12 }}
                                title="Clear the device lock so this team can log in from a different device"
                              >
                                {resettingDeviceTeamId === team.id ? 'Resetting…' : 'Reset Device'}
                              </button>
                              <button onClick={() => setShowKickConfirm({ teamId: team.id, teamName: name })} className="proctor-btn proctor-btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}>
                                Kick
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kicked Teams */}
            <div className="proctor-card">
              <h3 className="proctor-data-card-title">Kicked Teams Pending Re-entry ({kickedTeams.length})</h3>
              {kickedTeams.length === 0 ? (
                <p className="proctor-text-muted" style={{ fontSize: 13, margin: '12px 0 0' }}>No teams are currently locked out.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginTop: 16 }}>
                  {kickedTeams.map((team) => {
                    const { name: cleanName, avatarId } = parseSmartName(team.name);
                    // Parse reason — handle both "Reason: X, Y" and old "Name is kicked... Reason: X. Contact..." formats
                    // Strip smart name avatar part first (e.g. "Name|avatar.png is kicked...")
                    let reasonText = (team.reason || '').replace(/\|[^\s|]+/g, '').trim();
                    if (reasonText.startsWith('Reason:')) {
                      reasonText = reasonText.replace('Reason:', '').trim();
                    } else {
                      const match = reasonText.match(/Reason:\s*([^.]+)/i);
                      if (match) reasonText = match[1].trim();
                      else reasonText = 'Removed by proctor';
                    }
                    return (
                      <div key={team.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: '#fff1f2', border: '1px solid #ffe4e6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          {/* Avatar */}
                          <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: '#fecdd3', border: '2px solid #fda4af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {avatarId ? (
                              <img src={`/avatars/${avatarId}`} alt={cleanName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: 16, fontWeight: 800, color: '#9f1239' }}>{cleanName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ fontSize: 14, color: '#9f1239', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cleanName}</strong>
                            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#be123c', lineHeight: 1.4 }}>{reasonText}</p>
                          </div>
                        </div>
                        <button onClick={() => handleApproveReentry(team.id)} className="proctor-btn proctor-btn-secondary" style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}>
                          Approve
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Violation History Grid */}
          <div className="proctor-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="proctor-data-card-title" style={{ margin: 0 }}>Violation Log</h3>
              <button onClick={refreshViolationHistory} className="proctor-btn proctor-btn-info" style={{ padding: '6px 12px', fontSize: 12 }}>
                Refresh
              </button>
            </div>

            {historyError && (
              <p style={{ margin: '0 0 16px', color: '#dc2626', fontSize: 13 }}>{historyError}</p>
            )}

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: 8 }}>
              {historyLoading ? (
                <div className="proctor-loading-container" style={{ minHeight: '200px' }}>
                  <div className="proctor-loading-spinner-small"></div>
                </div>
              ) : violationHistory.length === 0 ? (
                 <div className="proctor-empty-state" style={{ padding: '60px 20px' }}>
                   <div style={{ opacity: 0.3, marginBottom: 12, color: '#f59e0b' }}>
                     <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                   </div>
                   <p style={{ color: '#475569', fontSize: 15, fontWeight: 600, margin: '0 0 6px 0' }}>Monitoring Active</p>
                   <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, maxWidth: 240, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>When a team switches tabs or loses focus on the quiz, an alert will be logged here in real-time.</p>
                 </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {violationHistory.map((v) => (
                    <div key={v.id} className="proctor-violation-card">
                      <div className="proctor-violation-card-core">
                        <div className="proctor-violation-icon-wrapper">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                        </div>
                        <div className="proctor-violation-details">
                          <h4 className="proctor-violation-team-name">{parseSmartName(v.teamName).name}</h4>
                          <span className="proctor-violation-type">{formatViolationType(v.violationType)}</span>
                        </div>
                      </div>
                      <span className="proctor-violation-time">{formatDetectedAt(v.detectedAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showKickConfirm && (
        <div className="proctor-modal-overlay">
          <div className="proctor-modal-content">
            <div className="proctor-modal-header">
              <h3 className="proctor-modal-title">Kick Team?</h3>
            </div>
            <div className="proctor-modal-body">
              <p style={{ fontSize: 15, color: '#475569', margin: '0 0 20px' }}>
                Remove <strong>{showKickConfirm.teamName}</strong> from this quiz session?
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select reason(s) for kicking:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { value: 'Tab Switch', label: 'Tab Switch — switched away from the quiz tab' },
                  { value: 'Copy Attempt', label: 'Copy Attempt — tried to copy quiz content' },
                  { value: 'Right Click', label: 'Right Click — attempted to right-click on the page' },
                  { value: 'Print Screen', label: 'Print Screen — attempted to capture the screen' },
                  { value: 'Misconduct', label: 'Misconduct — general disruptive behavior' },
                ].map(({ value, label }) => (
                  <label key={value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${kickReasons.includes(value) ? '#7a1733' : '#e2e8f0'}`, background: kickReasons.includes(value) ? '#fff0f3' : '#f8fafc', transition: 'all 0.15s' }}>
                    <input
                      type="checkbox"
                      checked={kickReasons.includes(value)}
                      onChange={(e) => {
                        setKickReasons(prev =>
                          e.target.checked ? [...prev, value] : prev.filter(r => r !== value)
                        );
                      }}
                      style={{ marginTop: 2, accentColor: '#7a1733', width: 16, height: 16, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.5 }}>{label}</span>
                  </label>
                ))}
              </div>
              {kickReasons.length === 0 && (
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, fontStyle: 'italic' }}>
                  No reason selected — a default message will be shown.
                </p>
              )}
            </div>
            <div className="proctor-modal-footer">
              <button onClick={() => { setShowKickConfirm(null); setKickReasons([]); }} className="proctor-btn proctor-btn-secondary">Cancel</button>
              <button onClick={() => handleKick(showKickConfirm.teamId, showKickConfirm.teamName)} className="proctor-btn proctor-btn-danger">Kick Team</button>
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
              <p style={{ fontSize: 15, color: '#475569', margin: 0 }}>{noticeModal.message}</p>
            </div>
            <div className="proctor-modal-footer">
              <button
                onClick={() => {
                  const handler = noticeModal.onClose;
                  setNoticeModal(null);
                  if (handler) handler();
                }}
                className="proctor-btn proctor-btn-primary"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuideModal && (
        <div className="proctor-modal-overlay">
          <div className="proctor-modal-content" style={{ maxWidth: 500 }}>
            <div className="proctor-modal-header">
              <h3 className="proctor-modal-title">Proctor & Host Guide</h3>
            </div>
            <div className="proctor-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <strong style={{ fontSize: 15, color: '#1e293b' }}>Auto-Kick Protocol</strong>
                <p style={{ fontSize: 14, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>When a team exceeds the set threshold for tab-switching or leaving the browser window, they will be automatically removed from the active session.</p>
              </div>
              <div>
                <strong style={{ fontSize: 15, color: '#1e293b' }}>Lock Entry Security</strong>
                <p style={{ fontSize: 14, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>Once all expected participants have connected, enable <strong>Lock Entry</strong> to prevent unfamiliar devices from guessing the code. Known devices can still reconnect if they accidentally drop out.</p>
              </div>
              <div>
                <strong style={{ fontSize: 15, color: '#1e293b' }}>Kicking & Approving</strong>
                <p style={{ fontSize: 14, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>Active teams can be manually kicked. Once kicked, they are locked out until you explicitly click <strong>Approve</strong> from the "Kicked Teams" panel.</p>
              </div>
            </div>
            <div className="proctor-modal-footer">
              <button onClick={() => setShowGuideModal(false)} className="proctor-btn proctor-btn-primary">Got it!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProctorDashboard;
