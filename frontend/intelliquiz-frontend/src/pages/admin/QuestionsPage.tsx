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
} from 'react-icons/bi';
import { questionsApi, quizzesApi, type Question, type Quiz, type CreateQuestionRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin.css';

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
  const { canEditQuiz, canViewQuiz, isSuperAdmin } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CreateQuestionRequest>(initialForm);
  
  const hasEditPermission = isSuperAdmin() || canEditQuiz(quizIdNum);
  const hasViewPermission = isSuperAdmin() || canViewQuiz(quizIdNum) || canEditQuiz(quizIdNum);

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
            <button className="admin-btn-icon" onClick={() => navigate('/admin/quizzes')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}>
              <BiArrowBack size={18} />
            </button>
            <div className="admin-page-icon"><BiFile size={26} /></div>
            <div>
              <h1 className="admin-page-title">Questions</h1>
              <p className="admin-page-subtitle">{quiz?.title || 'Quiz'} • {questions.length} questions {!hasEditPermission && <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}><BiLock size={12} style={{ verticalAlign: 'middle' }} /> View only</span>}</p>
            </div>
          </div>
          {hasEditPermission && (
            <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
              <BiPlus size={18} /> Add Question
            </button>
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
                  {hasEditPermission && (
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
              <p className="admin-empty-text">{hasEditPermission ? 'Add questions to make your quiz complete' : 'No questions have been added to this quiz yet'}</p>
              {hasEditPermission && (
                <button className="admin-btn admin-btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                  <BiPlus size={16} /> Add First Question
                </button>
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
