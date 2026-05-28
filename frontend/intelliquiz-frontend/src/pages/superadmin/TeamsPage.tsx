import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BiGroup, BiPlus, BiTrash, BiRefresh, BiSearch,
  BiX, BiErrorCircle, BiCopy, BiCheck,
} from 'react-icons/bi';
import { teamsApi, quizzesApi, type Team, type Quiz } from '../../services/api';
import CustomSelect from '../../components/common/CustomSelect';

export default function TeamsPage() {
  const [searchParams] = useSearchParams();
  const preselectedQuizId = searchParams.get('quizId');
  const [teams, setTeams] = useState<Team[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number>(
    preselectedQuizId ? parseInt(preselectedQuizId) : 0
  );
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

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);

  if (loading && quizzes.length === 0) {
    return <div className="loading-container"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="superadmin-page">
      {/* Hero */}
      <div className="sa-page-hero">
        <div className="sa-page-hero-content">
          <div>
            <h1 className="sa-page-hero-title">Team Management</h1>
            <p className="sa-page-hero-subtitle">Register and manage quiz teams</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {selectedQuizId > 0 && teams.length > 0 && (
              <button className="btn btn-secondary" onClick={() => setShowResetModal(true)}>
                <BiRefresh size={18} /> Reset Scores
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => { setTeamName(''); setShowCreateModal(true); }}
              disabled={!selectedQuizId}
            >
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
      <div className="card sa-card-compact">
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Select Quiz</label>
            <CustomSelect
              value={selectedQuizId}
              onChange={(val) => setSelectedQuizId(Number(val))}
              placeholder="Select a quiz"
              options={[
                { value: 0, label: 'Select a quiz', disabled: true },
                ...quizzes.map((q) => ({ value: q.id, label: `${q.title} (${q.status})` })),
              ]}
            />
          </div>
          {selectedQuizId > 0 && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">Search Teams</label>
              <div className="search-input-wrapper">
                <BiSearch size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by team name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 46 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Info Strip */}
      {selectedQuiz && (
        <div className="card sa-card-compact">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#111111', fontSize: 15 }}>{selectedQuiz.title}</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6b6264' }}>
                {teams.length} team{teams.length !== 1 ? 's' : ''} registered
              </p>
            </div>
            <span className={`badge ${selectedQuiz.status === 'ACTIVE' ? 'badge-success' : selectedQuiz.status === 'READY' ? 'badge-info' : 'badge-gray'}`}>
              {selectedQuiz.status}
            </span>
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
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.length > 0 ? (
                filteredTeams.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="sa-table-username">{t.name}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{
                          padding: '5px 10px',
                          background: '#faf2df',
                          border: '1px solid #eadfc2',
                          borderRadius: 8,
                          color: '#7a5a13',
                          fontFamily: 'monospace',
                          fontSize: 13,
                          fontWeight: 700,
                        }}>{t.accessCode}</code>
                        <button className="btn-icon" onClick={() => copyAccessCode(t.accessCode)} title="Copy code">
                          {copiedCode === t.accessCode
                            ? <BiCheck size={16} style={{ color: '#059669' }} />
                            : <BiCopy size={16} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#7a1733', fontSize: 16 }}>{t.totalScore}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon danger"
                        onClick={() => { setSelectedTeam(t); setShowDeleteModal(true); }}
                        title="Remove team"
                      >
                        <BiTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <BiGroup size={48} className="empty-state-icon" />
                      <h3>{searchQuery ? 'No teams match your search' : 'No teams registered yet'}</h3>
                      <p>{searchQuery ? 'Try a different search term' : 'Register teams to participate in this quiz'}</p>
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
            <BiGroup size={48} className="empty-state-icon" />
            <h3>Select a quiz to manage its teams</h3>
            <p>Choose a quiz from the dropdown above</p>
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
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="form-input"
                  placeholder="Enter team name"
                  autoFocus
                />
              </div>
              <p style={{ fontSize: 13, color: '#6b6264', margin: 0 }}>
                An access code will be automatically generated for this team.
              </p>
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
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <div style={{
                  width: 56, height: 56, margin: '0 auto 14px',
                  background: '#f6e9ed', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#7a1733',
                }}>
                  <BiTrash size={26} />
                </div>
                <p style={{ color: '#374151', margin: '0 0 6px' }}>
                  Remove <strong style={{ color: '#111111' }}>{selectedTeam.name}</strong>?
                </p>
                <p style={{ fontSize: 13, color: '#6b6264', margin: 0 }}>
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
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <div style={{
                  width: 56, height: 56, margin: '0 auto 14px',
                  background: '#faf2df', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#c9a84c',
                }}>
                  <BiRefresh size={26} />
                </div>
                <p style={{ color: '#374151', margin: '0 0 6px' }}>
                  Reset all scores for <strong style={{ color: '#111111' }}>{selectedQuiz?.title}</strong>?
                </p>
                <p style={{ fontSize: 13, color: '#6b6264', margin: 0 }}>
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
