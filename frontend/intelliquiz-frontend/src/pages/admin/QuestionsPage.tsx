import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BiFile,
  BiPlus,
  BiEdit,
  BiTrash,
  BiArrowBack,
  BiX,
  BiErrorCircle,
  BiCheck,
  BiLock,
  BiTime,
  BiStar,
  BiImport,
  BiChevronLeft,
  BiChevronRight,
} from 'react-icons/bi';
import { questionBankApi, questionsApi, quizzesApi, type Question, type Quiz, type CreateQuestionRequest, type QuestionBankItem } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin.css';
import './AdminRedesign.css';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];
const QUESTION_TYPES: Array<{ value: CreateQuestionRequest['type']; label: string }> = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'IDENTIFICATION', label: 'Identification' },
];

const DEFAULT_TRUE_FALSE_OPTIONS = ['True', 'False'];

const normalizeIdentificationAnswers = (raw: string) =>
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line, index, arr) => line.length > 0 && arr.indexOf(line) === index)
    .join('\n');

const createBlankOptions = () => ['', '', '', ''];

const initialForm: CreateQuestionRequest = {
  text: '',
  type: 'MULTIPLE_CHOICE',
  difficulty: 'MEDIUM',
  correctKey: '',
  points: 10,
  timeLimit: 30,
  options: ['', '', '', ''],
  caseSensitive: false,
};

