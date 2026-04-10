import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiBookOpen,
  BiEdit,
  BiPause,
  BiCheckCircle,
  BiSearch,
  BiX,
  BiErrorCircle,
  BiFile,
  BiTime,
  BiLock,
  BiTrash,
} from 'react-icons/bi';
import { useQuizzes, useCreateQuiz, useUpdateQuiz, useQuizStatusChange, useDeleteQuiz } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import type { Quiz, CreateQuizRequest } from '../../services/api';
import '../../styles/admin.css';
import './QuizzesPage.css';

export default function AdminQuizzesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [formData, setFormData] = useState<CreateQuizRequest>({
    title: '',
    description: '',
    accessMode: 'RESTRICTED',
    navigationMode: 'TOURNAMENT',
    globalTimeLimitSeconds: 0,
    randomizeQuestions: false,
  });
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [quizPendingDelete, setQuizPendingDelete] = useState<Quiz | null>(null);
  const navigate = useNavigate();
  
  const { canEditQuiz, canViewQuiz } = useAuth();
  
  // React Query hooks
  const { data: quizzes = [], isLoading, error } = useQuizzes();
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const deleteQuiz = useDeleteQuiz();
  const statusChange = useQuizStatusChange();

  // Filter quizzes based on search/status (backend already filters by createdByUserId)
  const filteredQuizzes = useMemo(() => {
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
    return filtered;
  }, [quizzes, searchQuery, statusFilter]);

  const quizStats = useMemo(() => {
    const draft = quizzes.filter((quiz) => quiz.status === 'DRAFT').length;
    const ready = quizzes.filter((quiz) => quiz.status === 'READY').length;
    const active = quizzes.filter((quiz) => quiz.status === 'ACTIVE').length;
    return {
      total: quizzes.length,
      filtered: filteredQuizzes.length,
      draft,
      ready,
      active,
    };
  }, [quizzes, filteredQuizzes]);

  const handleCreate = async () => {
    if (!formData.title.trim()) return;
    try {
      setCreatingQuiz(true);
      await createQuiz.mutateAsync({
        title: formData.title,
        description: formData.description,
      });
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create quiz:', err);
    } finally {
      setCreatingQuiz(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedQuiz || !formData.title.trim()) return;
    try {
      await updateQuiz.mutateAsync({ id: selectedQuiz.id, data: formData });
      setShowEditModal(false);
      setSelectedQuiz(null);
      resetForm();
    } catch (err) {
      console.error('Failed to update quiz:', err);
    }
  };

  const handleStatusChange = async (quizId: number, action: 'ready' | 'activate' | 'deactivate' | 'archive') => {
    try {
      await statusChange.mutateAsync({ id: quizId, action });
    } catch (err) {
      console.error(`Failed to ${action} quiz:`, err);
    }
  };

  const handleDeleteQuiz = async (quiz: Quiz) => {
    setQuizPendingDelete(quiz);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizPendingDelete) return;

    try {
      await deleteQuiz.mutateAsync(quizPendingDelete.id);
      setQuizPendingDelete(null);
    } catch (err) {
      console.error('Failed to delete quiz:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      accessMode: 'RESTRICTED',
      navigationMode: 'TOURNAMENT',
      globalTimeLimitSeconds: 0,
      randomizeQuestions: false,
    });
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = { DRAFT: 'draft', READY: 'ready', ACTIVE: 'active', ARCHIVED: 'archived' };
    return map[status] || 'draft';
  };

  const getStatusLabel = (status: string) => status === 'ARCHIVED' ? 'DONE' : status;

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">Loading quizzes...</p>
      </div>
    );
  }

  return (
    <div className="quiz-list-shell">
      <div className="quiz-list-hero">
        <div>
          <p className="quiz-list-eyebrow">Quiz Operations</p>
          <h1 className="quiz-list-title">My Quizzes</h1>
          <p className="quiz-list-subtitle">Manage quiz lifecycle, content, and launch state from one place.</p>
        </div>
        <button
          className="admin-btn quiz-list-create-btn"
          onClick={() => { resetForm(); setShowCreateModal(true); }}
        >
          Create Quiz
        </button>
      </div>

      <div className="quiz-list-stats-row">
        <div className="quiz-list-stat-chip">
          <span className="quiz-list-stat-label">Total</span>
          <span className="quiz-list-stat-value">{quizStats.total}</span>
        </div>
        <div className="quiz-list-stat-chip">
          <span className="quiz-list-stat-label">Filtered</span>
          <span className="quiz-list-stat-value">{quizStats.filtered}</span>
        </div>
        <div className="quiz-list-stat-chip">
          <span className="quiz-list-stat-label">Draft</span>
          <span className="quiz-list-stat-value">{quizStats.draft}</span>
        </div>
        <div className="quiz-list-stat-chip">
          <span className="quiz-list-stat-label">Ready</span>
          <span className="quiz-list-stat-value">{quizStats.ready}</span>
        </div>
        <div className="quiz-list-stat-chip">
          <span className="quiz-list-stat-label">Live</span>
          <span className="quiz-list-stat-value">{quizStats.active}</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <div className="admin-alert-content"><BiErrorCircle size={18} /><span>{error instanceof Error ? error.message : 'An error occurred'}</span></div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-card quiz-list-filter-card quiz-list-filter-bar">
        <div className="quiz-list-filter-controls">
          <div className="quiz-list-search-wrap">
            <BiSearch size={18} className="quiz-list-search-icon" />
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
            className="admin-form-input admin-form-select quiz-list-status-select"
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
            <div
              key={quiz.id}
              className="admin-quiz-card quiz-list-card"
              onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/admin/quizzes/${quiz.id}`);
                }
              }}
              title="Open quiz workspace"
            >
              <div className={`admin-quiz-card-top ${getStatusClass(quiz.status)}`} />
              <div className="admin-quiz-card-body">
                <div className="admin-quiz-header">
                  <div style={{ flex: 1 }}>
                    <h3 className="admin-quiz-title">{quiz.title}</h3>
                    <p className="admin-quiz-desc">{quiz.description || 'No description'}</p>
                  </div>
                  <span className={`admin-badge-status ${getStatusClass(quiz.status)}`}>{getStatusLabel(quiz.status)}</span>
                </div>
                
                <div className="admin-quiz-meta">
                  <div className="admin-quiz-meta-item"><BiTime size={14} /> {quiz.questionCount || 0} questions</div>
                  <div className="admin-quiz-meta-item">Code: <code className="quiz-list-code-tag">{quiz.quizCode || 'UNAVAILABLE'}</code></div>
                  <div className="admin-quiz-meta-item">Proctor: <code className="quiz-list-code-tag">{quiz.proctorPin || 'UNAVAILABLE'}</code></div>
                </div>
              </div>
              <div className="admin-quiz-footer">
                <div className="admin-quiz-actions">
                  {canEditQuiz(quiz.id, quiz.createdByUserId) && (
                    <button className="admin-btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/admin/quizzes/${quiz.id}/questions`); }} title="Questions">
                      <BiFile size={16} />
                    </button>
                  )}
                </div>
                <div className="admin-quiz-actions">
                  {quiz.status === 'DRAFT' && canEditQuiz(quiz.id, quiz.createdByUserId) && (
                    <button className="admin-btn-icon success" onClick={(e) => { e.stopPropagation(); handleStatusChange(quiz.id, 'ready'); }} title="Mark Ready">
                      <BiCheckCircle size={16} />
                    </button>
                  )}
                  {quiz.status === 'ACTIVE' && canEditQuiz(quiz.id, quiz.createdByUserId) && (
                    <button className="admin-btn-icon" onClick={(e) => { e.stopPropagation(); handleStatusChange(quiz.id, 'deactivate'); }} title="End Session">
                      <BiPause size={16} />
                    </button>
                  )}
                  {quiz.status === 'DRAFT' && canEditQuiz(quiz.id, quiz.createdByUserId) && (
                    <button className="admin-btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedQuiz(quiz); setFormData({ title: quiz.title, description: quiz.description || '', accessMode: quiz.accessMode || 'RESTRICTED', navigationMode: quiz.navigationMode || 'TOURNAMENT', globalTimeLimitSeconds: quiz.globalTimeLimitSeconds || 0, randomizeQuestions: !!quiz.randomizeQuestions }); setShowEditModal(true); }} title="Edit">
                      <BiEdit size={16} />
                    </button>
                  )}
                  {canEditQuiz(quiz.id, quiz.createdByUserId) && (
                    <button
                      className="admin-btn-icon danger"
                      onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(quiz); }}
                      title="Delete Quiz"
                      aria-label="Delete Quiz"
                      disabled={deleteQuiz.isPending}
                    >
                      <BiTrash size={16} />
                    </button>
                  )}
                  {!canViewQuiz(quiz.id, quiz.createdByUserId) && !canEditQuiz(quiz.id, quiz.createdByUserId) && (
                    <span className="quiz-list-view-only">
                      <BiLock size={14} /> View only
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="admin-card">
              <div className="admin-empty-state">
                <div className="admin-empty-icon"><BiBookOpen size={32} /></div>
                <h3 className="admin-empty-title">No quizzes yet</h3>
                <p className="admin-empty-text">
                  {searchQuery || statusFilter !== 'ALL' 
                    ? 'Try different filters' 
                    : 'Start creating your own quizzes to manage questions and run quiz workflows.'}
                </p>
                {!searchQuery && statusFilter === 'ALL' && (
                  <button
                    className="empty-cta"
                    onClick={() => { resetForm(); setShowCreateModal(true); }}
                    style={{ marginTop: 16 }}
                  >
                    + Create Your First Quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header quiz-list-modal-create-header">
              <h2 className="admin-modal-title">Create New Quiz</h2>
              <button onClick={() => setShowCreateModal(false)} className="admin-btn-icon quiz-list-modal-close"><BiX size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="quiz-list-modal-copy">
                <p className="quiz-list-modal-eyebrow">Quick setup</p>
                <p className="quiz-list-modal-description">
                  Start with the title and description. You can refine access, timing, and navigation in the quiz workspace after creation.
                </p>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Quiz Title *</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="admin-form-input" 
                  placeholder="Enter quiz title..."
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
                  placeholder="Enter quiz description..."
                  rows={4} 
                />
              </div>
              <p className="admin-form-hint" style={{ marginTop: 16 }}>
                Quiz settings (mode, access, timers) can be configured after creation in the quiz workspace.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="admin-btn admin-btn-primary" disabled={creatingQuiz}>
                {creatingQuiz ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedQuiz && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header quiz-list-modal-edit-header">
              <h2 className="admin-modal-title">Edit Quiz</h2>
              <button onClick={() => setShowEditModal(false)} className="admin-btn-icon quiz-list-modal-close"><BiX size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="quiz-list-modal-copy">
                <p className="quiz-list-modal-eyebrow">Quiz basics</p>
                <p className="quiz-list-modal-description">
                  Update the title and description here. Advanced quiz settings stay available in the quiz workspace.
                </p>
              </div>
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
              <div className="admin-form-group">
                <label className="admin-form-label">Quiz Access Mode</label>
                <select
                  value={formData.accessMode || 'RESTRICTED'}
                  onChange={(e) => setFormData({ ...formData, accessMode: e.target.value as 'PUBLIC' | 'RESTRICTED' })}
                  className="admin-form-input admin-form-select"
                >
                  <option value="RESTRICTED">Restricted Mode (registered teams only)</option>
                  <option value="PUBLIC">Public Mode (open entry)</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Navigation Mode</label>
                <select
                  value={formData.navigationMode || 'TOURNAMENT'}
                  onChange={(e) => {
                    const mode = e.target.value as 'TOURNAMENT' | 'CLASS';
                    setFormData({
                      ...formData,
                      navigationMode: mode,
                    });
                  }}
                  className="admin-form-input admin-form-select"
                >
                  <option value="TOURNAMENT">Tournament (host controls each question)</option>
                  <option value="CLASS">Class (participants can navigate)</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <input
                    type="checkbox"
                    checked={!!formData.randomizeQuestions}
                    onChange={(e) => setFormData({ ...formData, randomizeQuestions: e.target.checked })}
                    style={{ marginRight: 8 }}
                    disabled={formData.navigationMode !== 'CLASS'}
                  />
                  Randomize question order per participant (Class mode)
                </label>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Global Time Limit (seconds)</label>
                <p className="admin-form-hint">
                  {formData.navigationMode === 'CLASS' 
                    ? 'Total time allowed for all questions' 
                    : 'Set to enable participant-controlled navigation (0 = host controls with per-question timers)'}
                </p>
                <input
                  type="number"
                  min={0}
                  value={formData.globalTimeLimitSeconds ?? 0}
                  onChange={(e) => setFormData({ ...formData, globalTimeLimitSeconds: Number(e.target.value || 0) })}
                  className="admin-form-input"
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowEditModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={handleUpdate} className="admin-btn admin-btn-primary" disabled={updateQuiz.isPending}>
                {updateQuiz.isPending ? 'Updating...' : 'Update Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {quizPendingDelete && (
        <div className="admin-modal-overlay" onClick={() => setQuizPendingDelete(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ background: 'linear-gradient(135deg, #7a1733 0%, #9f2346 100%)' }}>
              <h2 className="admin-modal-title">Delete Quiz?</h2>
              <button onClick={() => setQuizPendingDelete(null)} className="admin-btn-icon quiz-list-modal-close"><BiX size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-empty-text" style={{ margin: 0 }}>
                Delete quiz "{quizPendingDelete.title}"? This removes quiz session data and questions from this quiz, but keeps Question Bank items.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setQuizPendingDelete(null)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={confirmDeleteQuiz} className="admin-btn admin-btn-danger" disabled={deleteQuiz.isPending}>
                {deleteQuiz.isPending ? 'Deleting...' : 'Delete Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
