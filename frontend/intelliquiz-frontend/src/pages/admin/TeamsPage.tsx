import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BiGroup, BiPlus, BiTrash, BiRefresh, BiSearch, BiX, BiErrorCircle, BiCopy, BiCheck } from 'react-icons/bi';
import { teamsApi, quizzesApi, type Team, type Quiz } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import CustomSelect from '../../components/common/CustomSelect';
import '../../styles/admin.css';

export default function AdminTeamsPage() {
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
  const { assignments, isSuperAdmin, canManageTeams } = useAuth();

  useEffect(() => { loadQuizzes(); }, []);
  useEffect(() => { if (selectedQuizId) loadTeams(); else setTeams([]); }, [selectedQuizId]);

  const loadQuizzes = async () => {
    try {
      const allQuizzes = await quizzesApi.getAll();
      
      // Filter quizzes based on user's CAN_MANAGE_TEAMS permission (unless super admin)
      let filteredQuizzes = allQuizzes;
      if (!isSuperAdmin()) {
        const quizIdsWithTeamPermission = assignments
          .filter(a => a.permissions.includes('CAN_MANAGE_TEAMS'))
          .map(a => a.quizId);
        filteredQuizzes = allQuizzes.filter(q => quizIdsWithTeamPermission.includes(q.id));
      }
      
      setQuizzes(filteredQuizzes);
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

  if (loading && quizzes.length === 0) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-dots"><span /><span /><span /><span /></div>
        <p className="admin-loading-text">Loading teams...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header teal">
        <div className="admin-page-header-bg">
          <div className="admin-page-header-shape shape-1" />
          <div className="admin-page-header-shape shape-2" />
          <div className="admin-page-header-dots" />
        </div>
        <div className="admin-page-header-content">
          <div className="admin-page-header-left">
            <div className="admin-page-icon" style={{ background: 'rgba(255,255,255,0.2)' }}><BiGroup size={32} /></div>
            <div>
              <h1 className="admin-page-title">Team Management</h1>
              <p className="admin-page-subtitle">Register and manage quiz teams</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {selectedQuizId > 0 && teams.length > 0 && (
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowResetModal(true)}>
                <BiRefresh size={18} /> Reset Scores
              </button>
            )}
            <button className="admin-btn admin-btn-primary" onClick={() => { setTeamName(''); setShowCreateModal(true); }} disabled={!selectedQuizId}>
              <BiPlus size={18} /> Register Team
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <div className="admin-alert-content"><BiErrorCircle size={20} /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="admin-btn-icon"><BiX size={20} /></button>
        </div>
      )}

      {/* Quiz Selector & Search */}
      <div className="admin-card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="admin-form-label">Select Quiz</label>
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
              <label className="admin-form-label">Search Teams</label>
              <div style={{ position: 'relative' }}>
                <BiSearch size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input type="text" placeholder="Search by team name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="admin-form-input" style={{ paddingLeft: 48 }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Info */}
      {selectedQuiz && (
        <div className="admin-card" style={{ marginBottom: 24, background: 'rgba(38, 137, 12, 0.1)', borderColor: 'rgba(38, 137, 12, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 700, color: '#fff', margin: 0 }}>{selectedQuiz.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>{teams.length} teams registered</p>
            </div>
            <span className={`admin-badge-status ${selectedQuiz.status === 'ACTIVE' ? 'active' : selectedQuiz.status === 'READY' ? 'ready' : 'draft'}`}>{selectedQuiz.status}</span>
          </div>
        </div>
      )}

      {/* Teams Table */}
      {selectedQuizId > 0 && (
        <div className="admin-table-container">
          <table className="admin-table">
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        width: 40, height: 40, borderRadius: 10, 
                        background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-light))', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' 
                      }}>
                        <BiGroup size={20} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{t.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ 
                        padding: '8px 14px', background: 'rgba(255,255,255,0.08)', borderRadius: 8, 
                        color: 'var(--admin-accent)', fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                      }}>{t.accessCode}</code>
                      <button className="admin-btn-icon" style={{ width: 32, height: 32 }} onClick={() => copyAccessCode(t.accessCode)} title="Copy">
                        {copiedCode === t.accessCode ? <BiCheck size={16} style={{ color: '#34d399' }} /> : <BiCopy size={16} />}
                      </button>
                    </div>
                  </td>
                  <td><span style={{ fontWeight: 800, color: 'var(--admin-accent)', fontSize: 18 }}>{t.score}</span></td>
                  <td style={{ color: 'rgba(255,255,255,0.6)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="admin-btn-icon danger" onClick={() => { setSelectedTeam(t); setShowDeleteModal(true); }} title="Remove">
                      <BiTrash size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-icon"><BiGroup size={40} /></div>
                      <h3 className="admin-empty-title">{searchQuery ? 'No teams match your search' : 'No teams registered yet'}</h3>
                      <p className="admin-empty-text">{searchQuery ? 'Try a different search term' : 'Register teams to participate in this quiz'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!selectedQuizId && (
        <div className="admin-card">
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><BiGroup size={40} /></div>
            <h3 className="admin-empty-title">Select a quiz to manage its teams</h3>
            <p className="admin-empty-text">Choose a quiz from the dropdown above</p>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Register Team</h2>
              <button onClick={() => setShowCreateModal(false)} className="admin-btn-icon" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}><BiX size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">Team Name</label>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="admin-form-input" placeholder="Enter team name" autoFocus />
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>An access code will be automatically generated for this team.</p>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="admin-btn admin-btn-primary">Register Team</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedTeam && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Remove Team</h2>
              <button onClick={() => setShowDeleteModal(false)} className="admin-btn-icon" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}><BiX size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{
                  width: 72, height: 72, margin: '0 auto 20px',
                  background: 'rgba(226, 27, 60, 0.15)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e21b3c',
                }}>
                  <BiTrash size={32} />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Are you sure you want to remove <strong style={{ color: '#fff' }}>{selectedTeam.name}</strong>?
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                  This will also delete all their submissions.
                </p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="admin-btn admin-btn-danger">Remove Team</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Scores Modal */}
      {showResetModal && (
        <div className="admin-modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Reset All Scores</h2>
              <button onClick={() => setShowResetModal(false)} className="admin-btn-icon" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}><BiX size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{
                  width: 72, height: 72, margin: '0 auto 20px',
                  background: 'rgba(245, 158, 11, 0.15)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b',
                }}>
                  <BiRefresh size={32} />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Are you sure you want to reset all team scores for <strong style={{ color: '#fff' }}>{selectedQuiz?.title}</strong>?
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowResetModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={handleResetScores} className="admin-btn admin-btn-danger">Reset Scores</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
