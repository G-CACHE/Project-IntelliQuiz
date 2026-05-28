import { useState, useEffect } from 'react';
import CustomSelect from '../../components/common/CustomSelect';
import { useParams } from 'react-router-dom';
import {
  BiFile,
  BiPlus,
  BiEdit,
  BiTrash,
  BiX,
  BiErrorCircle,
  BiCheck,
  BiLock,
  BiTime,
  BiStar,
  BiImport,
  BiSearch,
  BiChevronDown,
} from 'react-icons/bi';
import { questionBankApi, questionsApi, quizzesApi, type Question, type Quiz, type CreateQuestionRequest, type QuestionBankItem } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin.css';
import './AdminRedesign.css';
import './QuestionsPage.css';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
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

const createBlankOptions = () => ['', ''];

const initialForm: CreateQuestionRequest = {
  text: '',
  type: 'MULTIPLE_CHOICE',
  difficulty: 'MEDIUM',
  correctKey: '',
  points: 10,
  timeLimit: 30,
  options: ['', ''],
  caseSensitive: false,
};

export default function AdminQuestionsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const quizIdNum = quizId ? parseInt(quizId) : 0;
  const { canEditQuiz, isSuperAdmin } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CreateQuestionRequest>(initialForm);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<QuestionBankItem[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<number[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [bankQuizFilter, setBankQuizFilter] = useState<string>('');
  const [bankVisibleCount, setBankVisibleCount] = useState(10);
  const [bankTotalCount, setBankTotalCount] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  
  const hasEditPermission = isSuperAdmin() || canEditQuiz(quizIdNum, quiz?.createdByUserId);
  const isDraftQuiz = quiz?.status === 'DRAFT';
  const canEditContent = hasEditPermission && isDraftQuiz;

  useEffect(() => {
    if (quizIdNum) loadData();
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
      setActiveQuestionId((prev) => prev ?? (questionsData[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
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
      if (formData.correctKey !== 'True' && formData.correctKey !== 'False') {
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
      ? (question.options.length >= 2 ? question.options : [...question.options, ...Array(2 - question.options.length).fill('')])
      : (question.type === 'TRUE_FALSE' ? DEFAULT_TRUE_FALSE_OPTIONS : createBlankOptions());

    const correctKey = question.type === 'IDENTIFICATION'
      ? (question.correctKey || '')
      : (question.type === 'TRUE_FALSE'
        // Support legacy 'A'/'B' keys from old data, map to text
        ? (question.correctKey === 'B' ? 'False' : question.correctKey === 'A' ? 'True' : (question.correctKey || 'True'))
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
    setModalStep(1);
  };

  const resetForm = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setSelectedQuestion(null);
    setError(null);
    setModalStep(1);
  };

  const updateOption = (idx: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[idx] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    if (formData.options.length >= 8) return;
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeOption = (idx: number) => {
    if (formData.options.length <= 2) return;
    const newOptions = formData.options.filter((_, i) => i !== idx);
    const removedKey = OPTION_KEYS[idx];
    // If the removed option was the correct answer, clear the selection
    const newCorrectKey = formData.correctKey === removedKey ? '' : formData.correctKey;
    setFormData({ ...formData, options: newOptions, correctKey: newCorrectKey });
  };

  const handleTypeChange = (type: CreateQuestionRequest['type']) => {
    if (type === 'MULTIPLE_CHOICE') {
      setFormData((prev) => ({ ...prev, type, correctKey: '', options: createBlankOptions() }));
      return;
    }
    if (type === 'TRUE_FALSE') {
      setFormData((prev) => ({ ...prev, type, correctKey: 'True', options: DEFAULT_TRUE_FALSE_OPTIONS }));
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
      setBankTotalCount(allBankItems.length);
      setSelectedBankIds([]);
      setBankSearch('');
      setBankQuizFilter('');
      setBankVisibleCount(10);
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

  // Derive a display label for each bank item's source quiz
  const getBankItemQuizLabel = (item: QuestionBankItem): string => {
    if (item.sourceQuizTitle) return item.sourceQuizTitle;
    if (item.category) return item.category;
    if (item.sourceQuizId != null) return `Quiz #${item.sourceQuizId}`;
    return 'Unknown';
  };

  const filteredBankQuestions = bankQuestions.filter((item) => {
    const query = bankSearch.trim().toLowerCase();
    if (bankQuizFilter && getBankItemQuizLabel(item) !== bankQuizFilter) return false;
    if (!query) return true;
    return item.text.toLowerCase().includes(query);
  });

  // Unique source quiz labels present in the bank for the filter dropdown
  const bankSourceQuizzes = Array.from(
    new Set(bankQuestions.map(getBankItemQuizLabel))
  ).filter((label) => label !== 'Unknown');

  const visibleBankIds = filteredBankQuestions.slice(0, bankVisibleCount).map((item) => item.id);
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

  const getDifficultyBadge = (d: string) => {
    const map: Record<string, string> = {
      EASY: 'admin-badge-success',
      MEDIUM: 'admin-badge-warning',
      HARD: 'admin-badge-primary',
      TIE_BREAKER: 'admin-badge-gray',
    };
    return map[d] || 'admin-badge-gray';
  };

  const DIFF_DOT: Record<string, string> = {
    EASY: '#16a34a',
    MEDIUM: '#d97706',
    HARD: '#dc2626',
    TIE_BREAKER: '#7c3aed',
  };

  const filteredSidebarQuestions = difficultyFilter === 'ALL'
    ? questions
    : questions.filter((q) => q.difficulty === difficultyFilter);

  const difficultyCounts: Record<string, number> = { ALL: questions.length };
  questions.forEach((q) => {
    difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] ?? 0) + 1;
  });

  const DIFF_CHIPS = [
    { key: 'ALL', label: 'All' },
    { key: 'EASY', label: 'Easy' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'HARD', label: 'Hard' },
    { key: 'TIE_BREAKER', label: 'Tie Breaker' },
  ].filter((c) => c.key === 'ALL' || difficultyCounts[c.key]);

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
      {/* Action bar */}
      <div className="qp-action-bar">
        {/* Segmented difficulty filter — always visible */}
        {questions.length > 0 && (
          <div className="qp-diff-chips">
            {DIFF_CHIPS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={`qp-diff-chip${difficultyFilter === chip.key ? ' active' : ''}`}
                onClick={() => setDifficultyFilter(chip.key)}
              >
                {chip.key !== 'ALL' && (
                  <span className="qp-diff-chip-dot" style={{ background: DIFF_DOT[chip.key] }} />
                )}
                {chip.label}
                <span className="qp-diff-chip-count">{difficultyCounts[chip.key] ?? 0}</span>
              </button>
            ))}
          </div>
        )}

        {!canEditContent && (
          <div className="questions-header-readonly">
            <BiLock size={13} /> Read only
          </div>
        )}
        {canEditContent && (
          <div className="questions-header-actions">
            <button className="admin-btn admin-btn-secondary" onClick={loadQuestionBank} disabled={bankLoading}>
              <BiImport size={18} /> {bankLoading ? 'Loading...' : 'Import from Bank'}
            </button>
            <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
              <BiPlus size={18} /> Add Question
            </button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && !showModal && (
        <div className="admin-alert admin-alert-error">
          <div className="admin-alert-content"><BiErrorCircle size={18} /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="admin-btn-icon" style={{ width: 32, height: 32 }}><BiX size={18} /></button>
        </div>
      )}

      {/* Split-panel workspace */}
      <div className="qp-workspace">

        {/* ── LEFT SIDEBAR: Question list ── */}
        <aside className="qp-sidebar">
          <div className="qp-sidebar-header">
            <span className="qp-sidebar-count">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="qp-sidebar-list">
            {questions.length === 0 ? (
              <div className="qp-sidebar-empty">
                <BiFile size={24} />
                <p>No questions yet</p>
              </div>
            ) : filteredSidebarQuestions.length === 0 ? (
              <div className="qp-sidebar-empty">
                <p>No {difficultyFilter.toLowerCase()} questions</p>
              </div>
            ) : (
              filteredSidebarQuestions.map((q) => {
                const isActive = q.id === activeQuestionId;
                const globalIdx = questions.findIndex((gq) => gq.id === q.id);
                return (
                  <button
                    key={q.id}
                    type="button"
                    className={`qp-sidebar-item${isActive ? ' is-active' : ''}`}
                    onClick={() => setActiveQuestionId(q.id)}
                    title={q.text}
                  >
                    <span
                      className="qp-sidebar-diff-dot"
                      style={{ background: DIFF_DOT[q.difficulty] ?? '#94a3b8' }}
                      title={q.difficulty}
                    />
                    <span className="qp-sidebar-item-num">Q{globalIdx + 1}</span>
                    <span className="qp-sidebar-item-text">{q.text}</span>
                    <span className="qp-sidebar-item-pts">{q.points}pt</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── RIGHT DETAIL: Active question view ── */}
        <main className="qp-detail">
          {(() => {
            const activeQ = questions.find((q) => q.id === activeQuestionId);
            if (!activeQ) {
              return (
                <div className="qp-detail-empty">
                  <BiFile size={40} />
                  <p>{questions.length === 0 ? 'Add your first question to get started.' : 'Select a question from the list.'}</p>
                  {canEditContent && questions.length === 0 && (
                    <div className="questions-empty-actions" style={{ marginTop: 16 }}>
                      <button className="admin-btn admin-btn-secondary" onClick={loadQuestionBank} disabled={bankLoading}>
                        <BiImport size={16} /> Import from Bank
                      </button>
                      <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        <BiPlus size={16} /> Add First Question
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            const identificationAnswers = (activeQ.correctKey || '')
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter((line) => line.length > 0);

            const qIdx = questions.findIndex((q) => q.id === activeQ.id);

            return (
              <div className="qp-detail-card">
                {/* Detail header */}
                <div className="qp-detail-header">
                  <div className="qp-detail-header-left">
                    <span className="qp-detail-qnum">Question {qIdx + 1}</span>
                    <span className={`admin-badge ${getDifficultyBadge(activeQ.difficulty)}`}>{activeQ.difficulty}</span>
                    <span className="qp-detail-type-badge">{activeQ.type.replace('_', ' ')}</span>
                  </div>
                  <div className="qp-detail-header-right">
                    <span className="qp-detail-meta"><BiStar size={13} /> {activeQ.points} pts</span>
                    <span className="qp-detail-meta"><BiTime size={13} /> {activeQ.timeLimit}s</span>
                    {canEditContent && (
                      <>
                        <button className="admin-btn admin-btn-secondary qp-detail-action-btn" onClick={() => openEditModal(activeQ)}>
                          <BiEdit size={14} /> Edit
                        </button>
                        <button
                          className="admin-btn admin-btn-secondary qp-detail-action-btn"
                          style={{ color: '#dc2626' }}
                          onClick={() => { setSelectedQuestion(activeQ); setShowDeleteModal(true); }}
                        >
                          <BiTrash size={14} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Question text */}
                <div className="qp-detail-question-text">
                  {activeQ.text}
                </div>

                {/* Answers */}
                <div className="qp-detail-answers">
                  <div className="qp-detail-answers-label">
                    Answer{activeQ.type === 'IDENTIFICATION' ? 's' : ' Options'}
                    <button
                      type="button"
                      className="question-toggle-btn"
                      onClick={() => setExpandedIds((prev) => {
                        const next = new Set(prev);
                        next.has(activeQ.id) ? next.delete(activeQ.id) : next.add(activeQ.id);
                        return next;
                      })}
                    >
                      {expandedIds.has(activeQ.id) ? 'Hide' : 'Reveal'}
                      <BiChevronDown size={13} className={expandedIds.has(activeQ.id) ? 'rotated' : ''} />
                    </button>
                  </div>

                  {expandedIds.has(activeQ.id) && (
                    activeQ.type === 'IDENTIFICATION' ? (
                      <div className="identification-answer">
                        {identificationAnswers.length > 0
                          ? identificationAnswers.map((a, i) => <div key={i}>{a}</div>)
                          : 'No accepted answer set'}
                      </div>
                    ) : (
                      <div className="question-options-grid">
                        {activeQ.options.map((option, optIdx) => {
                          const key = OPTION_KEYS[optIdx] || String.fromCharCode(65 + optIdx);
                          const isCorrect = activeQ.type === 'TRUE_FALSE'
                            // TRUE_FALSE: correctKey is the text value
                            ? (activeQ.correctKey === option ||
                               // legacy A/B support
                               (activeQ.correctKey === 'A' && optIdx === 0) ||
                               (activeQ.correctKey === 'B' && optIdx === 1))
                            : activeQ.correctKey === key;
                          return (
                            <div key={optIdx} className={`question-option ${isCorrect ? 'is-correct' : ''}`}>
                              <span className="question-option-key">{key}</span>
                              <span>{option}</span>
                              {isCorrect && <BiCheck size={16} />}
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>


              </div>
            );
          })()}
        </main>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="admin-modal questions-editor-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="admin-modal-header questions-editor-modal-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h2 className="admin-modal-title">{isEditing ? 'Edit' : 'Add'} Question</h2>
                <div className="qe-steps">
                  <span
                    className={`qe-step${modalStep === 1 ? ' active' : ' done'}`}
                    onClick={() => modalStep === 2 && setModalStep(1)}
                    title="Step 1: Details"
                  />
                  <span className={`qe-step${modalStep === 2 ? ' active' : ''}`} title="Step 2: Answer" />
                </div>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="admin-btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}><BiX size={18} /></button>
            </div>

            {/* Body */}
            <div className="admin-modal-body questions-editor-modal-body">
              {error && (
                <div className="admin-alert admin-alert-error" style={{ marginBottom: 16 }}>
                  <div className="admin-alert-content"><BiErrorCircle size={16} /><span>{error}</span></div>
                  <button onClick={() => setError(null)} className="admin-btn-icon" style={{ width: 28, height: 28 }}><BiX size={16} /></button>
                </div>
              )}

              {/* ── Step 1: Question details ── */}
              {modalStep === 1 && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Question Text *</label>
                    <textarea value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                      className="admin-form-input admin-form-textarea" placeholder="Enter the question" rows={4} />
                  </div>

                  <div className="questions-editor-fields-grid">
                    <div className="admin-form-group questions-editor-type-group">
                      <label className="admin-form-label">Type *</label>
                      <CustomSelect
                        value={formData.type}
                        onChange={(v) => handleTypeChange(v as CreateQuestionRequest['type'])}
                        options={QUESTION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                        dropUp
                      />
                    </div>
                    <div className="admin-form-group questions-editor-difficulty-group">
                      <label className="admin-form-label">Difficulty *</label>
                      <CustomSelect
                        value={formData.difficulty}
                        onChange={(v) => setFormData({ ...formData, difficulty: v as 'EASY' | 'MEDIUM' | 'HARD' | 'TIE_BREAKER' })}
                        options={[
                          { value: 'EASY', label: 'Easy' },
                          { value: 'MEDIUM', label: 'Medium' },
                          { value: 'HARD', label: 'Hard' },
                          { value: 'TIE_BREAKER', label: 'Tie Breaker' },
                        ]}
                        dropUp
                      />
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
                </>
              )}

              {/* ── Step 2: Answer configuration ── */}
              {modalStep === 2 && (
                <>
                  {formData.type === 'MULTIPLE_CHOICE' && (
                    <div className="admin-form-group">
                      <label className="admin-form-label">Answer Options * (click ✓ to mark correct)</label>
                      <div className="questions-editor-options-list">
                        {formData.options.map((option, idx) => {
                          const key = OPTION_KEYS[idx];
                          const isCorrect = formData.correctKey === key;
                          return (
                            <div key={idx} className="questions-editor-option-row">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, correctKey: key })}
                                className={`questions-editor-option-toggle${isCorrect ? ' selected' : ''}`}
                                title="Mark as correct answer"
                              >
                                {isCorrect ? <BiCheck size={20} /> : <span style={{ fontSize: 12, opacity: 0.5 }}>✓</span>}
                              </button>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(idx, e.target.value)}
                                className="admin-form-input questions-editor-option-input"
                                placeholder={`Option ${idx + 1}`}
                              />
                              {formData.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(idx)}
                                  className="admin-btn-icon"
                                  title="Remove option"
                                  style={{ color: '#ef4444', flexShrink: 0 }}
                                >
                                  <BiX size={16} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {formData.options.length < 8 && (
                        <button
                          type="button"
                          onClick={addOption}
                          className="admin-btn admin-btn-secondary"
                          style={{ marginTop: 8, width: '100%' }}
                        >
                          <BiPlus size={16} /> Add Option
                        </button>
                      )}
                      <p className="questions-editor-helper-text">Click ✓ to mark the correct answer</p>
                      <div className="questions-editor-case-toggle" style={{ marginTop: 8 }}>
                        <input
                          type="checkbox"
                          id="mcqCaseSensitiveToggle"
                          checked={formData.caseSensitive ?? false}
                          onChange={(e) => setFormData({ ...formData, caseSensitive: e.target.checked })}
                          className="questions-editor-case-checkbox"
                        />
                        <label htmlFor="mcqCaseSensitiveToggle" className="questions-editor-case-label">
                          Case-Sensitive Option Matching
                        </label>
                      </div>
                    </div>
                  )}

                  {formData.type === 'TRUE_FALSE' && (
                    <div className="admin-form-group">
                      <label className="admin-form-label">Correct Answer *</label>
                      <div className="questions-editor-truefalse-grid">
                        {DEFAULT_TRUE_FALSE_OPTIONS.map((option) => {
                          const isCorrect = formData.correctKey === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setFormData({ ...formData, correctKey: option })}
                              className={`questions-editor-truefalse-btn${isCorrect ? ' selected' : ''}`}
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
                        rows={5}
                        placeholder={'Example:\nParis\nCity of Paris'}
                      />
                      <p className="questions-editor-helper-text">
                        {formData.caseSensitive ? 'Matching is case-sensitive and exact.' : 'Matching is case-insensitive and ignores extra spaces.'}
                      </p>
                      <div className="questions-editor-case-toggle">
                        <input
                          type="checkbox"
                          id="caseSensitiveToggle"
                          checked={formData.caseSensitive ?? false}
                          onChange={(e) => setFormData({ ...formData, caseSensitive: e.target.checked })}
                          className="questions-editor-case-checkbox"
                        />
                        <label htmlFor="caseSensitiveToggle" className="questions-editor-case-label">
                          Case-Sensitive Matching
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="admin-modal-footer questions-editor-modal-footer">
              {modalStep === 1 ? (
                <>
                  <button onClick={() => { setShowModal(false); resetForm(); }} className="admin-btn admin-btn-secondary">Cancel</button>
                  <button
                    className="admin-btn admin-btn-primary"
                    disabled={!formData.text.trim()}
                    onClick={() => {
                      setError(null);
                      setModalStep(2);
                    }}
                  >
                    Next: Answer →
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setError(null); setModalStep(1); }} className="admin-btn admin-btn-secondary">← Back</button>
                  <button onClick={handleSave} className="admin-btn admin-btn-primary">{isEditing ? 'Update' : 'Add'} Question</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import From Bank Modal */}
      {showBankModal && (
        <div className="admin-modal-overlay" onClick={() => setShowBankModal(false)}>
          <div className="admin-modal qbank-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header qbank-modal-header">
              <div>
                <h2 className="admin-modal-title">Import from Bank</h2>
                <p className="qbank-modal-subtitle">
                  {filteredBankQuestions.length} available
                  {selectedBankIds.length > 0 && <span className="qbank-selected-badge">{selectedBankIds.length} selected</span>}
                </p>
              </div>
              <button onClick={() => setShowBankModal(false)} className="admin-btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}><BiX size={18} /></button>
            </div>

            {bankQuestions.length === 0 ? (
              <div className="qbank-empty-state">
                <div className="qbank-empty-icon">
                  {bankTotalCount === 0 ? '📭' : '✅'}
                </div>
                <p className="qbank-empty-title">
                  {bankTotalCount === 0 ? 'Your question bank is empty' : 'All bank questions are already in this quiz'}
                </p>
                <p className="qbank-empty-hint">
                  {bankTotalCount === 0
                    ? 'Questions you create in any quiz are automatically saved to your bank. Start adding questions to see them here.'
                    : `All ${bankTotalCount} question${bankTotalCount !== 1 ? 's' : ''} from your bank have already been added to this quiz.`}
                </p>
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div className="qbank-toolbar">
                  <div className="qbank-search-wrap">
                    <BiSearch size={16} className="qbank-search-icon" />
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={(e) => { setBankSearch(e.target.value); setBankVisibleCount(10); }}
                      className="admin-form-input qbank-search-input"
                      placeholder="Search questions..."
                    />
                  </div>
                  {bankSourceQuizzes.length > 0 && (
                    <select
                      value={bankQuizFilter}
                      onChange={(e) => { setBankQuizFilter(e.target.value); setBankVisibleCount(10); }}
                      className="admin-form-input qbank-quiz-filter"
                    >
                      <option value="">All quizzes</option>
                      {bankSourceQuizzes.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  )}
                  <label className="qbank-select-all">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      disabled={visibleBankIds.length === 0}
                    />
                    All
                  </label>
                  {selectedBankIds.length > 0 && (
                    <button type="button" onClick={() => setSelectedBankIds([])} className="qbank-clear-btn">
                      Clear
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="qbank-list">
                  {filteredBankQuestions.length === 0 ? (
                    <p className="admin-empty-text" style={{ padding: '24px 0', textAlign: 'center' }}>No questions match your search.</p>
                  ) : (
                    <>
                      {filteredBankQuestions.slice(0, bankVisibleCount).map((item) => {
                        const selected = selectedBankIds.includes(item.id);
                        return (
                          <label key={item.id} className={`qbank-item${selected ? ' selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleBankSelection(item.id)}
                              className="qbank-item-check"
                            />
                            <div className="qbank-item-body">
                              <p className="qbank-item-text">{item.text}</p>
                              <div className="qbank-item-meta">
                                <span className={`qbank-diff qbank-diff-${item.difficulty.toLowerCase()}`}>{item.difficulty}</span>
                                <span>{item.points} pts</span>
                                <span>{item.timeLimit}s</span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                      {bankVisibleCount < filteredBankQuestions.length && (
                        <button
                          type="button"
                          className="qbank-load-more"
                          onClick={() => setBankVisibleCount((n) => n + 10)}
                        >
                          Load more ({filteredBankQuestions.length - bankVisibleCount} remaining)
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            <div className="admin-modal-footer questions-bank-modal-footer">
              <button onClick={() => setShowBankModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
              <button
                onClick={handleImportFromBank}
                className="admin-btn admin-btn-primary"
                disabled={selectedBankIds.length === 0 || !canEditContent}
              >
                Import {selectedBankIds.length > 0 ? `(${selectedBankIds.length})` : ''}
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