export default function AdminQuestionsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const quizIdNum = quizId ? parseInt(quizId) : 0;
  const { canEditQuiz, isSuperAdmin } = useAuth();
  const questionsPerPage = 5;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CreateQuestionRequest>(initialForm);
  const [bankLoading, setBankLoading] = useState(false);
  const [sortingQuestions, setSortingQuestions] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<QuestionBankItem[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<number[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const hasEditPermission = isSuperAdmin() || canEditQuiz(quizIdNum, quiz?.createdByUserId);
  const isDraftQuiz = quiz?.status === 'DRAFT';
  const canEditContent = hasEditPermission && isDraftQuiz;

  useEffect(() => {
    if (quizIdNum) loadData();
    setCurrentPage(1);
  }, [quizIdNum]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [quizData, questionsData] = await Promise.all([
        quizzesApi.getById(quizIdNum),
        questionsApi.getByQuiz(quizIdNum),
      ]);
      setQuiz(quizData);
      setQuestions(questionsData);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(questions.length / questionsPerPage));

  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * questionsPerPage;
    return questions.slice(startIndex, startIndex + questionsPerPage);
  }, [currentPage, questions]);

  const startQuestionIndex = questions.length === 0 ? 0 : (currentPage - 1) * questionsPerPage + 1;
  const endQuestionIndex = Math.min(currentPage * questionsPerPage, questions.length);

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, totalPages, currentPage]);
    if (currentPage - 1 > 1) pages.add(currentPage - 1);
    if (currentPage + 1 < totalPages) pages.add(currentPage + 1);

    return Array.from(pages).sort((left, right) => left - right);
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
  };

  const handleSave = async () => {
    setError(null);
    if (!hasEditPermission) return setError('You do not have permission to edit this quiz');
    if (!isDraftQuiz) return setError('Questions can only be edited while the quiz is in Draft status.');
    if (!formData.text.trim()) return setError('Question text is required');

    let payload: CreateQuestionRequest;
    if (formData.type === 'MULTIPLE_CHOICE') {
      if (!formData.correctKey) return setError('Please select the correct answer');
      const validOptions = formData.options.filter((o) => o.trim());
      if (validOptions.length < 2) return setError('At least two answer options are required');

      const correctIndex = OPTION_KEYS.indexOf(formData.correctKey);
      if (correctIndex >= validOptions.length) {
        return setError('The correct answer must be one of the filled options');
      }

      payload = {
        ...formData,
        options: validOptions,
      };
    } else if (formData.type === 'TRUE_FALSE') {
      if (formData.correctKey !== 'A' && formData.correctKey !== 'B') {
        return setError('Select whether True or False is the correct answer');
      }
      payload = {
        ...formData,
        options: DEFAULT_TRUE_FALSE_OPTIONS,
      };
    } else {
      const normalizedAnswers = normalizeIdentificationAnswers(formData.correctKey);
      if (!normalizedAnswers) {
        return setError('Please provide at least one accepted answer for identification');
      }
      payload = {
        ...formData,
        correctKey: normalizedAnswers,
        options: [],
      };
    }

    try {
      if (isEditing && selectedQuestion) {
        await questionsApi.update(selectedQuestion.id, payload);
      } else {
        await questionsApi.create(quizIdNum, payload);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    }
  };

  const handleDelete = async () => {
    if (!selectedQuestion) return;
    if (!canEditContent) {
      setError('Questions can only be deleted while the quiz is in Draft status.');
      return;
    }
    try {
      await questionsApi.delete(selectedQuestion.id);
      setShowDeleteModal(false);
      setSelectedQuestion(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  const openEditModal = (question: Question) => {
    if (!canEditContent) {
      setError('Questions can only be edited while the quiz is in Draft status.');
      return;
    }
    setSelectedQuestion(question);
    setIsEditing(true);
    const options = question.type === 'MULTIPLE_CHOICE'
      ? (question.options.length >= 4
        ? question.options
        : [...question.options, ...Array(4 - question.options.length).fill('')])
      : (question.type === 'TRUE_FALSE' ? DEFAULT_TRUE_FALSE_OPTIONS : createBlankOptions());

    const correctKey = question.type === 'IDENTIFICATION'
      ? (question.correctKey || '')
      : (question.type === 'TRUE_FALSE'
        ? (question.correctKey === 'B' ? 'B' : 'A')
        : question.correctKey);

    setFormData({
      text: question.text,
      type: question.type,
      difficulty: question.difficulty,
      correctKey,
      points: question.points,
      timeLimit: question.timeLimit,
      options,
      caseSensitive: question.caseSensitive ?? false,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setSelectedQuestion(null);
    setError(null);
  };

  const updateOption = (idx: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[idx] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleTypeChange = (type: CreateQuestionRequest['type']) => {
    if (type === 'MULTIPLE_CHOICE') {
      setFormData((prev) => ({ ...prev, type, correctKey: '', options: createBlankOptions() }));
      return;
    }
    if (type === 'TRUE_FALSE') {
      setFormData((prev) => ({ ...prev, type, correctKey: 'A', options: DEFAULT_TRUE_FALSE_OPTIONS }));
      return;
    }
    setFormData((prev) => ({ ...prev, type, correctKey: '', options: [] }));
  };

  const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

  const buildQuestionFingerprint = (item: Pick<Question, 'text' | 'type' | 'difficulty' | 'correctKey' | 'options'>) => {
    const normalizedOptions = item.options.map((option) => normalizeText(option)).join('|');
    return [
      normalizeText(item.text),
      item.type,
      item.difficulty,
      item.correctKey,
      normalizedOptions,
    ].join('::');
  };

  const quizQuestionFingerprints = new Set(questions.map((question) => buildQuestionFingerprint(question)));

  const loadQuestionBank = async () => {
    if (!canEditContent) {
      setError('Import from bank is only available while the quiz is in Draft status.');
      return;
    }
    setBankLoading(true);
    setError(null);
    try {
      const allBankItems = await questionBankApi.getAll();
      const eligible = allBankItems.filter((item) => !quizQuestionFingerprints.has(buildQuestionFingerprint(item)));
      setBankQuestions(eligible);
      setSelectedBankIds([]);
      setBankSearch('');
      setShowBankModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question bank');
    } finally {
      setBankLoading(false);
    }
  };

  const toggleBankSelection = (id: number) => {
    setSelectedBankIds((prev) => (
      prev.includes(id) ? prev.filter((bankId) => bankId !== id) : [...prev, id]
    ));
  };

  const filteredBankQuestions = bankQuestions.filter((item) => {
    const query = bankSearch.trim().toLowerCase();
    if (!query) return true;
    return item.text.toLowerCase().includes(query);
  });

  const visibleBankIds = filteredBankQuestions.map((item) => item.id);
  const selectedVisibleCount = visibleBankIds.filter((id) => selectedBankIds.includes(id)).length;
  const allVisibleSelected = visibleBankIds.length > 0 && selectedVisibleCount === visibleBankIds.length;

  const toggleSelectAllVisible = () => {
    if (visibleBankIds.length === 0) return;

    if (allVisibleSelected) {
      const visibleIdSet = new Set(visibleBankIds);
      setSelectedBankIds((prev) => prev.filter((id) => !visibleIdSet.has(id)));
      return;
    }

    setSelectedBankIds((prev) => Array.from(new Set([...prev, ...visibleBankIds])));
  };

  const handleImportFromBank = async () => {
    if (!hasEditPermission) {
      setError('You do not have permission to edit this quiz');
      return;
    }
    if (!isDraftQuiz) {
      setError('Import from bank is only available while the quiz is in Draft status.');
      return;
    }
    if (selectedBankIds.length === 0) {
      setError('Select at least one question to import');
      return;
    }

    try {
      setError(null);
      await questionBankApi.importToQuiz(quizIdNum, selectedBankIds);
      setShowBankModal(false);
      setSelectedBankIds([]);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import questions from bank');
    }
  };

  const handleSortByDifficulty = async () => {
    if (!hasEditPermission) {
      setError('You do not have permission to edit this quiz');
      return;
    }
    if (!isDraftQuiz) {
      setError('Sorting is only available while the quiz is in Draft status.');
      return;
    }
    if (questions.length <= 1) {
      return;
    }

    const difficultyRank: Record<Question['difficulty'], number> = {
      EASY: 0,
      MEDIUM: 1,
      HARD: 2,
      TIE_BREAKER: 3,
    };

    const sortedIds = [...questions]
      .sort((a, b) => {
        const rankDiff = difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
        if (rankDiff !== 0) return rankDiff;
        if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
        return a.id - b.id;
      })
      .map((q) => q.id);

    const currentIds = questions.map((q) => q.id);
    const unchanged = currentIds.length === sortedIds.length
      && currentIds.every((id, idx) => id === sortedIds[idx]);

    if (unchanged) {
      setError('Questions are already ordered by difficulty.');
      return;
    }

    try {
      setSortingQuestions(true);
      setError(null);
      await questionsApi.reorder(quizIdNum, sortedIds);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sort questions by difficulty');
    } finally {
      setSortingQuestions(false);
    }
  };

  const getDifficultyBadge = (d: string) => {
    const map: Record<string, string> = {
      EASY: 'admin-badge-success',
      MEDIUM: 'admin-badge-warning',
      HARD: 'admin-badge-primary',
      TIE_BREAKER: 'admin-badge-gray',
    };
    return map[d] || 'admin-badge-gray';
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">Loading questions...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header orange">
        <div className="admin-page-header-bg">
            <div className="admin-page-header-shape shape-1" />
            <div className="admin-page-header-shape shape-2" />
            <div className="admin-page-header-dots" />
        </div>
        <div className="admin-page-header-content">
          <div className="admin-page-header-left">
            <button className="admin-btn-icon" onClick={() => navigate(`/admin/quizzes/${quizIdNum}`)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}>
              <BiArrowBack size={18} />
            </button>
            <div>
              <h1 className="admin-page-title">Questions</h1>
              <p className="admin-page-subtitle">
                {quiz?.title || 'Quiz'} • {questions.length} questions
              </p>
            </div>
          </div>
          {!canEditContent && (
            <div className="questions-header-readonly">
              <BiLock size={13} /> Read only
            </div>
          )}
          {canEditContent && (
            <div className="questions-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="admin-btn admin-btn-secondary" onClick={handleSortByDifficulty} disabled={sortingQuestions || questions.length <= 1}>
                {sortingQuestions ? 'Sorting...' : 'Sort by Difficulty'}
              </button>
              <button className="admin-btn admin-btn-secondary" onClick={loadQuestionBank} disabled={bankLoading}>
                <BiImport size={18} /> {bankLoading ? 'Loading...' : 'Import from Bank'}
              </button>
              <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                <BiPlus size={18} /> Add Question
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && !showModal && (
        <div className="admin-alert admin-alert-error">
          <div className="admin-alert-content"><BiErrorCircle size={18} /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="admin-btn-icon" style={{ width: 32, height: 32 }}><BiX size={18} /></button>
        </div>
      )}

      {/* Questions List */}
      <div className="questions-list-container">
        {questions.length > 0 ? (
          paginatedQuestions.map((q, idx) => {
            const identificationAnswers = (q.correctKey || '')
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter((line) => line.length > 0);

            return (
              <div key={q.id} className="question-card">
                <div className="question-card-header">
                  <div className="question-number-badge">{startQuestionIndex + idx}</div>
                  <div className="question-text-wrapper">
                    <h4 className="question-text">{q.text}</h4>
                    <div className="question-meta">
                      <span className="question-meta-item">
                        <BiStar size={14} /> {q.points} pts
                      </span>
                      <span className="question-meta-item">
                        <BiTime size={14} /> {q.timeLimit}s
                      </span>
                      <span className={`admin-badge ${getDifficultyBadge(q.difficulty)}`}>{q.difficulty}</span>
                    </div>
                  </div>
                </div>

                      {q.type === 'IDENTIFICATION' ? (
                        <div className="question-options-wrapper">
                          <div className="identification-answer">
                            {identificationAnswers.length > 0
                              ? identificationAnswers.map((answer, answerIdx) => (
                                  <div key={answerIdx}>{answer}</div>
                                ))
                              : 'No accepted answer set'}
                          </div>
                        </div>
                      ) : (
                        <div className="question-options-wrapper">
                          <div className="question-options-grid">
                            {q.options.map((option, optIdx) => {
                              const key = OPTION_KEYS[optIdx] || String.fromCharCode(65 + optIdx);
                              const isCorrect = q.correctKey === key;
                              return (
                                <div key={optIdx} className={`question-option ${isCorrect ? 'is-correct' : ''}`}>
                                  <span className="question-option-key">{key}</span>
                                  <span>{option}</span>
                                  {isCorrect && <BiCheck size={16} />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {canEditContent && (
                        <div className="question-actions">
                          <button className="admin-btn admin-btn-secondary" onClick={() => openEditModal(q)} style={{ gap: 6 }}>
                            <BiEdit size={16} /> Edit
                          </button>
                          <button
                            className="admin-btn admin-btn-secondary"
                            onClick={() => {
                              setSelectedQuestion(q);
                              setShowDeleteModal(true);
                            }}
                            style={{ gap: 6, color: '#dc2626' }}
                          >
                            <BiTrash size={16} /> Delete
                          </button>
                        </div>
                      )}
              </div>
            );
          })
        ) : (
          <div className="admin-empty-state">
            <div className="admin-empty-icon"><BiFile size={32} /></div>
            <h3 className="admin-empty-title">No questions yet</h3>
            <p className="admin-empty-text">{canEditContent ? 'Add questions to make your quiz complete' : 'Questions are view-only until the quiz is set back to Draft status.'}</p>
            {canEditContent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="admin-btn admin-btn-secondary" onClick={loadQuestionBank} disabled={bankLoading}>
                  <BiImport size={16} /> {bankLoading ? 'Loading...' : 'Import from Bank'}
                </button>
                <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                  <BiPlus size={16} /> Add First Question
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {questions.length > questionsPerPage && (
        <div className="questions-pagination-shell">
          <p className="questions-pagination-summary">
            Showing <strong>{startQuestionIndex}</strong> to <strong>{endQuestionIndex}</strong> of <strong>{questions.length}</strong> questions
          </p>

          <div className="questions-pagination-controls">
            <button
              type="button"
              className="questions-pagination-nav"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <BiChevronLeft size={18} /> Previous
            </button>

            <div className="questions-pagination-pages">
              {paginationPages.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`questions-pagination-page ${page === currentPage ? 'is-active' : ''}`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="questions-pagination-nav"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next <BiChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ background: 'linear-gradient(135deg, #fa709a, #fee140)' }}>
              <h2 className="admin-modal-title">{isEditing ? 'Edit' : 'Add'} Question</h2>
              <button onClick={() => setShowModal(false)} className="admin-btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}><BiX size={18} /></button>
            </div>
            <div className="admin-modal-body">
              {error && (
                <div className="admin-alert admin-alert-error" style={{ marginBottom: 16 }}>
                  <div className="admin-alert-content"><BiErrorCircle size={16} /><span>{error}</span></div>
                  <button onClick={() => setError(null)} className="admin-btn-icon" style={{ width: 28, height: 28 }}><BiX size={16} /></button>
                </div>
              )}
              <div className="admin-form-group">
                <label className="admin-form-label">Question Text *</label>
                <textarea value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="admin-form-input admin-form-textarea" placeholder="Enter the question" rows={3} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value as CreateQuestionRequest['type'])}
                    className="admin-form-input admin-form-select"
                  >
                    {QUESTION_TYPES.map((typeOption) => (
                      <option key={typeOption.value} value={typeOption.value}>{typeOption.label}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Difficulty *</label>
                  <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' | 'TIE_BREAKER' })}
                    className="admin-form-input admin-form-select">
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                    <option value="TIE_BREAKER">Tie Breaker</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Points *</label>
                  <input type="number" value={formData.points} onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    className="admin-form-input" min={0} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Time (sec) *</label>
                  <input type="number" value={formData.timeLimit} onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 0 })}
                    className="admin-form-input" min={0} />
                </div>
              </div>

              {formData.type === 'MULTIPLE_CHOICE' && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Answer Options * (click letter to mark correct)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {formData.options.map((option, idx) => {
                      const key = OPTION_KEYS[idx];
                      const isCorrect = formData.correctKey === key;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, correctKey: key })}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              border: `2px solid ${isCorrect ? '#16a34a' : '#e2e8f0'}`,
                              background: isCorrect ? '#16a34a' : 'transparent',
                              color: isCorrect ? 'white' : '#64748b',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {isCorrect ? <BiCheck size={20} /> : key}
                          </button>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(idx, e.target.value)}
                            className="admin-form-input"
                            style={{ flex: 1 }}
                            placeholder={`Option ${key}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                    Click the letter button to mark the correct answer
                  </p>
                </div>
              )}

              {formData.type === 'TRUE_FALSE' && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Correct Answer *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {DEFAULT_TRUE_FALSE_OPTIONS.map((option, idx) => {
                      const key = idx === 0 ? 'A' : 'B';
                      const isCorrect = formData.correctKey === key;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFormData({ ...formData, correctKey: key })}
                          className="admin-form-input"
                          style={{
                            minHeight: 44,
                            border: `2px solid ${isCorrect ? '#16a34a' : '#e2e8f0'}`,
                            background: isCorrect ? '#f0fdf4' : '#ffffff',
                            color: isCorrect ? '#15803d' : '#334155',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {isCorrect ? <><BiCheck size={16} /> {option}</> : option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.type === 'IDENTIFICATION' && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Accepted Answers * (one per line)</label>
                  <textarea
                    value={formData.correctKey}
                    onChange={(e) => setFormData({ ...formData, correctKey: e.target.value })}
                    className="admin-form-input admin-form-textarea"
                    rows={4}
                    placeholder={'Example:\nParis\nCity of Paris'}
                  />
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                    {formData.caseSensitive
                      ? 'Matching is case-sensitive and exact.'
                      : 'Matching is case-insensitive and ignores extra spaces.'}
                  </p>
                  
                  {/* Case Sensitivity Toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 12,
                    padding: '10px 12px',
                    borderRadius: 6,
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                  }}>
                    <input
                      type="checkbox"
                      id="caseSensitiveToggle"
                      checked={formData.caseSensitive ?? false}
                      onChange={(e) => setFormData({ ...formData, caseSensitive: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    <label
                      htmlFor="caseSensitiveToggle"
                      style={{
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#334155',
                        margin: 0,
                      }}
                    >
                      Case-Sensitive Matching
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={handleSave} className="admin-btn admin-btn-primary">{isEditing ? 'Update' : 'Add'} Question</button>
            </div>
          </div>
        </div>
      )}

      {/* Import From Bank Modal */}
      {showBankModal && (
        <div className="admin-modal-overlay" onClick={() => setShowBankModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ background: 'linear-gradient(135deg, #5f1027, #9f2346)' }}>
              <h2 className="admin-modal-title">Import Questions from Bank</h2>
              <button onClick={() => setShowBankModal(false)} className="admin-btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}><BiX size={18} /></button>
            </div>
            <div className="admin-modal-body">
              {bankQuestions.length === 0 ? (
                <p className="admin-empty-text">No new question-bank items are available. All matching items are already in this quiz.</p>
              ) : (
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#fff7ed',
                    border: '1px solid #fed7aa',
                    marginBottom: 12,
                  }}>
                    <p className="admin-empty-text" style={{ margin: 0, color: '#7c2d12', fontWeight: 600 }}>
                      {filteredBankQuestions.length} available • {selectedBankIds.length} selected
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedBankIds([])}
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      disabled={selectedBankIds.length === 0}
                    >
                      Clear Selection
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="admin-form-input"
                      style={{ flex: 1, minWidth: 220 }}
                      placeholder="Search bank questions..."
                    />
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      cursor: visibleBankIds.length > 0 ? 'pointer' : 'not-allowed',
                      color: '#1e293b',
                      fontSize: 13,
                      fontWeight: 600,
                      opacity: visibleBankIds.length > 0 ? 1 : 0.6,
                    }}>
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        disabled={visibleBankIds.length === 0}
                      />
                      Select All Visible
                    </label>
                  </div>

                  {filteredBankQuestions.length === 0 && (
                    <p className="admin-empty-text" style={{ marginTop: 6 }}>No questions match your search.</p>
                  )}

                  <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                    {filteredBankQuestions.map((item) => {
                      const selected = selectedBankIds.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '12px 14px',
                            borderRadius: 8,
                            border: `1px solid ${selected ? '#d4a017' : '#e2e8f0'}`,
                            background: selected ? '#fff7ed' : '#ffffff',
                            cursor: 'pointer',
                            boxShadow: selected ? '0 6px 14px rgba(212,160,23,0.22)' : 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleBankSelection(item.id)}
                            style={{ marginTop: 2, accentColor: '#9f2346' }}
                          />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, color: '#1e293b', fontWeight: 600, fontSize: 14 }}>{item.text}</p>
                            <p className="admin-empty-text" style={{ margin: '4px 0 0' }}>
                              {item.difficulty} • {item.points} pts • {item.timeLimit}s
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowBankModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button
                onClick={handleImportFromBank}
                className="admin-btn admin-btn-primary"
                disabled={selectedBankIds.length === 0 || !canEditContent}
              >
                Import Selected ({selectedBankIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedQuestion && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              <h2 className="admin-modal-title">Delete Question</h2>
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
                <p style={{ color: '#64748b', fontSize: 14 }}>Are you sure you want to delete this question?</p>
                <p style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8, color: '#1e293b', fontWeight: 500, fontSize: 13 }}>
                  "{selectedQuestion.text}"
                </p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="admin-btn admin-btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
