import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiBookOpen,
  BiPlus,
  BiEdit,
  BiTrash,
  BiPlay,
  BiPause,
  BiCheckCircle,
  BiSearch,
  BiX,
  BiErrorCircle,
  BiFile,
  BiGroup,
  BiCalendar,
  BiTime,
} from 'react-icons/bi';
import { quizzesApi, type Quiz, type CreateQuizRequest } from '../../services/api';
import '../../styles/admin.css';

export default function AdminQuizzesPage() {
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
  const navigate = useNavigate();

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

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = { DRAFT: 'draft', READY: 'ready', ACTIVE: 'active', ARCHIVED: 'archived' };
    return map[status] || 'draft';
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">Loading quizzes...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header red">
        <div className="admin-page-header-bg">
          <div className="admin-page-header-shape shape-1" />
          <div className="admin-page-header-shape shape-2" />
          <div className="admin-page-header-dots" />
        </div>
        <div className="admin-page-header-content">
          <div className="admin-page-header-left">
            <div className="admin-page-icon"><BiBookOpen size={26} /></div>
            <div>
              <h1 className="admin-page-title">My Quizzes</h1>
              <p className="admin-page-subtitle">Create and manage your quiz collection</p>
            </div>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <BiPlus size={18} /> Create Quiz
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <div className="admin-alert-content"><BiErrorCircle size={18} /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="admin-btn-icon" style={{ width: 32, height: 32 }}><BiX size={18} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <BiSearch size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-form-input"
              style={{ paddingLeft: 42 }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-form-input admin-form-select"
            style={{ width: 'auto', minWidth: 140 }}
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="admin-quiz-grid">
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="admin-quiz-card">
              <div className={`admin-quiz-card-top ${getStatusClass(quiz.status)}`} />
              <div className="admin-quiz-card-body">
                <div className="admin-quiz-header">
                  <div style={{ flex: 1 }}>
                    <h3 className="admin-quiz-title">{quiz.title}</h3>
                    <p className="admin-quiz-desc">{quiz.description || 'No description'}</p>
                  </div>
                  <span className={`admin-badge-status ${getStatusClass(quiz.status)}`}>{quiz.status}</span>
                </div>
                <div className="admin-quiz-meta">
                  <div className="admin-quiz-meta-item"><BiCalendar size={14} /> {new Date(quiz.createdAt).toLocaleDateString()}</div>
                  <div className="admin-quiz-meta-item"><BiTime size={14} /> {quiz.questionCount || 0} questions</div>
                </div>
              </div>
              <div className="admin-quiz-footer">
                <div className="admin-quiz-actions">
                  <button className="admin-btn-icon" onClick={() => navigate(`/admin/quizzes/${quiz.id}/questions`)} title="Questions">
                    <BiFile size={16} />
                  </button>
                  <button className="admin-btn-icon" onClick={() => navigate(`/admin/teams?quizId=${quiz.id}`)} title="Teams">
                    <BiGroup size={16} />
                  </button>
                </div>
                <div className="admin-quiz-actions">
                  {quiz.status === 'DRAFT' && (
                    <button className="admin-btn-icon success" onClick={() => handleStatusChange(quiz.id, 'ready')} title="Mark Ready">
                      <BiCheckCircle size={16} />
                    </button>
                  )}
                  {quiz.status === 'READY' && (
                    <button className="admin-btn-icon success" onClick={() => handleStatusChange(quiz.id, 'activate')} title="Go Live">
                      <BiPlay size={16} />
                    </button>
                  )}
                  {quiz.status === 'ACTIVE' && (
                    <button className="admin-btn-icon" onClick={() => handleStatusChange(quiz.id, 'deactivate')} title="Stop">
                      <BiPause size={16} />
                    </button>
                  )}
                  <button className="admin-btn-icon" onClick={() => { setSelectedQuiz(quiz); setFormData({ title: quiz.title, description: quiz.description || '' }); setShowEditModal(true); }} title="Edit">
                    <BiEdit size={16} />
                  </button>
                  <button className="admin-btn-icon danger" onClick={() => { setSelectedQuiz(quiz); setShowDeleteModal(true); }} title="Delete">
                    <BiTrash size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="admin-card">
              <div className="admin-empty-state">
                <div className="admin-empty-icon"><BiBookOpen size={32} /></div>
                <h3 className="admin-empty-title">No quizzes found</h3>
                <p className="admin-empty-text">{searchQuery || statusFilter !== 'ALL' ? 'Try different filters' : 'Create your first quiz to get started'}</p>
                {!searchQuery && statusFilter === 'ALL' && (
                  <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
                    <BiPlus size={16} /> Create Quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Create New Quiz</h2>
              <button onClick={() => setShowCreateModal(false)} className="admin-btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}><BiX size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">Quiz Title *</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="admin-form-input" 
                  placeholder="Enter an exciting quiz title" 
                  maxLength={200}
                  autoFocus 
                />
                <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'block' }}>
                  {formData.title.length}/200 characters
                </span>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Description (Optional)</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="admin-form-input admin-form-textarea" 
                  placeholder="What's this quiz about?" 
                  rows={4} 
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="admin-btn admin-btn-primary">Create Quiz</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedQuiz && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Edit Quiz</h2>
              <button onClick={() => setShowEditModal(false)} className="admin-btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}><BiX size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">Quiz Title *</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="admin-form-input" 
                  maxLength={200}
                  autoFocus 
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Description (Optional)</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="admin-form-input admin-form-textarea" 
                  rows={4} 
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowEditModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={handleUpdate} className="admin-btn admin-btn-primary">Update Quiz</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedQuiz && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              <h2 className="admin-modal-title">Delete Quiz</h2>
              <button onClick={() => setShowDeleteModal(false)} className="admin-btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}><BiX size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div style={{
                  width: 64, height: 64, margin: '0 auto 16px',
                  background: '#fef2f2', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444'
                }}>
                  <BiTrash size={28} />
                </div>
                <p style={{ color: '#64748b', fontSize: 14 }}>
                  Are you sure you want to delete <strong style={{ color: '#1e293b' }}>{selectedQuiz.title}</strong>?
                </p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                  This will also delete all questions, teams, and submissions.
                </p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="admin-btn admin-btn-danger">Delete Quiz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
