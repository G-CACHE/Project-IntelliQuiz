import { useState, useEffect } from 'react';
import { BiTrophy, BiRefresh, BiX, BiErrorCircle, BiMedal, BiCrown } from 'react-icons/bi';
import { scoreboardApi, quizzesApi, type ScoreboardEntry, type Quiz } from '../../services/api';
import CustomSelect from '../../components/common/CustomSelect';

export default function ScoreboardPage() {
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

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#c9a84c';
    if (rank === 2) return '#9ca3af';
    if (rank === 3) return '#b87333';
    return '#6b6264';
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return '#faf2df';
    if (rank === 2) return '#f3f4f6';
    if (rank === 3) return '#fdf3e7';
    return '#ffffff';
  };

  const getBarColor = (rank: number) => {
    if (rank === 1) return 'linear-gradient(90deg, #c9a84c, #e2c97e)';
    if (rank === 2) return 'linear-gradient(90deg, #9ca3af, #d1d5db)';
    if (rank === 3) return 'linear-gradient(90deg, #b87333, #d4956a)';
    return 'linear-gradient(90deg, #7a1733, #9f2346)';
  };

  if (loading && quizzes.length === 0) {
    return <div className="loading-container"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="superadmin-page">
      {/* Hero */}
      <div className="sa-page-hero">
        <div className="sa-page-hero-content">
          <div>
            <h1 className="sa-page-hero-title">Scoreboard</h1>
            <p className="sa-page-hero-subtitle">View quiz rankings and team scores</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5b4e51', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ accentColor: '#7a1733', width: 16, height: 16 }}
              />
              Auto-refresh
            </label>
            <button className="btn btn-primary" onClick={loadScoreboard} disabled={!selectedQuizId}>
              <BiRefresh size={18} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <div className="alert-content"><BiErrorCircle size={20} /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="btn-icon"><BiX size={20} /></button>
        </div>
      )}

      {/* Quiz Selector */}
      <div className="card sa-card-compact">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Quiz</label>
          <CustomSelect
            value={String(selectedQuizId)}
            onChange={(v) => setSelectedQuizId(parseInt(v) || 0)}
            placeholder="Select a quiz"
            options={quizzes.map((q) => ({ value: String(q.id), label: `${q.title} (${q.status})` }))}
          />
        </div>
      </div>

      {/* Quiz Info Strip */}
      {selectedQuiz && (
        <div className="card sa-card-compact">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#111111', fontSize: 15 }}>{selectedQuiz.title}</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6b6264' }}>
                {scoreboard.length} team{scoreboard.length !== 1 ? 's' : ''} competing
                {autoRefresh && (
                  <span style={{ marginLeft: 10, color: '#059669', fontWeight: 600 }}>
                    ● Live
                  </span>
                )}
              </p>
            </div>
            <span className={`badge ${selectedQuiz.status === 'ACTIVE' ? 'badge-success' : selectedQuiz.status === 'READY' ? 'badge-info' : 'badge-gray'}`}>
              {selectedQuiz.status}
            </span>
          </div>
        </div>
      )}

      {/* Podium — top 3 */}
      {selectedQuizId > 0 && scoreboard.length > 0 && (
        <>
          <div className="sb-podium">
            {/* 2nd */}
            <div className="sb-podium-slot sb-podium-slot--2">
              {scoreboard[1] && (
                <div className="card sb-podium-card">
                  <div className="sb-podium-rank" style={{ background: '#9ca3af' }}>2</div>
                  <BiMedal size={22} style={{ color: '#9ca3af', margin: '8px 0 4px' }} />
                  <p className="sb-podium-name">{scoreboard[1].teamName}</p>
                  <p className="sb-podium-score" style={{ color: '#9ca3af' }}>{scoreboard[1].score}</p>
                </div>
              )}
            </div>

            {/* 1st */}
            <div className="sb-podium-slot sb-podium-slot--1">
              {scoreboard[0] && (
                <div className="card sb-podium-card sb-podium-card--gold">
                  <BiCrown size={28} style={{ color: '#c9a84c' }} />
                  <div className="sb-podium-rank sb-podium-rank--lg" style={{ background: 'linear-gradient(135deg, #c9a84c, #7a1733)' }}>1</div>
                  <p className="sb-podium-name" style={{ fontWeight: 800 }}>{scoreboard[0].teamName}</p>
                  <p className="sb-podium-score" style={{ color: '#c9a84c', fontSize: 28 }}>{scoreboard[0].score}</p>
                </div>
              )}
            </div>

            {/* 3rd */}
            <div className="sb-podium-slot sb-podium-slot--3">
              {scoreboard[2] && (
                <div className="card sb-podium-card">
                  <div className="sb-podium-rank sb-podium-rank--sm" style={{ background: '#b87333' }}>3</div>
                  <BiMedal size={18} style={{ color: '#b87333', margin: '8px 0 4px' }} />
                  <p className="sb-podium-name">{scoreboard[2].teamName}</p>
                  <p className="sb-podium-score" style={{ color: '#b87333', fontSize: 18 }}>{scoreboard[2].score}</p>
                </div>
              )}
            </div>
          </div>

          {/* Full Rankings */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 16 }}>
              <BiTrophy size={18} style={{ color: '#7a1733' }} /> Full Rankings
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scoreboard.map((entry) => {
                const pct = maxScore > 0 ? (entry.score / maxScore) * 100 : 0;
                const rankColor = getRankColor(entry.rank);
                const rankBg = getRankBg(entry.rank);
                return (
                  <div key={entry.teamId} className="sb-rank-row" style={{ background: rankBg }}>
                    <div className="sb-rank-badge" style={{ color: rankColor }}>
                      {entry.rank <= 3
                        ? (entry.rank === 1 ? <BiCrown size={18} /> : <BiMedal size={18} />)
                        : entry.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: '#111111', fontSize: 14 }}>{entry.teamName}</span>
                        <span style={{ fontWeight: 700, fontSize: 15, color: rankColor }}>{entry.score}</span>
                      </div>
                      <div className="sb-bar-track">
                        <div className="sb-bar-fill" style={{ width: `${pct}%`, background: getBarColor(entry.rank) }} />
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
        <div className="card">
          <div className="empty-state">
            <BiTrophy size={48} className="empty-state-icon" />
            <h3>No scores yet</h3>
            <p>Teams will appear here once they start submitting answers</p>
          </div>
        </div>
      )}

      {!selectedQuizId && (
        <div className="card">
          <div className="empty-state">
            <BiTrophy size={48} className="empty-state-icon" />
            <h3>Select a quiz to view its scoreboard</h3>
            <p>Choose a quiz from the dropdown above</p>
          </div>
        </div>
      )}
    </div>
  );
}
