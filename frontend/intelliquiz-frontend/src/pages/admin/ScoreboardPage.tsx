import { useState, useEffect } from 'react';
import { BiTrophy, BiRefresh, BiX, BiErrorCircle, BiMedal, BiCrown } from 'react-icons/bi';
import { scoreboardApi, quizzesApi, type ScoreboardEntry, type Quiz } from '../../services/api';
import '../../styles/admin.css';

export default function AdminScoreboardPage() {
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => { loadQuizzes(); }, []);
  useEffect(() => { if (selectedQuizId) loadScoreboard(); else setScoreboard([]); }, [selectedQuizId]);
  useEffect(() => {
    if (!autoRefresh || !selectedQuizId) return;
    const interval = setInterval(loadScoreboard, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedQuizId]);

  const loadQuizzes = async () => {
    try {
      const data = await quizzesApi.getAll();
      setQuizzes(data);
      const active = data.find((q) => q.status === 'ACTIVE');
      if (active) setSelectedQuizId(active.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const loadScoreboard = async () => {
    if (!selectedQuizId) return;
    try {
      const data = await scoreboardApi.getByQuiz(selectedQuizId);
      setScoreboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scoreboard');
    }
  };

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);
  const maxScore = scoreboard.length > 0 ? Math.max(...scoreboard.map((s) => s.score)) : 0;

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: '#fef3c7', color: '#f59e0b', iconBg: 'linear-gradient(135deg, #f59e0b, #fbbf24)' };
    if (rank === 2) return { bg: '#f1f5f9', color: '#94a3b8', iconBg: 'linear-gradient(135deg, #94a3b8, #cbd5e1)' };
    if (rank === 3) return { bg: '#fed7aa', color: '#ea580c', iconBg: 'linear-gradient(135deg, #ea580c, #fb923c)' };
    return { bg: '#f8fafc', color: '#64748b', iconBg: '#e2e8f0' };
  };

  if (loading && quizzes.length === 0) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">Loading scoreboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header blue">
        <div className="admin-page-header-bg">
          <div className="admin-page-header-shape shape-1" />
          <div className="admin-page-header-shape shape-2" />
          <div className="admin-page-header-dots" />
        </div>
        <div className="admin-page-header-content">
          <div className="admin-page-header-left">
            <div className="admin-page-icon"><BiTrophy size={26} /></div>
            <div>
              <h1 className="admin-page-title">Scoreboard</h1>
              <p className="admin-page-subtitle">View quiz rankings and scores</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="admin-form-checkbox" />
              Auto-refresh
            </label>
            <button className="admin-btn admin-btn-primary" onClick={loadScoreboard} disabled={!selectedQuizId}>
              <BiRefresh size={16} /> Refresh
            </button>
          </div>
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
          <label className="admin-form-label">Select Quiz</label>
          <select value={selectedQuizId} onChange={(e) => setSelectedQuizId(parseInt(e.target.value))} className="admin-form-input admin-form-select">
            <option value={0}>Select a quiz</option>
            {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title} ({q.status})</option>)}
          </select>
        </div>
      </div>

      {/* Quiz Info */}
      {selectedQuiz && (
        <div className="admin-card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', borderColor: '#93c5fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedQuiz.title}</h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{scoreboard.length} teams competing</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {autoRefresh && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                  <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                  Live
                </span>
              )}
              <span className={`admin-badge-status ${selectedQuiz.status === 'ACTIVE' ? 'active' : selectedQuiz.status === 'READY' ? 'ready' : 'draft'}`}>{selectedQuiz.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Podium */}
      {selectedQuizId > 0 && scoreboard.length > 0 && (
        <>
          <div className="admin-grid-3" style={{ marginBottom: 24 }}>
            {/* 2nd Place */}
            <div style={{ order: 1 }}>
              {scoreboard[1] && (
                <div className="admin-card" style={{ textAlign: 'center', paddingTop: 28 }}>
                  <div style={{ width: 52, height: 52, margin: '0 auto', borderRadius: '50%', background: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800 }}>2</div>
                  <BiMedal size={22} style={{ color: '#94a3b8', margin: '10px 0' }} />
                  <h3 style={{ fontWeight: 700, color: '#1e293b', margin: 0, fontSize: 15 }}>{scoreboard[1].teamName}</h3>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#94a3b8', marginTop: 8 }}>{scoreboard[1].score}</p>
                </div>
              )}
            </div>
            {/* 1st Place */}
            <div style={{ order: 0 }}>
              {scoreboard[0] && (
                <div className="admin-card" style={{ textAlign: 'center', paddingTop: 20, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderColor: '#fcd34d' }}>
                  <BiCrown size={32} style={{ color: '#f59e0b' }} />
                  <div style={{ width: 64, height: 64, margin: '8px auto', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 800, boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}>1</div>
                  <h3 style={{ fontWeight: 800, fontSize: 17, color: '#1e293b', margin: 0 }}>{scoreboard[0].teamName}</h3>
                  <p style={{ fontSize: 36, fontWeight: 800, color: '#f59e0b', marginTop: 8 }}>{scoreboard[0].score}</p>
                </div>
              )}
            </div>
            {/* 3rd Place */}
            <div style={{ order: 2 }}>
              {scoreboard[2] && (
                <div className="admin-card" style={{ textAlign: 'center', paddingTop: 32 }}>
                  <div style={{ width: 44, height: 44, margin: '0 auto', borderRadius: '50%', background: 'linear-gradient(135deg, #ea580c, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 800 }}>3</div>
                  <BiMedal size={20} style={{ color: '#ea580c', margin: '10px 0' }} />
                  <h3 style={{ fontWeight: 700, color: '#1e293b', margin: 0, fontSize: 14 }}>{scoreboard[2].teamName}</h3>
                  <p style={{ fontSize: 24, fontWeight: 800, color: '#ea580c', marginTop: 8 }}>{scoreboard[2].score}</p>
                </div>
              )}
            </div>
          </div>

          {/* Full Rankings */}
          <div className="admin-card">
            <h2 className="admin-card-title"><BiTrophy size={18} /> Full Rankings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scoreboard.map((entry) => {
                const style = getRankStyle(entry.rank);
                const pct = maxScore > 0 ? (entry.score / maxScore) * 100 : 0;
                return (
                  <div key={entry.teamId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 10, background: style.bg }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: style.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: entry.rank <= 3 ? '#fff' : style.color, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                      {entry.rank <= 3 ? (entry.rank === 1 ? <BiCrown size={18} /> : <BiMedal size={18} />) : entry.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{entry.teamName}</span>
                        <span style={{ fontWeight: 800, fontSize: 16, color: style.color }}>{entry.score}</span>
                      </div>
                      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: entry.rank === 1 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : entry.rank === 2 ? 'linear-gradient(90deg, #94a3b8, #cbd5e1)' : entry.rank === 3 ? 'linear-gradient(90deg, #ea580c, #fb923c)' : 'linear-gradient(90deg, #6366f1, #818cf8)', transition: 'width 0.5s ease', borderRadius: 10 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {selectedQuizId > 0 && scoreboard.length === 0 && (
        <div className="admin-card">
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><BiTrophy size={32} /></div>
            <h3 className="admin-empty-title">No scores yet</h3>
            <p className="admin-empty-text">Teams will appear here once they start submitting answers</p>
          </div>
        </div>
      )}

      {!selectedQuizId && (
        <div className="admin-card">
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><BiTrophy size={32} /></div>
            <h3 className="admin-empty-title">Select a quiz to view its scoreboard</h3>
            <p className="admin-empty-text">Choose a quiz from the dropdown above</p>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
