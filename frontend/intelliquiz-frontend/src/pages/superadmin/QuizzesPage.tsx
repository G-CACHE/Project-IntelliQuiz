import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiBookOpen,
  BiPlus,
  BiEdit,
  BiTrash,
  BiPlay,
  BiPause,
  BiArchive,
  BiCheckCircle,
  BiSearch,
  BiX,
  BiErrorCircle,
  BiFile,
  BiGroup,
  BiTime,
  BiCopy,
  BiKey,
} from 'react-icons/bi';
import { quizzesApi, type Quiz, type CreateQuizRequest } from '../../services/api';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [formData, setFormData] = useState<CreateQuizRequest>({ title: '', description: '' });
  const [copiedPin, setCopiedPin] = useState<number | null>(null);
  const navigate = useNavigate();

  // Copy proctor PIN to clipboard
  const copyProctorPin = async (quizId: number, pin: string) => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopiedPin(quizId);
      setTimeout(() => setCopiedPin(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => { loadQuizzes(); }, []);

  useEffect(() => {
    let filtered = quizzes;
    if (searchQuery) {
      filtered = filtered.filter((q) =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((q) => q.status === statusFilter);
    }
    setFilteredQuizzes(filtered);
  }, [quizzes, searchQuery, statusFilter]);

  const loadQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await quizzesApi.getAll();
      setQuizzes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) return setError('Title is required');
    try {
      await quizzesApi.create(formData);
      setShowCreateModal(false);
      resetForm();
      loadQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    }
  };

  const handleUpdate = async () => {
    if (!selectedQuiz || !formData.title.trim()) return setError('Title is required');
    try {
      await quizzesApi.update(selectedQuiz.id, formData);
      setShowEditModal(false);
      setSelectedQuiz(null);
      resetForm();
      loadQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quiz');
    }
  };

  const handleDelete = async () => {
    if (!selectedQuiz) return;
    try {
      await quizzesApi.delete(selectedQuiz.id);
      setShowDeleteModal(false);
      setSelectedQuiz(null);
      loadQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quiz');
    }
  };

  const handleStatusChange = async (quizId: number, action: 'ready' | 'activate' | 'deactivate' | 'archive') => {
    try {
      if (action === 'ready') await quizzesApi.markReady(quizId);
      else if (action === 'activate') await quizzesApi.activate(quizId);
      else if (action === 'deactivate') await quizzesApi.deactivate(quizId);
      else if (action === 'archive') await quizzesApi.archive(quizId);
      loadQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} quiz`);
    }
  };

  const resetForm = () => { setFormData({ title: '', description: '' }); setError(null); };

  const getStatusConfig = (status: Quiz['status']) => {
    const config: Record<string, { class: string; icon: React.ReactNode }> = {
      DRAFT: { class: 'badge-gray', icon: <BiFile size={12} /> },
      READY: { class: 'badge-info', icon: <BiCheckCircle size={12} /> },
      ACTIVE: { class: 'badge-success', icon: <BiPlay size={12} /> },
      ARCHIVED: { class: 'badge-warning', icon: <BiArchive size={12} /> },
    };
    return config[status] || config.DRAFT;
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner" /></div>;

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
          top: 10,
          right: 120,
          width: 140,
          height: 140,
          background: 'radial-gradient(circle, rgba(248, 193, 7, 0.12) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 10,
          right: 60,
          width: 50,
          height: 50,
          border: '2px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-lg)',
          transform: 'rotate(30deg)',
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          right: 220,
          width: 4,
          height: 50,
          background: 'rgba(248, 193, 7, 0.3)',
          borderRadius: 'var(--radius-full)',
          transform: 'translateY(-50%)',
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
              <BiBookOpen size={28} />
            </div>
            <div>
              <h1 style={{ color: 'var(--color-white)', fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: 0 }}>
                Quiz Management
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 'var(--font-size-sm)', margin: '4px 0 0' }}>
                Create and manage quizzes
              </p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <BiPlus size={18} /> Create Quiz
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <div className="alert-content"><BiErrorCircle size={20} /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="btn-icon"><BiX size={20} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <BiSearch size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search quizzes..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="form-input" style={{ paddingLeft: 48 }} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input form-select" style={{ width: 'auto', minWidth: 150 }}>
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="grid-3">
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz) => {
            const statusConfig = getStatusConfig(quiz.status);
            return (
              <div key={quiz.id} className="data-card">
                <div className="data-card-header">
                  <span className="badge badge-accent" style={{ fontSize: '10px' }}>QUIZ {quiz.id}</span>
                  <span className={`badge ${statusConfig.class}`}>{statusConfig.icon} {quiz.status}</span>
                </div>
                <h4 className="data-card-title">{quiz.title}</h4>
                <p className="data-card-subtitle">{quiz.description || 'No description'}</p>
                
                {/* Proctor PIN - clickable to copy */}
                {quiz.proctorPin && (
                  <div 
                    style={{ 
                      background: 'linear-gradient(135deg, #e21b3c 0%, #ff6b6b 100%)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onClick={() => copyProctorPin(quiz.id, quiz.proctorPin)}
                    title="Click to copy Proctor PIN"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BiKey size={18} style={{ color: 'rgba(255,255,255,0.9)' }} />
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Proctor PIN
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'monospace', letterSpacing: '2px' }}>
                          {quiz.proctorPin}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.9)' }}>
                      {copiedPin === quiz.id ? (
                        <>
                          <BiCheckCircle size={14} />
                          <span style={{ fontSize: 11, fontWeight: 500 }}>Copied!</span>
                        </>
                      ) : (
                        <>
                          <BiCopy size={14} />
                          <span style={{ fontSize: 11, fontWeight: 500 }}>Copy</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="data-card-meta">
                  <div className="data-card-meta-item"><BiTime size={14} /> {quiz.questionCount || 0} questions</div>
                </div>
                <div className="data-card-footer">
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => navigate(`/superadmin/quizzes/${quiz.id}/questions`)}>
                      <BiFile size={14} /> Questions
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => navigate(`/superadmin/teams?quizId=${quiz.id}`)}>
                      <BiGroup size={14} /> Teams
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    {quiz.status === 'DRAFT' && (
                      <button className="btn-icon success" onClick={() => handleStatusChange(quiz.id, 'ready')} title="Mark Ready">
                        <BiCheckCircle size={18} />
                      </button>
                    )}
                    {quiz.status === 'READY' && (
                      <button className="btn-icon success" onClick={() => handleStatusChange(quiz.id, 'activate')} title="Activate">
                        <BiPlay size={18} />
                      </button>
                    )}
                    {quiz.status === 'ACTIVE' && (
                      <button className="btn-icon" onClick={() => handleStatusChange(quiz.id, 'deactivate')} title="Deactivate">
                        <BiPause size={18} />
                      </button>
                    )}
                    <button className="btn-icon" onClick={() => { setSelectedQuiz(quiz); setFormData({ title: quiz.title, description: quiz.description || '' }); setShowEditModal(true); }} title="Edit">
                      <BiEdit size={18} />
                    </button>
                    <button className="btn-icon danger" onClick={() => { setSelectedQuiz(quiz); setShowDeleteModal(true); }} title="Delete">
                      <BiTrash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card" style={{ gridColumn: 'span 3' }}>
            <div className="empty-state">
              <BiBookOpen size={56} className="empty-state-icon" />
              <p style={{ fontWeight: 600, marginTop: 'var(--spacing-md)' }}>No quizzes found</p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                {searchQuery || statusFilter !== 'ALL' ? 'Try different filters' : 'Create your first quiz to get started'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Quiz</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input" placeholder="Enter quiz title" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input form-textarea" placeholder="Enter quiz description" rows={4} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn btn-primary">Create Quiz</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedQuiz && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Quiz</h2>
              <button onClick={() => setShowEditModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input form-textarea" rows={4} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleUpdate} className="btn btn-primary">Update Quiz</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedQuiz && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Quiz</h2>
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
                  Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{selectedQuiz.title}</strong>?
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
                  This will also delete all questions, teams, and submissions.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn btn-danger">Delete Quiz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
