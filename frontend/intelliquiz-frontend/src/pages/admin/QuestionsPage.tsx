import { useState, useEffect } from 'react';
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
} from 'react-icons/bi';
import { questionBankApi, questionsApi, quizzesApi, type Question, type Quiz, type CreateQuestionRequest, type QuestionBankItem } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin.css';
import './AdminRedesign.css';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

const initialForm: CreateQuestionRequest = {
  text: '',
  type: 'MULTIPLE_CHOICE',
  difficulty: 'MEDIUM',
  correctKey: '',
  points: 10,
  timeLimit: 30,
  options: ['', '', '', ''],
};

export default function AdminQuestionsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const quizIdNum = quizId ? parseInt(quizId) : 0;
  const { canEditQuiz, isSuperAdmin } = useAuth();

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
  const [bankQuestions, setBankQuestions] = useState<QuestionBankItem[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<number[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  
  const hasEditPermission = isSuperAdmin() || canEditQuiz(quizIdNum, quiz?.createdByUserId);
  const isDraftQuiz = quiz?.status === 'DRAFT';
  const canEditContent = hasEditPermission && isDraftQuiz;

  useEffect(() => { if (quizIdNum) loadData(); }, [quizIdNum]);

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
    if (!formData.correctKey) return setError('Please select the correct answer');
    
    const validOptions = formData.options.filter((o) => o.trim());
    if (validOptions.length < 2) return setError('At least two answer options are required');
    
    const correctIndex = OPTION_KEYS.indexOf(formData.correctKey);
    if (correctIndex >= validOptions.length) {
      return setError('The correct answer must be one of the filled options');
    }

    try {
      const payload = {
        ...formData,
        options: validOptions,
      };
      
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
    const options = question.options.length >= 4
      ? question.options
      : [...question.options, ...Array(4 - question.options.length).fill('')];
    setFormData({
      text: question.text,
      type: question.type,
      difficulty: question.difficulty,
      correctKey: question.correctKey,
      points: question.points,
      timeLimit: question.timeLimit,
      options,
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

  const getDifficultyBadge = (d: string) => {
    const map: Record<string, string> = { EASY: 'admin-badge-success', MEDIUM: 'admin-badge-warning', HARD: 'admin-badge-primary' };
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
            <div className="admin-page-icon"><BiFile size={26} /></div>
            <div>
              <h1 className="admin-page-title">Questions</h1>
              <p className="admin-page-subtitle">
                {quiz?.title || 'Quiz'} • {questions.length} questions {!canEditContent && <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}><BiLock size={12} style={{ verticalAlign: 'middle' }} /> View only</span>}
              </p>
            </div>
          </div>
          {canEditContent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {questions.length > 0 ? (
          questions.map((q, idx) => (
            <div key={q.id} className="admin-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: 10, 
                  background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#8b5cf6', fontWeight: 700, fontSize: 14, flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h4 style={{ color: '#1e293b', fontWeight: 600, margin: 0, fontSize: 15, lineHeight: 1.5 }}>{q.text}</h4>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BiStar size={12} /> {q.points}
                      </span>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BiTime size={12} /> {q.timeLimit}s
                      </span>
                      <span className={`admin-badge ${getDifficultyBadge(q.difficulty)}`}>{q.difficulty}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {q.options.map((option, optIdx) => {
                      const key = OPTION_KEYS[optIdx];
                      const isCorrect = key === q.correctKey;
                      return (
                        <div key={optIdx} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                          borderRadius: 8, fontSize: 13,
                          background: isCorrect ? '#f0fdf4' : '#f8fafc',
                          border: `1px solid ${isCorrect ? '#bbf7d0' : '#e2e8f0'}`,
                          color: isCorrect ? '#16a34a' : '#64748b'
                        }}>
                          <span style={{ fontWeight: 600, minWidth: 18 }}>{key}.</span>
                          {isCorrect && <BiCheck size={16} />}
                          {option}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {canEditContent && (
                    <>
                      <button className="admin-btn-icon" onClick={() => openEditModal(q)} title="Edit"><BiEdit size={16} /></button>
                      <button className="admin-btn-icon danger" onClick={() => { setSelectedQuestion(q); setShowDeleteModal(true); }} title="Delete"><BiTrash size={16} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="admin-card">
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
          </div>
        )}
      </div>

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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Difficulty *</label>
                  <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })}
                    className="admin-form-input admin-form-select">
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
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
