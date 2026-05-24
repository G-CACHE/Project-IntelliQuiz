import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import CustomSelect from '../../components/common/CustomSelect';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  BiArrowBack, BiBookContent, BiTrophy, BiGroup, BiTrash, BiCopy, BiCheck,
  BiRefresh, BiX, BiErrorCircle, BiUserPlus, BiLock, BiSearch,
} from 'react-icons/bi';
import { useQuiz, useQuizStatusChange, useRegisterTeam, useDeleteTeam, useScoreboard, useTeams } from '../../hooks';
import QuestionsPage from './QuestionsPage';
import { quizzesApi, violationApi, type ViolationLogRecord } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin.css';
import './AdminRedesign.css';
import './QuizWorkspacePage.css';

type ScoreboardRow = { teamId: number; teamName: string; score: number; rank: number };
type TabId = 'overview' | 'config' | 'teams-codes' | 'reports';

export default function QuizWorkspacePage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const parsedQuizId = quizId ? parseInt(quizId, 10) : 0;

  const { data: quiz, isLoading, refetch: refetchQuiz } = useQuiz(parsedQuizId);
  const { data: teams = [] } = useTeams(parsedQuizId);
  const registerTeam = useRegisterTeam(parsedQuizId);
  const deleteTeam = useDeleteTeam(parsedQuizId);
  const { data: scoreboard = [], isLoading: scoreboardLoading, refetch: refetchScoreboard } = useScoreboard(parsedQuizId, { refetchInterval: 5000 });
  const statusChange = useQuizStatusChange();
  const { canEditQuiz, isSuperAdmin } = useAuth();

  const [copiedQuizCode, setCopiedQuizCode] = useState(false);
  const [copiedProctorPin, setCopiedProctorPin] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [showReadyBlockedModal, setShowReadyBlockedModal] = useState(false);
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
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false);
  const [registerTeamName, setRegisterTeamName] = useState('');
  const [memberTags, setMemberTags] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [registerTeamError, setRegisterTeamError] = useState<string | null>(null);
  const [registerTeamSuccess, setRegisterTeamSuccess] = useState<string | null>(null);
  const [teamNameTouched, setTeamNameTouched] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<{ id: number; name: string } | null>(null);
  const [copiedTeamId, setCopiedTeamId] = useState<number | null>(null);
  const [violationLogs, setViolationLogs] = useState<ViolationLogRecord[]>([]);
  const [violationLogsLoading, setViolationLogsLoading] = useState(false);
  const [violationLogsError, setViolationLogsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(
    (location.state as { tab?: string } | null)?.tab === 'overview' ? 'overview' : 'config'
  );
  const statusPillRef = useRef<HTMLButtonElement | null>(null);
  const draftLabelRef = useRef<HTMLSpanElement | null>(null);
  const readyLabelRef = useRef<HTMLSpanElement | null>(null);
  const [statusPillMetrics, setStatusPillMetrics] = useState({ draftLeft: 0, draftWidth: 0, readyLeft: 0, readyWidth: 0 });

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

  const quizStatus = quiz?.status ?? 'DRAFT';
  const isRestricted = normalizedAccessMode === 'RESTRICTED';
  const hasTeams = teams.length > 0;
  // READY is locked when restricted and no teams registered
  const readyLocked = isDraftQuiz && isRestricted && !hasTeams;

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
    const t = window.setTimeout(() => setSettingsSnackbar(null), 4000);
    return () => window.clearTimeout(t);
  }, [settingsSnackbar]);

  useEffect(() => {
    if (!registerTeamSuccess) return;
    const t = window.setTimeout(() => setRegisterTeamSuccess(null), 3000);
    return () => window.clearTimeout(t);
  }, [registerTeamSuccess]);

  useEffect(() => {
    if (!parsedQuizId) return;
    const load = async () => {
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
    void load();
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
    const teamBased: ScoreboardRow[] = [...teams]
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((team, i) => ({ teamId: team.id, teamName: team.name, score: team.totalScore, rank: i + 1 }));
    if (Array.isArray(scoreboard)) {
      const rows = scoreboard as ScoreboardRow[];
      const allZero = rows.length > 0 && rows.every((e) => e.score === 0);
      const teamHasScores = teams.some((t) => t.totalScore > 0);
      if (isArchived && allZero && teamHasScores) return teamBased;
      return rows;
    }
    return teamBased;
  }, [scoreboard, teams, isArchived]);

  useLayoutEffect(() => {
    const button = statusPillRef.current;
    const draftLabel = draftLabelRef.current;
    const readyLabel = readyLabelRef.current;
    if (!button || !draftLabel || !readyLabel) return;
    const update = () => setStatusPillMetrics({
      draftLeft: draftLabel.offsetLeft, draftWidth: draftLabel.offsetWidth,
      readyLeft: readyLabel.offsetLeft, readyWidth: readyLabel.offsetWidth,
    });
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(button); ro?.observe(draftLabel); ro?.observe(readyLabel);
    window.addEventListener('resize', update);
    return () => { ro?.disconnect(); window.removeEventListener('resize', update); };
  }, [quiz?.status, quiz?.title]);

  const activeStatusPillMetrics = quizStatus === 'READY'
    ? { left: statusPillMetrics.readyLeft, width: statusPillMetrics.readyWidth }
    : { left: statusPillMetrics.draftLeft, width: statusPillMetrics.draftWidth };

  const handleStatusToggle = async () => {
    if (!quiz) return;
    // Intercept: restricted quiz with no teams cannot go READY
    if (quizStatus === 'DRAFT' && readyLocked) {
      setShowReadyBlockedModal(true);
      return;
    }
    setStatusError(null);
    try {
      if (quizStatus === 'DRAFT') {
        await statusChange.mutateAsync({ id: quiz.id, action: 'ready' });
        setActiveTab('teams-codes');
      }
      else if (quizStatus === 'READY') await statusChange.mutateAsync({ id: quiz.id, action: 'draft' });
      else if (quizStatus === 'ACTIVE') await statusChange.mutateAsync({ id: quiz.id, action: 'deactivate' });
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to change quiz status');
    }
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta); return ok;
    } catch { return false; }
  };

  const copyQuizCode = async () => {
    if (!quiz?.quizCode) return;
    if (await copyToClipboard(quiz.quizCode)) { setCopiedQuizCode(true); setTimeout(() => setCopiedQuizCode(false), 1500); }
  };
  const copyProctorPin = async () => {
    if (!quiz?.proctorPin) return;
    if (await copyToClipboard(quiz.proctorPin)) { setCopiedProctorPin(true); setTimeout(() => setCopiedProctorPin(false), 1500); }
  };
  const copyTeamAccessCode = async (teamId: number, accessCode: string) => {
    if (!accessCode) return;
    if (await copyToClipboard(accessCode)) {
      setCopiedTeamId(teamId);
      setTimeout(() => setCopiedTeamId((p) => (p === teamId ? null : p)), 1500);
    }
  };

  const handleRefreshViolationLogs = async () => {
    if (!parsedQuizId) return;
    try {
      setViolationLogsLoading(true);
      const records = await violationApi.getHistory(parsedQuizId, { limit: 500 });
      setViolationLogs(records); setViolationLogsError(null);
    } catch (err) {
      setViolationLogsError(err instanceof Error ? err.message : 'Failed to load violation reports');
    } finally { setViolationLogsLoading(false); }
  };

  const handleSaveSettings = async () => {
    if (!quiz || !hasEdit) return;
    if (!isDraftQuiz) { setSettingsError('Quiz configuration can only be edited while status is Draft.'); return; }
    setSettingsError(null);
    if (invalidClassTimer) { setSettingsError('Class mode timer must be at least 1 minute.'); return; }
    if (!hasSettingsChanges) { setSettingsError('No changes to save. Update at least one field before saving.'); return; }
    try {
      setSettingsSaving(true);
      await quizzesApi.update(quiz.id, {
        accessMode: settingsDraft.accessMode,
        navigationMode: settingsDraft.navigationMode,
        globalTimeLimitSeconds: settingsDraft.navigationMode === 'CLASS' ? settingsDraft.globalTimeLimitMinutes * 60 : 0,
        randomizeQuestions: settingsDraft.navigationMode === 'CLASS' ? settingsDraft.randomizeQuestions : false,
      });
      await refetchQuiz(); await refetchScoreboard();
      setSettingsSnackbar('Quiz configuration saved successfully.');
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to save quiz settings.');
    } finally { setSettingsSaving(false); }
  };

  const handleRegisterTeam = async () => {
    if (!parsedQuizId || !canManageRestrictedTeams) return;
    const trimmed = registerTeamName.trim();
    setTeamNameTouched(true);
    if (!trimmed) { setRegisterTeamError('Team name is required.'); return; }
    if (trimmed.length < 2) { setRegisterTeamError('Name must be at least 2 characters.'); return; }
    if (/^[^a-zA-Z0-9]+$/.test(trimmed)) { setRegisterTeamError('Name must contain at least one letter or number.'); return; }
    const membersValue = memberTags.length > 0 ? memberTags.join(',') : undefined;
    try {
      setRegisterTeamError(null);
      await registerTeam.mutateAsync({ name: trimmed, members: membersValue });
      setRegisterTeamSuccess(`Registered ${trimmed} successfully.`);
      setRegisterTeamName('');
      setMemberTags([]);
      setMemberInput('');
      setTeamNameTouched(false);
    } catch (err) { setRegisterTeamError(err instanceof Error ? err.message : 'Failed to register team.'); }
  };

  const handleOpenDeleteTeamModal = (teamId: number, teamName: string) => {
    setTeamToDelete({ id: teamId, name: teamName }); setShowDeleteTeamModal(true);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete || !canManageRestrictedTeams) return;
    try {
      await deleteTeam.mutateAsync(teamToDelete.id);
      setRegisterTeamSuccess(`Deleted ${teamToDelete.name} successfully.`);
      setShowDeleteTeamModal(false); setTeamToDelete(null);
    } catch (err) {
      setRegisterTeamError(err instanceof Error ? err.message : 'Failed to delete team.');
      setShowDeleteTeamModal(false); setTeamToDelete(null);
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

  const formatViolationTime = (v: string) => { const d = new Date(v); return isNaN(d.getTime()) ? v : d.toLocaleString(); };
  const formatViolationType = (v: string) => v.toLowerCase().split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

  // ── Member tag helpers ────────────────────────────────────────
  const addMemberTag = (raw: string) => {
    const name = raw.trim();
    if (name && !memberTags.includes(name)) setMemberTags((p) => [...p, name]);
    setMemberInput('');
  };

  return (
    <div className="quiz-workspace-shell">
      {/* Header */}
      <div className="quiz-workspace-slim-header">
        <button type="button" className="quiz-workspace-back-btn" onClick={() => navigate('/admin/quizzes', { replace: true })} aria-label="Back to quizzes">
          <BiArrowBack size={18} />
        </button>
        <div className="quiz-workspace-slim-title-block">
          <h1 className="quiz-workspace-slim-title">{quiz.title}</h1>
          <p className="quiz-workspace-slim-sub">{modeLabel}{isArchived ? ' — Reports' : ''}</p>
        </div>
        <div className="quiz-workspace-slim-tabs">
          <button className={`quiz-workspace-slim-tab${activeTab === 'config' ? ' is-active' : ''}`} onClick={() => setActiveTab('config')}>Configuration</button>
          <button className={`quiz-workspace-slim-tab${activeTab === 'overview' ? ' is-active' : ''}`} onClick={() => setActiveTab('overview')}>Questions</button>
          <button className={`quiz-workspace-slim-tab${activeTab === 'teams-codes' ? ' is-active' : ''}`} onClick={() => setActiveTab('teams-codes')}>
            Teams &amp; Codes
          </button>
          {isArchived && (
            <button className={`quiz-workspace-slim-tab${activeTab === 'reports' ? ' is-active' : ''}`} onClick={() => setActiveTab('reports')}>Reports</button>
          )}
        </div>
        {hasEdit && (
          <button
            ref={statusPillRef}
            onClick={() => { if (quizStatus !== 'ACTIVE' && quizStatus !== 'ARCHIVED') void handleStatusToggle(); }}
            disabled={statusChange.isPending || quizStatus === 'ACTIVE' || quizStatus === 'ARCHIVED' || readyLocked}
            className={`status-pill-btn ${quizStatus === 'READY' ? 'is-ready' : 'is-draft'}`}
            title={readyLocked ? 'Register at least one team before marking as Ready' : undefined}
          >
            <span className="pill-highlighter" aria-hidden="true" style={{ left: `${activeStatusPillMetrics.left}px`, width: `${activeStatusPillMetrics.width}px` }} />
            <span ref={draftLabelRef} className={`pill-label pill-draft ${quizStatus === 'DRAFT' ? 'active' : ''}`}>Draft</span>
            <span className="pill-sep">|</span>
            <span ref={readyLabelRef} className={`pill-label pill-ready ${quizStatus === 'READY' ? 'active' : ''}`}>Ready</span>
          </button>
        )}
      </div>

      <div className="quiz-workspace-panel">

        {/* ── QUESTIONS TAB ── */}
        {activeTab === 'overview' && (
          <div className="quiz-workspace-tab-content">
            <QuestionsPage />
          </div>
        )}

        {/* ── CONFIGURATION TAB ── */}
        {activeTab === 'config' && (
          <div className="quiz-workspace-tab-content">
            <div className="quiz-workspace-section-header">
              <div>
                <h2 className="quiz-workspace-section-title">Configuration</h2>
                <p className="quiz-workspace-section-text">Manage access mode, quiz mode, and team registration in one place.</p>
              </div>
            </div>
            {!hasEdit ? (
              <p className="admin-empty-text">You do not have permission to edit this quiz configuration.</p>
            ) : !isDraftQuiz ? (
              <p className="admin-empty-text">Configuration is locked because this quiz is not in Draft status.</p>
            ) : (
              <>
                <div className="quiz-config-form-wrapper">
                  <div className="quiz-config-fields-grid">
                    <div className="quiz-config-field-group">
                      <label className="quiz-config-label">Access Mode</label>
                      <CustomSelect
                        value={settingsDraft.accessMode}
                        options={[{ value: 'RESTRICTED', label: 'Restricted' }, { value: 'PUBLIC', label: 'Public' }]}
                        onChange={(v) => setSettingsDraft((p) => ({ ...p, accessMode: v as 'PUBLIC' | 'RESTRICTED' }))}
                        disabled={!canEditDraftOnly || settingsSaving}
                      />
                      <p className="quiz-config-hint">
                        {settingsDraft.accessMode === 'RESTRICTED' ? 'Entry requires a pre-registered team access code.' : 'Anyone can join using the quiz code.'}
                      </p>
                    </div>
                    <div className="quiz-config-field-group">
                      <label className="quiz-config-label">Quiz Mode</label>
                      <CustomSelect
                        value={settingsDraft.navigationMode}
                        options={[{ value: 'TOURNAMENT', label: 'Tournament' }, { value: 'CLASS', label: 'Class' }]}
                        onChange={(v) => setSettingsDraft((p) => ({ ...p, navigationMode: v as 'TOURNAMENT' | 'CLASS' }))}
                        disabled={!canEditDraftOnly || settingsSaving}
                      />
                      <p className="quiz-config-hint">
                        {settingsDraft.navigationMode === 'TOURNAMENT' ? 'Host controls question pacing for all participants.' : 'Participants navigate at their own pace within a time limit.'}
                      </p>
                    </div>
                    {settingsDraft.navigationMode === 'CLASS' && (
                      <div className="quiz-config-field-group">
                        <label className="quiz-config-label">Quiz Duration (minutes)</label>
                        <input type="number" min={1} className="admin-form-input" value={settingsDraft.globalTimeLimitMinutes}
                          disabled={!canEditDraftOnly || settingsSaving}
                          onChange={(e) => setSettingsDraft((p) => ({ ...p, globalTimeLimitMinutes: Number(e.target.value || 0) }))} />
                        {invalidClassTimer && <p className="quiz-config-hint quiz-config-hint-error">Please enter at least 1 minute.</p>}
                      </div>
                    )}
                  </div>
                  {settingsDraft.navigationMode === 'CLASS' && (
                    <div className="quiz-config-checkbox-group">
                      <label className="quiz-config-checkbox-label">
                        <input type="checkbox" checked={settingsDraft.randomizeQuestions}
                          onChange={(e) => setSettingsDraft((p) => ({ ...p, randomizeQuestions: e.target.checked }))}
                          disabled={!canEditDraftOnly || settingsSaving} />
                        <span>Randomize question order per participant</span>
                      </label>
                    </div>
                  )}
                  {settingsError && <p className="quiz-config-error">{settingsError}</p>}
                </div>
                <div className="quiz-config-actions">
                  <button className="admin-btn admin-btn-primary" onClick={handleSaveSettings} disabled={settingsSaving || !canEditDraftOnly}>
                    {settingsSaving ? 'Saving...' : 'Save Configuration'}
                  </button>
                  {settingsDraft.accessMode === 'RESTRICTED' && (
                    <button className="admin-btn admin-btn-secondary" onClick={() => setActiveTab('teams-codes')} disabled={!canManageRestrictedTeams} type="button">
                      <BiGroup size={16} /> Manage Teams
                    </button>
                  )}
                </div>
              </>
            )}
            {settingsSnackbar && <div className="admin-snackbar" role="status" aria-live="polite">{settingsSnackbar}</div>}
          </div>
        )}

        {/* ── TEAMS & CODES TAB ── */}
        {activeTab === 'teams-codes' && (
          <div className="quiz-workspace-tab-content">
            <div className="quiz-workspace-section-header">
              <div>
                <h2 className="quiz-workspace-section-title">Teams &amp; Codes</h2>
                <p className="quiz-workspace-section-text">Manage registered teams and share access codes with participants.</p>
              </div>
            </div>
            {/* Codes */}
            <div className="quiz-workspace-code-grid" style={{ marginBottom: 28 }}>
              <div className="admin-card workspace-code-card quiz-code-card">
                <div className="workspace-code-copy">
                  <h4 style={{ margin: 0 }}>Quiz Code</h4>
                  <p className="admin-empty-text" style={{ margin: 0 }}>Share with participants: <code>{quiz.quizCode || 'UNAVAILABLE'}</code></p>
                </div>
                <button className="admin-btn admin-btn-secondary workspace-code-button" onClick={copyQuizCode} disabled={!quiz.quizCode}>
                  {copiedQuizCode ? <BiCheck size={16} /> : <BiCopy size={16} />} {copiedQuizCode ? 'Copied' : 'Copy Code'}
                </button>
              </div>
              <div className="admin-card workspace-code-card proctor-pin-card">
                <div className="workspace-code-copy">
                  <h4 style={{ margin: 0 }}>Proctor PIN</h4>
                  <p className="admin-empty-text" style={{ margin: 0 }}>Host access code: <code>{quiz.proctorPin || 'UNAVAILABLE'}</code></p>
                </div>
                <button className="admin-btn admin-btn-secondary workspace-code-button" onClick={copyProctorPin} disabled={!quiz.proctorPin}>
                  {copiedProctorPin ? <BiCheck size={16} /> : <BiCopy size={16} />} {copiedProctorPin ? 'Copied' : 'Copy PIN'}
                </button>
              </div>
            </div>
            {/* Teams — only for restricted */}
            {isRestricted && (
              <div>
                <h3 className="quiz-workspace-section-title" style={{ margin: '0 0 16px', fontSize: 15 }}>Registered Teams</h3>
                <div className="team-split-layout">
                  {/* ── Left: sticky form ── */}
                  {canManageRestrictedTeams && (
                    <div className="team-split-form">
                      <div className="team-split-form-header">
                        <h4>Register a Team</h4>
                      </div>
                      <div className="team-split-form-body">
                      <form onSubmit={(e) => { e.preventDefault(); void handleRegisterTeam(); }} className="team-manager-form">
                        <div className="admin-form-group">
                          <label className="admin-form-label" htmlFor="tm-team-name">Team / Participant Name *</label>
                          <input
                            id="tm-team-name"
                            className={`admin-form-input${teamNameTouched && !registerTeamName.trim() ? ' input-error' : ''}`}
                            value={registerTeamName}
                            onChange={(e) => { setRegisterTeamName(e.target.value); if (registerTeamError) setRegisterTeamError(null); }}
                            onBlur={() => setTeamNameTouched(true)}
                            placeholder="e.g. Team Alpha or Juan dela Cruz"
                            maxLength={100}
                            disabled={registerTeam.isPending}
                          />
                          {teamNameTouched && !registerTeamName.trim() && (
                            <p className="team-form-field-error">Please enter a team or participant name.</p>
                          )}
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-form-label">
                            Members <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
                          </label>
                          <div className="member-tag-input" onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
                            {memberTags.map((tag) => (
                              <span key={tag} className="member-tag">
                                {tag}
                                <button
                                  type="button"
                                  className="member-tag-remove"
                                  onMouseDown={(e) => { e.preventDefault(); setMemberTags((p) => p.filter((t) => t !== tag)); }}
                                  aria-label={`Remove ${tag}`}
                                >
                                  <BiX size={12} />
                                </button>
                              </span>
                            ))}
                            <input
                              className="member-tag-field"
                              value={memberInput}
                              onChange={(e) => setMemberInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); addMemberTag(memberInput); }
                                if (e.key === 'Tab' && memberInput.trim()) { e.preventDefault(); addMemberTag(memberInput); }
                                if (e.key === 'Backspace' && !memberInput && memberTags.length > 0) setMemberTags((p) => p.slice(0, -1));
                              }}
                              onBlur={() => { if (memberInput.trim()) addMemberTag(memberInput); }}
                              placeholder={memberTags.length === 0 ? 'Type a name, press Enter' : ''}
                              disabled={registerTeam.isPending}
                            />
                          </div>
                          <p className="admin-form-hint" style={{ marginTop: 4 }}>Press Enter or Tab after each name. Leave blank for individual.</p>
                        </div>
                        <button
                          type="submit"
                          className={`admin-btn admin-btn-primary register-team-btn${!registerTeamName.trim() ? ' is-empty' : ''}`}
                          disabled={registerTeam.isPending}
                        >
                          <BiUserPlus size={16} /> {registerTeam.isPending ? 'Registering...' : 'Register'}
                        </button>
                        {registerTeamError && <p className="admin-empty-text workspace-error-text" style={{ marginTop: 8 }}>{registerTeamError}</p>}
                        {registerTeamSuccess && <p style={{ marginTop: 8, fontSize: 13, color: '#065f46' }}>{registerTeamSuccess}</p>}
                      </form>
                      </div>
                    </div>
                  )}
                  {/* ── Right: scrollable list ── */}
                  <div className="team-split-list">
                    <div className="team-list-search-bar">
                      <BiSearch size={15} className="team-list-search-icon" />
                      <input
                        className="team-list-search-input"
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        placeholder="Search teams or members..."
                      />
                      {teamSearch && (
                        <button type="button" className="team-list-search-clear" onClick={() => setTeamSearch('')}>
                          <BiX size={14} />
                        </button>
                      )}
                    </div>
                    <div className="team-manager-list-header">
                      <BiGroup size={16} />
                      <span>{teams.length} Registered Team{teams.length !== 1 ? 's' : ''}</span>
                    </div>
                    {teams.length === 0 ? (
                      <p className="admin-empty-text" style={{ padding: '12px 0' }}>No teams registered yet.</p>
                    ) : (() => {
                      const q = teamSearch.toLowerCase();
                      const filtered = teams.filter((t) =>
                        t.name.toLowerCase().includes(q) ||
                        (t.members || '').toLowerCase().includes(q)
                      );
                      return filtered.length === 0 ? (
                        <p className="admin-empty-text" style={{ padding: '12px 0' }}>No teams match "{teamSearch}".</p>
                      ) : (
                        <div className="team-manager-list">
                          {filtered.map((team, index) => {
                            const memberList = team.members ? team.members.split(',').map(m => m.trim()).filter(Boolean) : [];
                            const accentClass = `team-manager-row-accent-${index % 4}`;
                            return (
                              <div key={team.id} className={`team-manager-row ${accentClass}`}>
                                <div className="team-manager-row-info">
                                  <span className="team-manager-row-name">{team.name}</span>
                                  {memberList.length > 0 ? (
                                    <div className="team-manager-row-tags">
                                      {memberList.map((m) => <span key={m} className="team-manager-member-chip">{m}</span>)}
                                    </div>
                                  ) : (
                                    <span className="team-manager-row-individual">Individual</span>
                                  )}
                                  <span className="team-manager-row-code">Code: <strong>{team.accessCode}</strong></span>
                                </div>
                                <div className="team-manager-row-actions">
                                  <button className="admin-btn admin-btn-secondary" onClick={() => void copyTeamAccessCode(team.id, team.accessCode)} type="button">
                                    {copiedTeamId === team.id ? <BiCheck size={14} /> : <BiCopy size={14} />}
                                    {copiedTeamId === team.id ? 'Copied' : 'Copy'}
                                  </button>
                                  {canManageRestrictedTeams && (
                                    <button className="admin-btn admin-btn-secondary" onClick={() => handleOpenDeleteTeamModal(team.id, team.name)} type="button" style={{ color: '#dc2626' }}>
                                      <BiTrash size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {activeTab === 'reports' && isArchived && (
          <div className="quiz-workspace-tab-content">
            <div className="quiz-workspace-section-header"><div><h2 className="quiz-workspace-section-title">Reports</h2></div></div>
            <div className="workspace-summary-row">
              <div className="workspace-summary-card">
                <div className="workspace-summary-copy">
                  <h3 className="workspace-summary-title">Final Score Board</h3>
                  <p className="workspace-summary-text">Open rankings in a focused modal and refresh whenever needed.</p>
                </div>
                <div className="workspace-summary-actions">
                  <button className="admin-btn admin-btn-secondary workspace-summary-button" onClick={() => refetchScoreboard()}><BiRefresh size={16} /> Refresh</button>
                  <button className="admin-btn admin-btn-primary workspace-summary-button" onClick={() => setShowScoreboardModal(true)}><BiTrophy size={16} /> Open Score Board</button>
                </div>
              </div>
              <div className="workspace-summary-card">
                <div className="workspace-summary-copy">
                  <h3 className="workspace-summary-title">Violation Log Reports</h3>
                  <p className="workspace-summary-text">Review persisted anti-cheat logs in a focused modal view.</p>
                </div>
                <div className="workspace-summary-actions">
                  <button className="admin-btn admin-btn-secondary workspace-summary-button" onClick={handleRefreshViolationLogs}><BiRefresh size={16} /> Refresh</button>
                  <button className="admin-btn admin-btn-primary workspace-summary-button" onClick={() => setShowViolationModal(true)}><BiBookContent size={16} /> Open Logs</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── READY BLOCKED MODAL (Restricted + no teams) ── */}
      {showReadyBlockedModal && (
        <div className="admin-modal-overlay" onClick={() => setShowReadyBlockedModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ background: 'linear-gradient(135deg, #7a1733, #9f2346)' }}>
              <h2 className="admin-modal-title">Teams Required for Restricted Mode</h2>
              <button onClick={() => setShowReadyBlockedModal(false)} className="admin-btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}><BiX size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <div style={{ color: '#880015', marginBottom: 12 }}><BiLock size={36} /></div>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
                  You must register participating teams before launching this quiz in Restricted Mode.
                </p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowReadyBlockedModal(false)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={() => { setShowReadyBlockedModal(false); setActiveTab('teams-codes'); }}>
                <BiGroup size={16} /> Go to Register Teams →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCOREBOARD MODAL ── */}
      {showScoreboardModal && (
        <div className="admin-modal-overlay" onClick={() => setShowScoreboardModal(false)}>
          <div className="admin-modal workspace-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header workspace-modal-header-scoreboard">
              <h2 className="admin-modal-title">{isArchived ? 'Final Score Board' : 'Score Board'}</h2>
              <button className="admin-btn admin-btn-secondary" onClick={() => refetchScoreboard()}><BiRefresh size={16} /> Refresh</button>
            </div>
            <div className="admin-modal-body">
              {scoreboardLoading ? <p className="admin-empty-text">Loading scoreboard...</p>
                : normalizedScoreboard.length === 0 ? <p className="admin-empty-text">No scores yet.</p>
                : (
                  <div className="workspace-modal-list">
                    {[...normalizedScoreboard].sort((a, b) => a.rank - b.rank).map((entry) => (
                      <div key={entry.teamId} className="workspace-modal-item workspace-score-row">
                        <p className="workspace-score-team">{entry.rank === 1 ? '1st' : entry.rank === 2 ? '2nd' : entry.rank === 3 ? '3rd' : `${entry.rank}th`} {entry.teamName}</p>
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

      {/* ── DELETE TEAM MODAL ── */}
      {showDeleteTeamModal && teamToDelete && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteTeamModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ background: 'linear-gradient(135deg, #7a1733, #9f2346)' }}>
              <h2 className="admin-modal-title">Delete Team</h2>
              <button onClick={() => setShowDeleteTeamModal(false)} className="admin-btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}><BiX size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ width: 64, height: 64, margin: '0 auto 16px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <BiTrash size={28} />
                </div>
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>Are you sure you want to delete this team?</p>
                <p style={{ padding: 12, background: '#f8fafc', borderRadius: 8, color: '#1e293b', fontWeight: 500, fontSize: 13 }}>"{teamToDelete.name}"</p>
                <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12, fontWeight: 600 }}>This action cannot be undone.</p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowDeleteTeamModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={handleDeleteTeam} className="admin-btn admin-btn-danger" disabled={deleteTeam.isPending}>
                {deleteTeam.isPending ? 'Deleting...' : 'Delete Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIOLATION MODAL ── */}
      {showViolationModal && (
        <div className="admin-modal-overlay" onClick={() => setShowViolationModal(false)}>
          <div className="admin-modal workspace-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header workspace-modal-header-violations">
              <h2 className="admin-modal-title">Violation Log Reports</h2>
              <button className="admin-btn admin-btn-secondary" onClick={handleRefreshViolationLogs}><BiRefresh size={16} /> Refresh</button>
            </div>
            <div className="admin-modal-body">
              {violationLogsError && <p className="admin-empty-text workspace-error-text" style={{ marginTop: 0 }}>{violationLogsError}</p>}
              {violationLogsLoading ? <p className="admin-empty-text">Loading violation reports...</p>
                : violationLogs.length === 0 ? <p className="admin-empty-text">No violation reports recorded yet.</p>
                : (
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

      {/* ── STATUS ERROR MODAL ── */}
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
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{statusError}</p>
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
