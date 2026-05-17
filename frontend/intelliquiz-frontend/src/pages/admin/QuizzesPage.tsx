import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import CustomSelect from '../../components/common/CustomSelect';
import { useActiveQuiz } from '../../hooks';
import { useNavigate } from 'react-router-dom';
import {
  BiBookOpen,
  BiEdit,
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
import CreateQuizModal from '../../components/admin/CreateQuizModal';
import '../../styles/admin.css';
import './QuizzesPage.css';

export default function AdminQuizzesPage() {
  const quizzesPerPage = 6;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
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
  const [quizPendingDelete, setQuizPendingDelete] = useState<Quiz | null>(null);
  const navigate = useNavigate();

  const { canEditQuiz, canViewQuiz } = useAuth();

  // React Query hooks
  const queryClient = useQueryClient();
  const { data: quizzes = [], isLoading, error } = useQuizzes();
  const activeQuizQuery = useActiveQuiz();
  const updateQuiz = useUpdateQuiz();
  const deleteQuiz = useDeleteQuiz();
  const statusChange = useQuizStatusChange();

  // Keep quizzes cache in sync with active quiz runtime state (reflect live sessions started outside this page)
  useEffect(() => {
    if (!activeQuizQuery.isSuccess) return;

    const active = activeQuizQuery.data;
    queryClient.setQueryData(queryKeys.quizzes, (old: any) => {
      if (!old || !Array.isArray(old)) return old;
      return old.map((q: any) => {
        if (active && q.id === active.id) {
          return { ...q, status: 'ACTIVE', isLiveSession: true };
        }
        return q;
      });
    });
  }, [activeQuizQuery.data, activeQuizQuery.isSuccess, queryClient]);

  // Filter quizzes based on search/status (backend already filters by createdByUserId)
  const filteredQuizzes = useMemo(() => {
    let filtered = [...quizzes];
    
    if (searchQuery) {
      filtered = filtered.filter((q) =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((q) => q.status === statusFilter);
    }

    filtered.sort((a, b) => b.id - a.id);

    return filtered;
  }, [quizzes, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / quizzesPerPage));

  const paginatedQuizzes = useMemo(() => {
    const start = (currentPage - 1) * quizzesPerPage;
    return filteredQuizzes.slice(start, start + quizzesPerPage);
  }, [filteredQuizzes, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

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

  const getStatusClass = (quiz: Quiz) => {
    const map: Record<string, string> = { DRAFT: 'draft', READY: 'ready', ACTIVE: 'live', ARCHIVED: 'archived' };
    return map[quiz.status] || 'draft';
  };

  const getStatusLabel = (quiz: Quiz) => {
    if (quiz.status === 'ARCHIVED') return 'DONE';
    return quiz.status;
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
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            compact
            options={[
              { value: 'ALL', label: 'All Status' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'READY', label: 'Ready' },
              { value: 'ACTIVE', label: 'Live' },
              { value: 'ARCHIVED', label: 'Archived' },
            ]}
          />
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="admin-quiz-grid">
        {filteredQuizzes.length > 0 ? (
          paginatedQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={`admin-quiz-card quiz-list-card status-${getStatusClass(quiz)}`}
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
              <div className={`admin-quiz-card-top ${getStatusClass(quiz)}`} />
              <div className="admin-quiz-card-body">
                <div className="admin-quiz-header">
                  <div style={{ flex: 1 }}>
                    <h3 className="admin-quiz-title">{quiz.title}</h3>
                    <p className="admin-quiz-desc">{quiz.description || 'No description'}</p>
                  </div>
                  <span className={`admin-badge-status ${getStatusClass(quiz)}`}>{getStatusLabel(quiz)}</span>
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
                  {(quiz.status === 'DRAFT' || quiz.status === 'READY') && canEditQuiz(quiz.id, quiz.createdByUserId) && (
                    <button className="admin-btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedQuiz(quiz); setFormData({ title: quiz.title, description: quiz.description || '', accessMode: quiz.accessMode || 'RESTRICTED', navigationMode: quiz.navigationMode || 'TOURNAMENT', globalTimeLimitSeconds: quiz.globalTimeLimitSeconds || 0, randomizeQuestions: !!quiz.randomizeQuestions }); setShowEditModal(true); }} title="Edit">
                      <BiEdit size={16} />
                    </button>
                  )}
                  {quiz.status !== 'ACTIVE' && canEditQuiz(quiz.id, quiz.createdByUserId) && (
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
                    onClick={() => setShowCreateModal(true)}
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

      {filteredQuizzes.length > quizzesPerPage && (
        <div className="quiz-list-pagination" aria-label="Quiz pagination">
          <button
            type="button"
            className="admin-btn quiz-list-page-btn"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="quiz-list-page-indicator">Page {currentPage} of {totalPages}</span>
          <button
            type="button"
            className="admin-btn quiz-list-page-btn"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}


      {/* Create Quiz Modal */}
      {showCreateModal && <CreateQuizModal onClose={() => setShowCreateModal(false)} />}

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
                <CustomSelect
                  value={formData.accessMode || 'RESTRICTED'}
                  onChange={(v) => setFormData({ ...formData, accessMode: v as 'PUBLIC' | 'RESTRICTED' })}
                  options={[
                    { value: 'RESTRICTED', label: 'Restricted Mode (registered teams only)' },
                    { value: 'PUBLIC', label: 'Public Mode (open entry)' },
                  ]}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Navigation Mode</label>
                <CustomSelect
                  value={formData.navigationMode || 'TOURNAMENT'}
                  onChange={(v) => {
                    const mode = v as 'TOURNAMENT' | 'CLASS';
                    setFormData({ ...formData, navigationMode: mode });
                  }}
                  options={[
                    { value: 'TOURNAMENT', label: 'Tournament (host controls each question)' },
                    { value: 'CLASS', label: 'Class (participants can navigate)' },
                  ]}
                />
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
