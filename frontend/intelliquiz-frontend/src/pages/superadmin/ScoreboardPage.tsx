import { useState, useEffect } from 'react';
import { BiTrophy, BiRefresh, BiX, BiErrorCircle, BiMedal, BiCrown } from 'react-icons/bi';
import { scoreboardApi, quizzesApi, type ScoreboardEntry, type Quiz } from '../../services/api';

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

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'rgba(248, 193, 7, 0.15)', color: 'var(--color-accent)', iconBg: 'rgba(248, 193, 7, 0.2)' };
    if (rank === 2) return { bg: 'rgba(192, 192, 192, 0.1)', color: '#a0a0a0', iconBg: 'rgba(192, 192, 192, 0.15)' };
    if (rank === 3) return { bg: 'rgba(205, 127, 50, 0.1)', color: '#cd7f32', iconBg: 'rgba(205, 127, 50, 0.15)' };
    return { bg: 'transparent', color: 'var(--text-secondary)', iconBg: 'var(--bg-secondary)' };
  };

  if (loading && quizzes.length === 0) return <div className="loading-container"><div className="loading-spinner" /></div>;

  return (
    <div>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-xl)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 100,
          width: 160,
          height: 160,
          background: 'radial-gradient(circle, rgba(248, 193, 7, 0.1) 0%, transparent 60%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 10,
          right: 60,
          width: 40,
          height: 40,
          border: '2px solid rgba(248, 193, 7, 0.15)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          top: 30,
          right: 220,
          width: 20,
          height: 20,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div style={{
              width: 56,
              height: 56,
              background: 'rgba(248, 193, 7, 0.2)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)',
            }}>
              <BiTrophy size={28} />
            </div>
            <div>
              <h1 style={{ color: 'var(--color-white)', fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0 }}>
                Scoreboard
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 'var(--font-size-sm)', margin: '4px 0 0' }}>
                View quiz rankings and scores
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'rgba(255, 255, 255, 0.8)' }}>
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="form-checkbox" />
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
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Quiz</label>
          <select value={selectedQuizId} onChange={(e) => setSelectedQuizId(parseInt(e.target.value))} className="form-input form-select">
            <option value={0}>Select a quiz</option>
            {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title} ({q.status})</option>)}
          </select>
        </div>
      </div>

      {/* Quiz Info */}
      {selectedQuiz && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)', background: 'rgba(248, 193, 7, 0.05)', borderColor: 'var(--border-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{selectedQuiz.title}</h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{scoreboard.length} teams competing</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              {autoRefresh && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-success)' }}>
                  <div style={{ width: 8, height: 8, background: 'var(--color-success)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                  Live
                </span>
              )}
              <span className={`badge ${selectedQuiz.status === 'ACTIVE' ? 'badge-success' : selectedQuiz.status === 'READY' ? 'badge-info' : 'badge-gray'}`}>{selectedQuiz.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Podium */}
      {selectedQuizId > 0 && scoreboard.length > 0 && (
        <>
          <div className="grid-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
            {/* 2nd Place */}
            <div style={{ order: 1 }}>
              {scoreboard[1] && (
                <div className="card" style={{ textAlign: 'center', paddingTop: 'var(--spacing-xl)', background: 'rgba(192, 192, 192, 0.05)' }}>
                  <div style={{ 
                    width: 56, 
                    height: 56, 
                    margin: '0 auto', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #a0a0a0, #707070)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white', 
                    fontSize: 'var(--font-size-xl)', 
                    fontWeight: 700 
                  }}>2</div>
                  <BiMedal size={24} style={{ color: '#a0a0a0', margin: 'var(--spacing-sm) 0' }} />
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{scoreboard[1].teamName}</h3>
                  <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: '#a0a0a0', marginTop: 'var(--spacing-sm)' }}>{scoreboard[1].score}</p>
                </div>
              )}
            </div>
            {/* 1st Place */}
            <div style={{ order: 0 }}>
              {scoreboard[0] && (
                <div className="card" style={{ textAlign: 'center', paddingTop: 'var(--spacing-lg)', background: 'rgba(248, 193, 7, 0.08)', borderColor: 'var(--color-accent)' }}>
                  <BiCrown size={32} style={{ color: 'var(--color-accent)' }} />
                  <div style={{ 
                    width: 72, 
                    height: 72, 
                    margin: 'var(--spacing-sm) auto', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white', 
                    fontSize: 'var(--font-size-2xl)', 
                    fontWeight: 700 
                  }}>1</div>
                  <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)', margin: 0 }}>{scoreboard[0].teamName}</h3>
                  <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-accent)', marginTop: 'var(--spacing-sm)' }}>{scoreboard[0].score}</p>
                </div>
              )}
            </div>
            {/* 3rd Place */}
            <div style={{ order: 2 }}>
              {scoreboard[2] && (
                <div className="card" style={{ textAlign: 'center', paddingTop: 'var(--spacing-2xl)', background: 'rgba(205, 127, 50, 0.05)' }}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    margin: '0 auto', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #cd7f32, #8b5513)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white', 
                    fontSize: 'var(--font-size-lg)', 
                    fontWeight: 700 
                  }}>3</div>
                  <BiMedal size={20} style={{ color: '#cd7f32', margin: 'var(--spacing-sm) 0' }} />
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{scoreboard[2].teamName}</h3>
                  <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: '#cd7f32', marginTop: 'var(--spacing-sm)' }}>{scoreboard[2].score}</p>
                </div>
              )}
            </div>
          </div>

          {/* Full Rankings */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <BiTrophy size={20} /> Full Rankings
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {scoreboard.map((entry) => {
                const style = getRankStyle(entry.rank);
                const pct = maxScore > 0 ? (entry.score / maxScore) * 100 : 0;
                return (
                  <div key={entry.teamId} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-md)', 
                    padding: 'var(--spacing-md)', 
                    borderRadius: 'var(--radius-lg)', 
                    background: style.bg, 
                    border: '1px solid var(--border-secondary)' 
                  }}>
                    <div style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: '50%', 
                      background: style.iconBg, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: style.color, 
                      fontWeight: 700,
                      fontSize: 'var(--font-size-base)',
                      flexShrink: 0,
                    }}>
                      {entry.rank <= 3 ? (entry.rank === 1 ? <BiCrown size={20} /> : <BiMedal size={20} />) : entry.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{entry.teamName}</span>
                        <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: style.color }}>{entry.score}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${pct}%`, 
                          background: entry.rank === 1 ? 'linear-gradient(90deg, var(--color-accent), var(--color-accent-light))' : 
                                      entry.rank === 2 ? 'linear-gradient(90deg, #a0a0a0, #c0c0c0)' :
                                      entry.rank === 3 ? 'linear-gradient(90deg, #cd7f32, #daa06d)' :
                                      'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))', 
                          transition: 'width 0.5s ease',
                          borderRadius: 'var(--radius-full)',
                        }} />
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
            <BiTrophy size={56} className="empty-state-icon" />
            <p style={{ fontWeight: 600, marginTop: 'var(--spacing-md)' }}>No scores yet</p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              Teams will appear here once they start submitting answers
            </p>
          </div>
        </div>
      )}

      {!selectedQuizId && (
        <div className="card">
          <div className="empty-state">
            <BiTrophy size={56} className="empty-state-icon" />
            <p style={{ fontWeight: 600, marginTop: 'var(--spacing-md)' }}>Select a quiz to view its scoreboard</p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Choose a quiz from the dropdown above</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
