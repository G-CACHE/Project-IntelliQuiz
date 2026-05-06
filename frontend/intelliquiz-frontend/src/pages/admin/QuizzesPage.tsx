import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { useActiveQuiz } from '../../hooks';
import { useNavigate } from 'react-router-dom';
import {
  BiBookOpen,
  BiEdit,
  BiCheckCircle,
  BiPlayCircle,
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
  const quizzesPerPage = 6;
  const guideVisibilityStorageKey = 'intelliquiz.admin.quizzes.walkthrough.visible';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isGuideExpanded, setIsGuideExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(guideVisibilityStorageKey) !== '0';
  });
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
  const queryClient = useQueryClient();
  const { data: quizzes = [], isLoading, error } = useQuizzes();
  const activeQuizQuery = useActiveQuiz();
  const createQuiz = useCreateQuiz();
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
        // Only upgrade to ACTIVE if this quiz matches the active one
        if (active && q.id === active.id) {
          return { ...q, status: 'ACTIVE', isLiveSession: true };
        }
        // Don't downgrade - trust server state for other quizzes
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

  const editableQuizzes = useMemo(
    () => quizzes.filter((quiz) => canEditQuiz(quiz.id, quiz.createdByUserId)),
    [quizzes, canEditQuiz]
  );

  const firstQuizNeedingQuestions = useMemo(
    () => editableQuizzes.find((quiz) => (quiz.questionCount || 0) === 0) || null,
    [editableQuizzes]
  );

  const firstDraftQuiz = useMemo(
    () => editableQuizzes.find((quiz) => quiz.status === 'DRAFT') || null,
    [editableQuizzes]
  );

  const firstReadyQuiz = useMemo(
    () => editableQuizzes.find((quiz) => quiz.status === 'READY') || null,
    [editableQuizzes]
  );

  const editableNonArchivedQuizzes = useMemo(
    () => editableQuizzes.filter((quiz) => quiz.status !== 'ARCHIVED'),
    [editableQuizzes]
  );

  const allEditableQuizzesArchived = editableQuizzes.length > 0 && editableQuizzes.every((quiz) => quiz.status === 'ARCHIVED');

  const walkthroughSteps = useMemo(
    () => [
      {
        id: 'create',
        label: 'Create a quiz',
        hint: 'Start by creating your first quiz shell.',
        done: quizStats.total > 0,
        actionLabel: quizStats.total > 0 ? 'Create another' : 'Create now',
        onAction: () => {
          resetForm();
          setShowCreateModal(true);
        },
      },
      {
        id: 'questions',
        label: 'Add question content',
        hint: 'Populate your quiz so teams can answer meaningful rounds.',
        done: editableQuizzes.some((quiz) => (quiz.questionCount || 0) > 0),
        actionLabel: firstQuizNeedingQuestions ? 'Add questions' : 'Open question sets',
        onAction: () => {
          if (firstQuizNeedingQuestions) {
            navigate(`/admin/quizzes/${firstQuizNeedingQuestions.id}/questions`);
            return;
          }
          if (editableQuizzes[0]) {
            navigate(`/admin/quizzes/${editableQuizzes[0].id}/questions`);
          }
        },
      },
      {
        id: 'ready',
        label: 'Mark quiz as ready',
        hint: 'Move draft quizzes into ready state before launch.',
        done: quizStats.ready > 0 || quizStats.active > 0,
        actionLabel: firstDraftQuiz ? 'Mark next draft ready' : 'Review drafts',
        onAction: () => {
          if (firstDraftQuiz) {
            void statusChange.mutateAsync({ id: firstDraftQuiz.id, action: 'ready' }).catch((err) => {
              console.error('Failed to ready quiz:', err);
            });
            return;
          }
          if (editableQuizzes[0]) {
            navigate(`/admin/quizzes/${editableQuizzes[0].id}`);
          }
        },
      },
      {
        id: 'launch',
        label: 'Launch live session',
        hint: 'Activate a ready quiz when your teams are set.',
        done: quizStats.active > 0,
        actionLabel: firstReadyQuiz ? 'Launch ready quiz' : 'Go to workspace',
        onAction: () => {
          if (firstReadyQuiz) {
            void statusChange.mutateAsync({ id: firstReadyQuiz.id, action: 'activate' }).catch((err) => {
              console.error('Failed to launch quiz:', err);
            });
            return;
          }
          if (editableQuizzes[0]) {
            navigate(`/admin/quizzes/${editableQuizzes[0].id}`);
          }
        },
      },
    ],
    [
      quizStats,
      editableQuizzes,
      firstQuizNeedingQuestions,
      firstDraftQuiz,
      firstReadyQuiz,
      navigate,
      statusChange,
    ]
  );

  const recommendedQuiz = firstQuizNeedingQuestions || firstDraftQuiz || firstReadyQuiz || editableNonArchivedQuizzes[0] || null;

  const toggleGuideVisibility = () => {
    setIsGuideExpanded((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(guideVisibilityStorageKey, next ? '1' : '0');
      }
      return next;
    });
  };

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

  const getStatusLabel = (status: string) => {
    if (status === 'ARCHIVED') return 'DONE';
    if (status === 'ACTIVE') return 'LIVE NOW';
    return status;
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


      <section className="quiz-list-journey admin-card" aria-label="Admin walkthrough">
        <div className="quiz-list-journey-head">
          <div>
            <p className="quiz-list-journey-eyebrow">Admin walkthrough</p>
            <h2 className="quiz-list-journey-title">Do this next</h2>
            <p className="quiz-list-journey-copy">
              Follow this guided flow to build, prepare, and launch without missing steps.
            </p>
          </div>
        </div>

        <div className="quiz-list-guide-controls">
          <button
            type="button"
            className="admin-btn quiz-list-guide-trigger"
            onClick={toggleGuideVisibility}
            aria-expanded={isGuideExpanded}
            aria-controls="admin-walkthrough-steps"
          >
            {isGuideExpanded ? 'Hide walkthrough' : 'Show walkthrough'}
          </button>
        </div>

        {isGuideExpanded && (
          <>
            <div id="admin-walkthrough-steps" className={`quiz-list-journey-grid ${allEditableQuizzesArchived ? 'is-disabled' : ''}`}>
              {walkthroughSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`quiz-list-journey-step ${step.done ? 'is-complete' : 'is-pending'} ${allEditableQuizzesArchived ? 'is-disabled' : ''}`}
                  onClick={allEditableQuizzesArchived ? undefined : step.onAction}
                  onKeyDown={(event) => {
                    if (allEditableQuizzesArchived) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      step.onAction();
                    }
                  }}
                  role="button"
                  tabIndex={allEditableQuizzesArchived ? -1 : 0}
                  aria-label={`${step.label}. ${step.actionLabel}`}
                >
                  <div className="quiz-list-journey-step-top">
                    <span className="quiz-list-journey-step-index">Step {index + 1}</span>
                  </div>
                  <h3 className="quiz-list-journey-step-title">{step.label}</h3>
                  <p className="quiz-list-journey-step-copy">{step.hint}</p>
                  <button
                    type="button"
                    className="admin-btn quiz-list-journey-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!allEditableQuizzesArchived) {
                        step.onAction();
                      }
                    }}
                    disabled={allEditableQuizzesArchived}
                  >
                    {step.id === 'launch' ? <BiPlayCircle size={16} /> : <BiCheckCircle size={16} />}
                    {step.actionLabel}
                  </button>
                </div>
              ))}
            </div>

            {recommendedQuiz && (
              <div className="quiz-list-journey-callout">
                <p>
                  Recommended quiz: <strong>{recommendedQuiz.title}</strong>
                </p>
                <button
                  type="button"
                  className="admin-btn quiz-list-journey-callout-btn"
                  onClick={() => navigate(`/admin/quizzes/${recommendedQuiz.id}`)}
                >
                  Open workspace
                </button>
              </div>
            )}
          </>
        )}
      </section>

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
            <option value="ACTIVE">Live</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="admin-quiz-grid">
        {filteredQuizzes.length > 0 ? (
          paginatedQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={`admin-quiz-card quiz-list-card status-${getStatusClass(quiz.status)}`}
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
