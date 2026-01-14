import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiBookOpen,
  BiEdit,
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
  BiLock,
} from 'react-icons/bi';
import { useQuizzes, useUpdateQuiz, useQuizStatusChange } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import type { Quiz, CreateQuizRequest } from '../../services/api';
import '../../styles/admin.css';

export default function AdminQuizzesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [formData, setFormData] = useState<CreateQuizRequest>({ title: '', description: '' });
  const navigate = useNavigate();
  
  const { assignments, canEditQuiz, canManageTeams, canHostGame, canViewQuiz } = useAuth();
  
  // React Query hooks
  const { data: quizzes = [], isLoading, error } = useQuizzes();
  const updateQuiz = useUpdateQuiz();
  const statusChange = useQuizStatusChange();

  // Filter quizzes based on permissions and search/status
  const filteredQuizzes = useMemo(() => {
    let filtered = quizzes;
    
    // Admin users only see their assigned quizzes
    const assignedQuizIds = assignments.map(a => a.quizId);
    filtered = filtered.filter(q => assignedQuizIds.includes(q.id));
    
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
  }, [quizzes, searchQuery, statusFilter, assignments]);

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

  const resetForm = () => { setFormData({ title: '', description: '' }); };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = { DRAFT: 'draft', READY: 'ready', ACTIVE: 'active', ARCHIVED: 'archived' };
    return map[status] || 'draft';
  };

  if (isLoading) {
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
              <h1 className="admin-page-title">Assigned Quizzes</h1>
              <p className="admin-page-subtitle">Manage your assigned quizzes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <div className="admin-alert-content"><BiErrorCircle size={18} /><span>{error instanceof Error ? error.message : 'An error occurred'}</span></div>
          <button className="admin-btn-icon" style={{ width: 32, height: 32 }}><BiX size={18} /></button>
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
                  {canEditQuiz(quiz.id) && (
                    <button className="admin-btn-icon" onClick={() => navigate(`/admin/quizzes/${quiz.id}/questions`)} title="Questions">
                      <BiFile size={16} />
                    </button>
                  )}
                  {canManageTeams(quiz.id) && (
                    <button className="admin-btn-icon" onClick={() => navigate(`/admin/teams?quizId=${quiz.id}`)} title="Teams">
                      <BiGroup size={16} />
                    </button>
                  )}
                </div>
                <div className="admin-quiz-actions">
                  {quiz.status === 'DRAFT' && canEditQuiz(quiz.id) && (
                    <button className="admin-btn-icon success" onClick={() => handleStatusChange(quiz.id, 'ready')} title="Mark Ready">
                      <BiCheckCircle size={16} />
                    </button>
                  )}
                  {quiz.status === 'READY' && canHostGame(quiz.id) && (
                    <button className="admin-btn-icon success" onClick={() => handleStatusChange(quiz.id, 'activate')} title="Go Live">
                      <BiPlay size={16} />
                    </button>
                  )}
                  {quiz.status === 'ACTIVE' && canHostGame(quiz.id) && (
                    <button className="admin-btn-icon" onClick={() => handleStatusChange(quiz.id, 'deactivate')} title="Stop">
                      <BiPause size={16} />
                    </button>
                  )}
                  {canEditQuiz(quiz.id) && (
                    <button className="admin-btn-icon" onClick={() => { setSelectedQuiz(quiz); setFormData({ title: quiz.title, description: quiz.description || '' }); setShowEditModal(true); }} title="Edit">
                      <BiEdit size={16} />
                    </button>
                  )}
                  {!canViewQuiz(quiz.id) && !canEditQuiz(quiz.id) && !canManageTeams(quiz.id) && !canHostGame(quiz.id) && (
                    <span style={{ color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
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
                <h3 className="admin-empty-title">No quizzes found</h3>
                <p className="admin-empty-text">
                  {searchQuery || statusFilter !== 'ALL' 
                    ? 'Try different filters' 
                    : 'No quizzes have been assigned to you yet. Contact your super admin to get access.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>


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
              <button onClick={handleUpdate} className="admin-btn admin-btn-primary" disabled={updateQuiz.isPending}>
                {updateQuiz.isPending ? 'Updating...' : 'Update Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
