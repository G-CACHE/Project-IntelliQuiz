import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiPlay,
  BiPause,
  BiGroup,
  BiTrophy,
  BiCheckCircle,
  BiX,
  BiErrorCircle,
  BiRocket,
  BiCopy,
  BiCheck,
} from 'react-icons/bi';
import { quizzesApi, teamsApi, scoreboardApi, type Quiz, type Team, type ScoreboardEntry } from '../../services/api';
import '../../styles/admin.css';

export default function AdminHostPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number>(0);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => { loadQuizzes(); }, []);
  useEffect(() => {
    if (selectedQuizId) { loadTeams(); loadScoreboard(); }
    else { setTeams([]); setScoreboard([]); }
  }, [selectedQuizId]);

  useEffect(() => {
    const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);
    if (!selectedQuiz || selectedQuiz.status !== 'ACTIVE') return;
    const interval = setInterval(() => { loadTeams(); loadScoreboard(); }, 5000);
    return () => clearInterval(interval);
  }, [selectedQuizId, quizzes]);

  const loadQuizzes = async () => {
    try {
      const data = await quizzesApi.getAll();
      setQuizzes(data);
      const active = data.find((q) => q.status === 'ACTIVE');
      const ready = data.find((q) => q.status === 'READY');
      if (active) setSelectedQuizId(active.id);
      else if (ready) setSelectedQuizId(ready.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    if (!selectedQuizId) return;
    try { setTeams(await teamsApi.getByQuiz(selectedQuizId)); } catch (err) { console.error(err); }
  };

  const loadScoreboard = async () => {
    if (!selectedQuizId) return;
    try { setScoreboard(await scoreboardApi.getByQuiz(selectedQuizId)); } catch (err) { console.error(err); }
  };

  const handleActivate = async () => {
    if (!selectedQuizId) return;
    try { await quizzesApi.activate(selectedQuizId); loadQuizzes(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to activate quiz'); }
  };

  const handleDeactivate = async () => {
    if (!selectedQuizId) return;
    try { await quizzesApi.deactivate(selectedQuizId); loadQuizzes(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to deactivate quiz'); }
  };

  const copyAccessCode = async (code: string) => {
    try { await navigator.clipboard.writeText(code); setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2000); }
    catch { setError('Failed to copy access code'); }
  };

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);
  const isActive = selectedQuiz?.status === 'ACTIVE';
  const isReady = selectedQuiz?.status === 'READY';

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">Loading host panel...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header purple">
        <div className="admin-page-header-bg">
          <div className="admin-page-header-shape shape-1" />
          <div className="admin-page-header-shape shape-2" />
          <div className="admin-page-header-dots" />
        </div>
        <div className="admin-page-header-content">
          <div className="admin-page-header-left">
            <div className="admin-page-icon"><BiRocket size={26} /></div>
            <div>
              <h1 className="admin-page-title">Host Game</h1>
              <p className="admin-page-subtitle">Control your live quiz session</p>
            </div>
          </div>
          {selectedQuiz && (
            <div style={{ display: 'flex', gap: 10 }}>
              {isReady && <button className="admin-btn admin-btn-success" onClick={handleActivate}><BiPlay size={18} /> Go Live</button>}
              {isActive && <button className="admin-btn admin-btn-danger" onClick={handleDeactivate}><BiPause size={18} /> End Session</button>}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <div className="admin-alert-content"><BiErrorCircle size={18} /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="admin-btn-icon" style={{ width: 32, height: 32 }}><BiX size={18} /></button>
        </div>
      )}

      {/* Quiz Selector */}
      <div className="admin-card" style={{ marginBottom: 20, padding: 16 }}>
        <div className="admin-form-group" style={{ marginBottom: 0 }}>
          <label className="admin-form-label">Select Quiz to Host</label>
          <select value={selectedQuizId} onChange={(e) => setSelectedQuizId(parseInt(e.target.value))} className="admin-form-input admin-form-select">
            <option value={0}>Select a quiz</option>
            {quizzes.filter(q => q.status === 'READY' || q.status === 'ACTIVE').map((q) => (
              <option key={q.id} value={q.id}>{q.title} ({q.status})</option>
            ))}
          </select>
        </div>
      </div>

      {selectedQuiz && (
        <>
          {/* Status Banner */}
          <div className="admin-card" style={{
            background: isActive ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
            borderColor: isActive ? '#86efac' : '#93c5fd',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {isActive && <div style={{ width: 10, height: 10, background: '#22c55e', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />}
                  <span style={{ fontSize: 11, fontWeight: 800, color: isActive ? '#16a34a' : '#2563eb', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {isActive ? 'LIVE NOW' : 'READY TO START'}
                  </span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>{selectedQuiz.title}</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                  {selectedQuiz.questionCount || 0} questions • {teams.length} teams joined
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: isActive ? '#22c55e' : '#3b82f6' }}>{teams.length}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Teams Ready</div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="admin-grid-2">
            {/* Teams Panel */}
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 className="admin-card-title" style={{ margin: 0 }}><BiGroup size={18} /> Teams</h3>
                <button className="admin-btn admin-btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => navigate(`/admin/teams?quizId=${selectedQuizId}`)}>Manage</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                {teams.length > 0 ? teams.map((team) => (
                  <div key={team.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: '#f8fafc', borderRadius: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                        <BiGroup size={16} />
                      </div>
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{team.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <code style={{ padding: '4px 8px', background: '#fff', borderRadius: 6, color: '#6366f1', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid #e2e8f0' }}>{team.accessCode}</code>
                      <button onClick={() => copyAccessCode(team.accessCode)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                        {copiedCode === team.accessCode ? <BiCheck size={14} style={{ color: '#22c55e' }} /> : <BiCopy size={14} />}
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="admin-empty-state" style={{ padding: 32 }}>
                    <div className="admin-empty-icon" style={{ width: 56, height: 56 }}><BiGroup size={24} /></div>
                    <p className="admin-empty-title" style={{ fontSize: 14 }}>No teams registered yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Scoreboard */}
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 className="admin-card-title" style={{ margin: 0 }}><BiTrophy size={18} /> Live Scores</h3>
                <button className="admin-btn admin-btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => navigate('/admin/scoreboard')}>Full View</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                {scoreboard.length > 0 ? scoreboard.slice(0, 5).map((entry) => (
                  <div key={entry.teamId} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: entry.rank === 1 ? '#fef3c7' : '#f8fafc', borderRadius: 10,
                    border: entry.rank === 1 ? '1px solid #fcd34d' : '1px solid transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: entry.rank === 1 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : entry.rank === 2 ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)' : entry.rank === 3 ? 'linear-gradient(135deg, #ea580c, #fb923c)' : '#e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: entry.rank <= 3 ? '#fff' : '#64748b', fontWeight: 800, fontSize: 12
                      }}>
                        {entry.rank}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{entry.teamName}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: '#6366f1', fontSize: 16 }}>{entry.score}</span>
                  </div>
                )) : (
                  <div className="admin-empty-state" style={{ padding: 32 }}>
                    <div className="admin-empty-icon" style={{ width: 56, height: 56 }}><BiTrophy size={24} /></div>
                    <p className="admin-empty-title" style={{ fontSize: 14 }}>No scores yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedQuizId && (
        <div className="admin-card">
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><BiRocket size={32} /></div>
            <h3 className="admin-empty-title">Select a quiz to host</h3>
            <p className="admin-empty-text">Choose a READY or ACTIVE quiz from the dropdown above</p>
            <button className="admin-btn admin-btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/admin/quizzes')}>
              <BiCheckCircle size={16} /> Prepare a Quiz
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }`}</style>
    </div>
  );
}
