import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BiArrowBack,
  BiBookContent,
  BiTrophy,
  BiGroup,
  
  BiCopy,
  BiCheck,
  BiLockAlt,
  BiGlobe,
  BiRefresh,
  BiCog,
  BiX,
  BiErrorCircle,
  BiUserPlus,
} from 'react-icons/bi';
import { useQuiz, useQuizStatusChange, useRegisterTeam, useScoreboard, useTeams } from '../../hooks';
import QuestionsPage from './QuestionsPage';
import { quizzesApi, violationApi, type ViolationLogRecord } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin.css';
import './AdminRedesign.css';
import './QuizWorkspacePage.css';

type ScoreboardRow = {
  teamId: number;
  teamName: string;
  score: number;
  rank: number;
};

export default function QuizWorkspacePage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const parsedQuizId = quizId ? parseInt(quizId, 10) : 0;

  const { data: quiz, isLoading, refetch: refetchQuiz } = useQuiz(parsedQuizId);
  const { data: teams = [] } = useTeams(parsedQuizId);
  const registerTeam = useRegisterTeam(parsedQuizId);
  
  const { data: scoreboard = [], isLoading: scoreboardLoading, refetch: refetchScoreboard } = useScoreboard(parsedQuizId, { refetchInterval: 5000 });
  const statusChange = useQuizStatusChange();
  const { canEditQuiz, isSuperAdmin } = useAuth();

  const [copiedQuizCode, setCopiedQuizCode] = useState(false);
  const [copiedProctorPin, setCopiedProctorPin] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [settingsDraft, setSettingsDraft] = useState({
    accessMode: 'RESTRICTED' as 'PUBLIC' | 'RESTRICTED',
    navigationMode: 'TOURNAMENT' as 'TOURNAMENT' | 'CLASS',
    globalTimeLimitMinutes: 0,
    randomizeQuestions: false,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSnackbar, setSettingsSnackbar] = useState<string | null>(null);
  const [showScoreboardModal, setShowScoreboardModal] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [showRegisterTeamModal, setShowRegisterTeamModal] = useState(false);
  const [registerTeamName, setRegisterTeamName] = useState('');
  const [registerTeamError, setRegisterTeamError] = useState<string | null>(null);
  const [registerTeamSuccess, setRegisterTeamSuccess] = useState<string | null>(null);
  const [copiedTeamId, setCopiedTeamId] = useState<number | null>(null);
  const [violationLogs, setViolationLogs] = useState<ViolationLogRecord[]>([]);
  const [violationLogsLoading, setViolationLogsLoading] = useState(false);
  const [violationLogsError, setViolationLogsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'reports' | 'codes'>('config');
  const statusPillRef = useRef<HTMLButtonElement | null>(null);
  const draftLabelRef = useRef<HTMLSpanElement | null>(null);
  const readyLabelRef = useRef<HTMLSpanElement | null>(null);
  const [statusPillMetrics, setStatusPillMetrics] = useState({
    draftLeft: 0,
    draftWidth: 0,
    readyLeft: 0,
    readyWidth: 0,
  });
  // no inline question state here — questions use the full Questions page UI

  const hasEdit = !!quiz && (isSuperAdmin() || canEditQuiz(quiz.id, quiz.createdByUserId));
  const isDraftQuiz = quiz?.status === 'DRAFT';
  const canEditDraftOnly = hasEdit && isDraftQuiz;
  const isArchived = quiz?.status === 'ARCHIVED';

  const normalizedAccessMode = useMemo(() => {
    const raw = (quiz?.accessMode ?? (quiz as { quizAccessMode?: string } | undefined)?.quizAccessMode ?? '').toString().toUpperCase();
    return raw === 'RESTRICTED' ? 'RESTRICTED' : 'PUBLIC';
  }, [quiz]);

  const modeLabel = normalizedAccessMode === 'RESTRICTED' ? 'Restricted Mode' : 'Public Mode';
  const canManageRestrictedTeams = hasEdit && normalizedAccessMode === 'RESTRICTED' && !isArchived;

  useEffect(() => {
    if (!quiz) return;
    setSettingsDraft({
      accessMode: (quiz.accessMode || 'RESTRICTED') as 'PUBLIC' | 'RESTRICTED',
      navigationMode: (quiz.navigationMode || 'TOURNAMENT') as 'TOURNAMENT' | 'CLASS',
      globalTimeLimitMinutes: Math.floor((quiz.globalTimeLimitSeconds || 0) / 60),
      randomizeQuestions: !!quiz.randomizeQuestions,
    });
  }, [quiz]);

  useEffect(() => {
    if (!settingsSnackbar) return;
    const timer = window.setTimeout(() => setSettingsSnackbar(null), 4000);
    return () => window.clearTimeout(timer);
  }, [settingsSnackbar]);

  useEffect(() => {
    if (!registerTeamSuccess) return;
    const timer = window.setTimeout(() => setRegisterTeamSuccess(null), 3000);
    return () => window.clearTimeout(timer);
  }, [registerTeamSuccess]);

  useEffect(() => {
    if (!parsedQuizId) return;
    const loadViolationLogs = async () => {
      try {
        setViolationLogsLoading(true);
        const records = await violationApi.getHistory(parsedQuizId, { limit: 500 });
        setViolationLogs(records);
        setViolationLogsError(null);
      } catch (err) {
        setViolationLogsError(err instanceof Error ? err.message : 'Failed to load violation reports');
      } finally {
        setViolationLogsLoading(false);
      }
    };
    loadViolationLogs();
  }, [parsedQuizId]);

  const invalidClassTimer = useMemo(() => (
    settingsDraft.navigationMode === 'CLASS' &&
    (!Number.isFinite(settingsDraft.globalTimeLimitMinutes) || settingsDraft.globalTimeLimitMinutes < 1)
  ), [settingsDraft.navigationMode, settingsDraft.globalTimeLimitMinutes]);

  const hasSettingsChanges = useMemo(() => {
    if (!quiz) return false;
    return (
      settingsDraft.accessMode !== (quiz.accessMode || 'RESTRICTED') ||
      settingsDraft.navigationMode !== (quiz.navigationMode || 'TOURNAMENT') ||
      settingsDraft.globalTimeLimitMinutes !== Math.floor((quiz.globalTimeLimitSeconds || 0) / 60) ||
      settingsDraft.randomizeQuestions !== !!quiz.randomizeQuestions
    );
  }, [quiz, settingsDraft]);

  const normalizedScoreboard = useMemo<ScoreboardRow[]>(() => {
    const teamBasedScoreboard: ScoreboardRow[] = [...teams]
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((team, index) => ({
        teamId: team.id,
        teamName: team.name,
        score: team.totalScore,
        rank: index + 1,
      }));

    if (Array.isArray(scoreboard)) {
      const rows = scoreboard as ScoreboardRow[];
      const allZero = rows.length > 0 && rows.every((entry) => entry.score === 0);
      const teamHasScores = teams.some((team) => team.totalScore > 0);
      if (isArchived && allZero && teamHasScores) return teamBasedScoreboard;
      return rows;
    }

    return teamBasedScoreboard;
  }, [scoreboard, teams, isArchived]);

  const handleBackToQuizzes = () => {
    navigate('/admin/quizzes', { replace: true });
  };

  useLayoutEffect(() => {
    const button = statusPillRef.current;
    const draftLabel = draftLabelRef.current;
    const readyLabel = readyLabelRef.current;
    if (!button || !draftLabel || !readyLabel) return;

    const updateMetrics = () => {
      setStatusPillMetrics({
        draftLeft: draftLabel.offsetLeft,
        draftWidth: draftLabel.offsetWidth,
        readyLeft: readyLabel.offsetLeft,
        readyWidth: readyLabel.offsetWidth,
      });
    };

    updateMetrics();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateMetrics)
      : null;

    resizeObserver?.observe(button);
    resizeObserver?.observe(draftLabel);
    resizeObserver?.observe(readyLabel);
    window.addEventListener('resize', updateMetrics);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateMetrics);
    };
  }, [quiz?.status, quiz?.title]);

  const quizStatus = quiz?.status ?? 'DRAFT';
  const activeStatusPillMetrics = quizStatus === 'READY'
    ? { left: statusPillMetrics.readyLeft, width: statusPillMetrics.readyWidth }
    : { left: statusPillMetrics.draftLeft, width: statusPillMetrics.draftWidth };



  const handleStatusToggle = async () => {
    if (!quiz) return;
    setStatusError(null);
    try {
      if (quizStatus === 'DRAFT') return await statusChange.mutateAsync({ id: quiz.id, action: 'ready' });
      if (quizStatus === 'READY') return await statusChange.mutateAsync({ id: quiz.id, action: 'draft' });
      if (quizStatus === 'ACTIVE') return await statusChange.mutateAsync({ id: quiz.id, action: 'deactivate' });
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to change quiz status');
    }
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.error("Clipboard API failed", err);
      }
    }

    // Fallback for non-secure contexts (HTTP)
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error("Fallback copy failed", err);
      return false;
    }
  };

  const copyQuizCode = async () => {
    const resolvedQuizCode = quiz?.quizCode || '';
    if (!resolvedQuizCode) return;
    const success = await copyToClipboard(resolvedQuizCode);
    if (success) {
      setCopiedQuizCode(true);
      setTimeout(() => setCopiedQuizCode(false), 1500);
    }
  };

  const copyProctorPin = async () => {
    const resolvedProctorPin = quiz?.proctorPin || '';
    if (!resolvedProctorPin) return;
    const success = await copyToClipboard(resolvedProctorPin);
    if (success) {
      setCopiedProctorPin(true);
      setTimeout(() => setCopiedProctorPin(false), 1500);
    }
  };

  const copyTeamAccessCode = async (teamId: number, accessCode: string) => {
    if (!accessCode) return;
    const success = await copyToClipboard(accessCode);
    if (success) {
      setCopiedTeamId(teamId);
      setTimeout(() => setCopiedTeamId((prev) => (prev === teamId ? null : prev)), 1500);
    }
  };

  const handleRefreshViolationLogs = async () => {
    if (!parsedQuizId) return;
    try {
      setViolationLogsLoading(true);
      const records = await violationApi.getHistory(parsedQuizId, { limit: 500 });
      setViolationLogs(records);
      setViolationLogsError(null);
    } catch (err) {
      setViolationLogsError(err instanceof Error ? err.message : 'Failed to load violation reports');
    } finally {
      setViolationLogsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!quiz || !hasEdit) return;
    if (!isDraftQuiz) {
      setSettingsError('Quiz configuration can only be edited while status is Draft.');
      return;
    }
    setSettingsError(null);
    if (invalidClassTimer) {
      setSettingsError('Class mode timer must be at least 1 minute.');
      return;
    }
    if (!hasSettingsChanges) {
      setSettingsError('No changes to save. Update at least one field before saving.');
      return;
    }

    try {
      setSettingsSaving(true);
      await quizzesApi.update(quiz.id, {
        accessMode: settingsDraft.accessMode,
        navigationMode: settingsDraft.navigationMode,
        globalTimeLimitSeconds: settingsDraft.navigationMode === 'CLASS' ? settingsDraft.globalTimeLimitMinutes * 60 : 0,
        randomizeQuestions: settingsDraft.navigationMode === 'CLASS' ? settingsDraft.randomizeQuestions : false,
      });
      await refetchQuiz();
      await refetchScoreboard();
      setSettingsSnackbar('Quiz configuration saved successfully.');
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to save quiz settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleOpenRegisterModal = () => {
    setRegisterTeamError(null);
    setRegisterTeamSuccess(null);
    setRegisterTeamName('');
    setShowRegisterTeamModal(true);
  };

  const handleRegisterTeam = async () => {
    if (!parsedQuizId || !canManageRestrictedTeams) return;
    const trimmed = registerTeamName.trim();
    if (!trimmed) {
      setRegisterTeamError('Team name is required.');
      return;
    }

    try {
      setRegisterTeamError(null);
      await registerTeam.mutateAsync({ name: trimmed });
      setRegisterTeamSuccess(`Registered ${trimmed} successfully.`);
      setRegisterTeamName('');
    } catch (err) {
      setRegisterTeamError(err instanceof Error ? err.message : 'Failed to register team.');
    }
  };

  if (isLoading || !quiz) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">Loading quiz workspace...</p>
      </div>
    );
  }

  const formatViolationTime = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const formatViolationType = (value: string): string =>
    value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

  return (
    <div className="quiz-workspace-shell">
      <div className="quiz-workspace-hero">
        <div className="quiz-workspace-hero-header">
          <button type="button" className="quiz-workspace-back-btn" onClick={handleBackToQuizzes} aria-label="Back to quizzes">
            <BiArrowBack size={20} />
          </button>
            <div className="quiz-workspace-hero-content">
            <h1 className="quiz-workspace-title">{quiz.title}</h1>
            <p className="quiz-workspace-subtitle">
              {modeLabel} workspace controls{quiz?.status === 'ARCHIVED' ? ' — Reports' : ''}
            </p>
          </div>
          {quiz && hasEdit && (
            <button
              ref={statusPillRef}
              onClick={() => quizStatus !== 'ACTIVE' && quizStatus !== 'ARCHIVED' && handleStatusToggle()}
              disabled={statusChange.isPending || quizStatus === 'ACTIVE' || quizStatus === 'ARCHIVED'}
              className={`status-pill-btn ${quizStatus === 'READY' ? 'is-ready' : 'is-draft'}`}
              title={quizStatus === 'READY' ? 'Ready (click to mark Draft)' : 'Draft (click to mark Ready)'}
            >
              <span
                className="pill-highlighter"
                aria-hidden="true"
                style={{
                  left: `${activeStatusPillMetrics.left}px`,
                  width: `${activeStatusPillMetrics.width}px`,
                }}
              />
              <span ref={draftLabelRef} className={`pill-label pill-draft ${quizStatus === 'DRAFT' ? 'active' : ''}`}>Draft</span>
              <span className="pill-sep">|</span>
              <span ref={readyLabelRef} className={`pill-label pill-ready ${quizStatus === 'READY' ? 'active' : ''}`}>Ready</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation (reordered: Configuration, Questions, Actions, Codes, Reports) */}
      <div className="quiz-workspace-tabs-container">
        <div className="quiz-workspace-tabs">
          <button
            className={`quiz-workspace-tab ${activeTab === 'config' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            Configuration
          </button>
          <button
            className={`quiz-workspace-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Questions
          </button>
          <button
            className={`quiz-workspace-tab ${activeTab === 'codes' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('codes')}
          >
            Codes
          </button>
          {quiz?.status === 'ARCHIVED' && (
            <button
              className={`quiz-workspace-tab ${activeTab === 'reports' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reports
            </button>
          )}
        </div>
      </div>

      <div className="quiz-workspace-panel">

        {activeTab === 'overview' && (
          <div className="quiz-workspace-tab-content">
            <QuestionsPage />
          </div>
        )}

        {/* ACTIONS TAB removed — functionality moved into Configuration */}

        {/* CONFIGURATION TAB */}
        {activeTab === 'config' && (
          <div className="quiz-workspace-tab-content">
            <div className="quiz-workspace-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="quiz-workspace-section-title">Configuration</h2>
                <p className="quiz-workspace-section-text">
                  {normalizedAccessMode === 'PUBLIC'
                    ? 'Set up public access and quiz mode settings to control participation and participant experience.'
                    : 'Review the access mode details and quiz settings in one place.'}
                </p>
              </div>


            </div>

            <div className="config-grid-container">
              {normalizedAccessMode === 'RESTRICTED' ? (
                <>
                  <div className="admin-card workspace-info-strip">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <BiLockAlt size={20} />
                      <div>
                        <h4 style={{ margin: 0 }}>{modeLabel}</h4>
                        <p className="admin-empty-text" style={{ margin: 0 }}>
                          Entry is controlled by pre-registered team access codes for this quiz.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="admin-card manage-registered-full-card">
                    <h4 className="manage-registered-title"><BiGroup size={16} /> Manage Registered Teams</h4>
                    <p className="admin-empty-text" style={{ margin: '0 0 12px' }}>Register teams and view access codes.</p>
                    <button className="admin-btn admin-btn-secondary" onClick={() => handleOpenRegisterModal()} disabled={!canManageRestrictedTeams}>
                      Open
                    </button>
                  </div>
                </>
              ) : (
                <div className="admin-card workspace-info-strip" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <BiGlobe size={20} />
                    <div>
                      <h4 style={{ margin: 0 }}>{modeLabel}</h4>
                      <p className="admin-empty-text" style={{ margin: 0 }}>
                        Participants can join from the unified entry using quiz/team credentials.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-card workspace-config-card">
              <h3 className="admin-card-title" style={{ marginBottom: 12 }}><BiCog size={18} /> Quiz Configuration</h3>
              {!hasEdit ? (
                <p className="admin-empty-text">You do not have permission to edit this quiz configuration.</p>
              ) : !isDraftQuiz ? (
                <p className="admin-empty-text">Configuration is locked because this quiz is not in Draft status.</p>
              ) : (
                <>
                  <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <div>
                      <label className="admin-form-label">Access Mode</label>
                      <select
                        className="admin-form-input admin-form-select"
                        value={settingsDraft.accessMode}
                        disabled={!canEditDraftOnly || settingsSaving}
                        onChange={(e) => setSettingsDraft((prev) => ({ ...prev, accessMode: e.target.value as 'PUBLIC' | 'RESTRICTED' }))}
                      >
                        <option value="RESTRICTED">Restricted</option>
                        <option value="PUBLIC">Public</option>
                      </select>
                    </div>
                    <div>
                      <label className="admin-form-label">Quiz Mode</label>
                      <select
                        className="admin-form-input admin-form-select"
                        value={settingsDraft.navigationMode}
                        disabled={!canEditDraftOnly || settingsSaving}
                        onChange={(e) => setSettingsDraft((prev) => ({ ...prev, navigationMode: e.target.value as 'TOURNAMENT' | 'CLASS' }))}
                      >
                        <option value="TOURNAMENT">Tournament</option>
                        <option value="CLASS">Class</option>
                      </select>
                    </div>
                    {settingsDraft.navigationMode === 'CLASS' && (
                      <div>
                        <label className="admin-form-label">Quiz Duration (minutes)</label>
                        <input
                          type="number"
                          min={1}
                          className="admin-form-input"
                          value={settingsDraft.globalTimeLimitMinutes}
                          disabled={!canEditDraftOnly || settingsSaving}
                          onChange={(e) => setSettingsDraft((prev) => ({ ...prev, globalTimeLimitMinutes: Number(e.target.value || 0) }))}
                        />
                        {invalidClassTimer && (
                          <p className="admin-form-hint admin-form-hint-error" style={{ marginTop: 6 }}>
                            Please enter at least 1 minute.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {settingsDraft.navigationMode === 'CLASS' && (
                    <label className="admin-form-label" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={settingsDraft.randomizeQuestions}
                        onChange={(e) => setSettingsDraft((prev) => ({ ...prev, randomizeQuestions: e.target.checked }))}
                        disabled={!canEditDraftOnly || settingsSaving}
                      />
                      Randomize question order per participant
                    </label>
                  )}

                  {settingsError && <p className="admin-empty-text workspace-error-text">{settingsError}</p>}
                  <div style={{ marginTop: 12 }}>
                    <button className="admin-btn admin-btn-primary" onClick={handleSaveSettings} disabled={settingsSaving || !canEditDraftOnly}>
                      {settingsSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {settingsSnackbar && (
              <div className="admin-snackbar" role="status" aria-live="polite">
                {settingsSnackbar}
              </div>
            )}
          </div>
        )}

        {/* CODES TAB */}
        {activeTab === 'codes' && (
          <div className="quiz-workspace-tab-content">
            <div className="quiz-workspace-section-header">
              <div>
                <h2 className="quiz-workspace-section-title">Access Codes</h2>
                <p className="quiz-workspace-section-text">Share the quiz code and proctor PIN from these dedicated cards.</p>
              </div>
            </div>

            <div className="quiz-workspace-code-grid">
              <div className="admin-card workspace-code-card">
                <div className="workspace-code-copy">
                  <h4 style={{ margin: 0 }}>Quiz Code</h4>
                  <p className="admin-empty-text" style={{ margin: 0 }}>
                    Share this code with participants: <code>{quiz.quizCode || 'UNAVAILABLE'}</code>
                  </p>
                </div>
                <button className="admin-btn admin-btn-secondary workspace-code-button" onClick={copyQuizCode} disabled={!quiz.quizCode}>
                  {copiedQuizCode ? <BiCheck size={16} /> : <BiCopy size={16} />} {copiedQuizCode ? 'Copied' : 'Copy Code'}
                </button>
              </div>

              <div className="admin-card workspace-code-card">
                <div className="workspace-code-copy">
                  <h4 style={{ margin: 0 }}>Proctor PIN</h4>
                  <p className="admin-empty-text" style={{ margin: 0 }}>
                    Use this code for host access: <code>{quiz.proctorPin || 'UNAVAILABLE'}</code>
                  </p>
                </div>
                <button className="admin-btn admin-btn-secondary workspace-code-button" onClick={copyProctorPin} disabled={!quiz.proctorPin}>
                  {copiedProctorPin ? <BiCheck size={16} /> : <BiCopy size={16} />} {copiedProctorPin ? 'Copied' : 'Copy PIN'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && quiz?.status === 'ARCHIVED' && (
          <div className="quiz-workspace-tab-content">
            <div className="quiz-workspace-section-header">
              <div>
                <h2 className="quiz-workspace-section-title">Reports</h2>
              </div>
            </div>

            <div className="workspace-summary-row">
              <div className="workspace-summary-card">
                <div className="workspace-summary-copy">
                  <h3 className="workspace-summary-title">{isArchived ? 'Final Score Board' : 'Score Board'}</h3>
                  <p className="workspace-summary-text">Open rankings in a focused modal and refresh whenever needed.</p>
                </div>
                <div className="workspace-summary-actions">
                  <button className="admin-btn admin-btn-secondary workspace-summary-button" onClick={() => refetchScoreboard()}>
                    <BiRefresh size={16} /> Refresh
                  </button>
                  <button className="admin-btn admin-btn-primary workspace-summary-button" onClick={() => setShowScoreboardModal(true)}>
                    <BiTrophy size={16} /> Open Score Board
                  </button>
                </div>
              </div>

              <div className="workspace-summary-card">
                <div className="workspace-summary-copy">
                  <h3 className="workspace-summary-title">Violation Log Reports</h3>
                  <p className="workspace-summary-text">Review persisted anti-cheat logs in a focused modal view.</p>
                </div>
                <div className="workspace-summary-actions">
                  <button className="admin-btn admin-btn-secondary workspace-summary-button" onClick={handleRefreshViolationLogs}>
                    <BiRefresh size={16} /> Refresh
                  </button>
                  <button className="admin-btn admin-btn-primary workspace-summary-button" onClick={() => setShowViolationModal(true)}>
                    <BiBookContent size={16} /> Open Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {showScoreboardModal && (
        <div className="admin-modal-overlay" onClick={() => setShowScoreboardModal(false)}>
          <div className="admin-modal workspace-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header workspace-modal-header-scoreboard">
              <h2 className="admin-modal-title">{isArchived ? 'Final Score Board' : 'Score Board'}</h2>
              <button className="admin-btn admin-btn-secondary" onClick={() => refetchScoreboard()}>
                <BiRefresh size={16} /> Refresh
              </button>
            </div>
            <div className="admin-modal-body">
              {scoreboardLoading ? (
                <p className="admin-empty-text">Loading scoreboard...</p>
              ) : normalizedScoreboard.length === 0 ? (
                <p className="admin-empty-text">No scores yet. Rankings will appear after responses are submitted.</p>
              ) : (
                <div className="workspace-modal-list">
                  {[...normalizedScoreboard].sort((a, b) => a.rank - b.rank).map((entry) => (
                    <div key={entry.teamId} className="workspace-modal-item workspace-score-row">
                      <p className="workspace-score-team">
                        {entry.rank === 1 ? '1st' : entry.rank === 2 ? '2nd' : entry.rank === 3 ? '3rd' : `${entry.rank}th`} {entry.teamName}
                      </p>
                      <p className="workspace-score-points">{entry.score} pts</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-primary" onClick={() => setShowScoreboardModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showRegisterTeamModal && (
        <div className="admin-modal-overlay" onClick={() => setShowRegisterTeamModal(false)}>
          <div className="admin-modal workspace-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Manage Registered Teams</h2>
              <button onClick={() => setShowRegisterTeamModal(false)} className="admin-btn-icon workspace-modal-close"><BiX size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleRegisterTeam();
                }}
              >
                <label className="admin-form-label" htmlFor="register-team-name">Team Name</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    id="register-team-name"
                    className="admin-form-input"
                    value={registerTeamName}
                    onChange={(e) => setRegisterTeamName(e.target.value)}
                    placeholder="Enter team name"
                    maxLength={100}
                    disabled={registerTeam.isPending}
                    style={{ flex: 1, minWidth: 220 }}
                  />
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    disabled={registerTeam.isPending || !registerTeamName.trim()}
                  >
                    <BiUserPlus size={16} /> {registerTeam.isPending ? 'Registering...' : 'Register Team'}
                  </button>
                </div>
              </form>

              {registerTeamError && <p className="admin-empty-text workspace-error-text" style={{ marginTop: 10 }}>{registerTeamError}</p>}
              {registerTeamSuccess && <p className="admin-empty-text" style={{ marginTop: 10, color: '#065f46' }}>{registerTeamSuccess}</p>}

              <div style={{ marginTop: 16 }}>
                <h3 className="admin-card-title" style={{ marginBottom: 10 }}><BiGroup size={18} /> Registered Teams</h3>
                {teams.length === 0 ? (
                  <p className="admin-empty-text">No teams registered yet for this quiz.</p>
                ) : (
                  <div className="workspace-modal-list">
                    {teams.map((team) => (
                      <div key={team.id} className="workspace-modal-item workspace-log-row" style={{ alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <p className="workspace-log-team">{team.name}</p>
                          <p className="workspace-log-type">Access Code: <strong>{team.accessCode}</strong></p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p className="workspace-log-time">{team.totalScore} pts</p>
                          <button
                            className="admin-btn admin-btn-secondary"
                            onClick={() => void copyTeamAccessCode(team.id, team.accessCode)}
                            type="button"
                            aria-label={`Copy access code for ${team.name}`}
                          >
                            {copiedTeamId === team.id ? <BiCheck size={14} /> : <BiCopy size={14} />} {copiedTeamId === team.id ? 'Copied' : 'Copy Code'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-primary" onClick={() => setShowRegisterTeamModal(false)} disabled={registerTeam.isPending}>Done</button>
            </div>
          </div>
        </div>
      )}

      {showViolationModal && (
        <div className="admin-modal-overlay" onClick={() => setShowViolationModal(false)}>
          <div className="admin-modal workspace-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header workspace-modal-header-violations">
              <h2 className="admin-modal-title">Violation Log Reports</h2>
              <button className="admin-btn admin-btn-secondary" onClick={handleRefreshViolationLogs}>
                <BiRefresh size={16} /> Refresh
              </button>
            </div>
            <div className="admin-modal-body">
              {violationLogsError && (
                <p className="admin-empty-text workspace-error-text" style={{ marginTop: 0 }}>{violationLogsError}</p>
              )}
              {violationLogsLoading ? (
                <p className="admin-empty-text">Loading violation reports...</p>
              ) : violationLogs.length === 0 ? (
                <p className="admin-empty-text">No violation reports recorded yet.</p>
              ) : (
                <div className="workspace-modal-list">
                  {violationLogs.map((entry) => (
                    <div key={entry.id} className="workspace-modal-item workspace-log-row">
                      <div>
                        <p className="workspace-log-team">{entry.teamName}</p>
                        <p className="workspace-log-type">{formatViolationType(entry.violationType)}</p>
                      </div>
                      <p className="workspace-log-time">{formatViolationTime(entry.detectedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-primary" onClick={() => setShowViolationModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {statusError && (
        <div className="admin-modal-overlay" onClick={() => setStatusError(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header workspace-modal-header-error">
              <h2 className="admin-modal-title">Cannot Change Quiz Status</h2>
              <button onClick={() => setStatusError(null)} className="admin-btn-icon workspace-modal-close"><BiX size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ color: '#b45309', marginBottom: 12 }}><BiErrorCircle size={36} /></div>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                  {statusError}
                </p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-primary" onClick={() => setStatusError(null)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
