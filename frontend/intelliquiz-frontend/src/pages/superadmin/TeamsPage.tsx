import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BiGroup, BiPlus, BiTrash, BiRefresh, BiSearch, BiX, BiErrorCircle, BiCopy, BiCheck } from 'react-icons/bi';
import { teamsApi, quizzesApi, type Team, type Quiz } from '../../services/api';
import CustomSelect from '../../components/common/CustomSelect';

export default function TeamsPage() {
  const [searchParams] = useSearchParams();
  const preselectedQuizId = searchParams.get('quizId');
  const [teams, setTeams] = useState<Team[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number>(preselectedQuizId ? parseInt(preselectedQuizId) : 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => { loadQuizzes(); }, []);
  useEffect(() => { if (selectedQuizId) loadTeams(); else setTeams([]); }, [selectedQuizId]);

  const loadQuizzes = async () => {
    try {
      const data = await quizzesApi.getAll();
      setQuizzes(data);
      if (preselectedQuizId) setSelectedQuizId(parseInt(preselectedQuizId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    if (!selectedQuizId) return;
    setLoading(true);
    try {
      const data = await teamsApi.getByQuiz(selectedQuizId);
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!teamName.trim()) return setError('Team name is required');
    if (!selectedQuizId) return setError('Please select a quiz first');
    try {
      await teamsApi.register(selectedQuizId, { name: teamName });
      setShowCreateModal(false);
      setTeamName('');
      loadTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    }
  };

  const handleDelete = async () => {
    if (!selectedTeam) return;
    try {
      await teamsApi.delete(selectedTeam.id);
      setShowDeleteModal(false);
      setSelectedTeam(null);
      loadTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
    }
  };

  const handleResetScores = async () => {
    if (!selectedQuizId) return;
    try {
      await teamsApi.resetScores(selectedQuizId);
      setShowResetModal(false);
      loadTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset scores');
    }
  };

  const copyAccessCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setError('Failed to copy access code');
    }
  };

  const filteredTeams = teams.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);

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
          top: -20,
          right: 80,
          width: 100,
          height: 100,
          background: 'rgba(248, 193, 7, 0.1)',
          borderRadius: '50%',
          filter: 'blur(30px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 15,
          right: 180,
          width: 30,
          height: 30,
          border: '2px solid rgba(248, 193, 7, 0.2)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          top: 20,
          right: 200,
          width: 6,
          height: 40,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-full)',
          transform: 'rotate(-15deg)',
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
              <BiGroup size={28} />
            </div>
            <div>
              <h1 style={{ color: 'var(--color-white)', fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0 }}>
                Team Management
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 'var(--font-size-sm)', margin: '4px 0 0' }}>
                Register and manage quiz teams
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            {selectedQuizId > 0 && teams.length > 0 && (
              <button className="btn btn-secondary" onClick={() => setShowResetModal(true)}>
                <BiRefresh size={18} /> Reset Scores
              </button>
            )}
            <button className="btn btn-primary" onClick={() => { setTeamName(''); setShowCreateModal(true); }} disabled={!selectedQuizId}>
              <BiPlus size={18} /> Register Team
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

      {/* Quiz Selector & Search */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Select Quiz</label>
            <CustomSelect
              value={selectedQuizId}
              onChange={(val) => setSelectedQuizId(Number(val))}
              placeholder="Select a quiz"
              options={[
                { value: 0, label: 'Select a quiz', disabled: true },
                ...quizzes.map((q) => ({ value: q.id, label: `${q.title} (${q.status})` }))
              ]}
            />
          </div>
          {selectedQuizId > 0 && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">Search Teams</label>
              <div style={{ position: 'relative' }}>
                <BiSearch size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search by team name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="form-input" style={{ paddingLeft: 48 }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Info */}
      {selectedQuiz && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)', background: 'rgba(248, 193, 7, 0.05)', borderColor: 'var(--border-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{selectedQuiz.title}</h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{teams.length} teams registered</p>
            </div>
            <span className={`badge ${selectedQuiz.status === 'ACTIVE' ? 'badge-success' : selectedQuiz.status === 'READY' ? 'badge-info' : 'badge-gray'}`}>{selectedQuiz.status}</span>
          </div>
        </div>
      )}

      {/* Teams Table */}
      {selectedQuizId > 0 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>TEAM NAME</th>
                <th>ACCESS CODE</th>
                <th>SCORE</th>
                <th>CREATED</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.length > 0 ? filteredTeams.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      <div style={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: 'var(--radius-md)', 
                        background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'var(--color-black)' 
                      }}>
                        <BiGroup size={18} />
                      </div>
                      <span style={{ fontWeight: 500 }}>{t.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                      <code style={{ 
                        padding: '6px 12px', 
                        background: 'var(--bg-secondary)', 
                        borderRadius: 'var(--radius-md)', 
                        color: 'var(--color-accent)', 
                        fontFamily: 'monospace', 
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 600,
                      }}>{t.accessCode}</code>
                      <button className="btn-icon" onClick={() => copyAccessCode(t.accessCode)} title="Copy">
                        {copiedCode === t.accessCode ? <BiCheck size={16} style={{ color: 'var(--color-success)' }} /> : <BiCopy size={16} />}
                      </button>
                    </div>
                  </td>
                  <td><span style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: 'var(--font-size-lg)' }}>{t.score}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon danger" onClick={() => { setSelectedTeam(t); setShowDeleteModal(true); }} title="Remove">
                      <BiTrash size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <BiGroup size={56} className="empty-state-icon" />
                      <p style={{ fontWeight: 600, marginTop: 'var(--spacing-md)' }}>{searchQuery ? 'No teams match your search' : 'No teams registered yet'}</p>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                        {searchQuery ? 'Try a different search term' : 'Register teams to participate in this quiz'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!selectedQuizId && (
        <div className="card">
          <div className="empty-state">
            <BiGroup size={56} className="empty-state-icon" />
            <p style={{ fontWeight: 600, marginTop: 'var(--spacing-md)' }}>Select a quiz to manage its teams</p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Choose a quiz from the dropdown above</p>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Register Team</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="form-input" placeholder="Enter team name" autoFocus />
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>An access code will be automatically generated for this team.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn btn-primary">Register Team</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Remove Team</h2>
              <button onClick={() => setShowDeleteModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  margin: '0 auto var(--spacing-md)',
                  background: 'rgba(136, 0, 21, 0.1)',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                }}>
                  <BiTrash size={28} />
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Are you sure you want to remove <strong style={{ color: 'var(--text-primary)' }}>{selectedTeam.name}</strong>?
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
                  This will also delete all their submissions.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn btn-danger">Remove Team</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Scores Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Reset All Scores</h2>
              <button onClick={() => setShowResetModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  margin: '0 auto var(--spacing-md)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-warning)',
                }}>
                  <BiRefresh size={28} />
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Are you sure you want to reset all team scores for <strong style={{ color: 'var(--text-primary)' }}>{selectedQuiz?.title}</strong>?
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowResetModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleResetScores} className="btn btn-danger">Reset Scores</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
