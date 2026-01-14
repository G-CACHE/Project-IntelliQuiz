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
  BiGridVertical,
  BiTime,
  BiStar,
} from 'react-icons/bi';
import { questionsApi, quizzesApi, type Question, type Quiz, type CreateQuestionRequest } from '../../services/api';

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

export default function QuestionsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const quizIdNum = quizId ? parseInt(quizId) : 0;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CreateQuestionRequest>(initialForm);

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
    if (!formData.text.trim()) return setError('Question text is required');
    if (!formData.correctKey) return setError('Please select the correct answer');
    
    const validOptions = formData.options.filter((o) => o.trim());
    if (validOptions.length < 2) return setError('At least two answer options are required');
    
    // Check if correctKey is valid for the number of options
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
    // Pad options to 4 if needed
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
    const map: Record<string, string> = { EASY: 'badge-success', MEDIUM: 'badge-warning', HARD: 'badge-primary' };
    return map[d] || 'badge-gray';
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner" /></div>;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <button className="btn-icon" onClick={() => navigate('/superadmin/quizzes')}><BiArrowBack size={20} /></button>
          <div>
            <h1 className="page-title"><BiFile size={28} /> Questions</h1>
            <p className="page-subtitle">{quiz?.title || 'Quiz'} • {questions.length} questions</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <BiPlus size={18} /> Add Question
        </button>
      </div>

      {/* Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {questions.length > 0 ? (
          questions.map((q, idx) => (
            <div key={q.id} className="data-card">
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <div style={{ color: 'var(--text-muted)', paddingTop: 4 }}><BiGridVertical size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Question {idx + 1}</span>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BiStar size={14} /> {q.points} pts
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BiTime size={14} /> {q.timeLimit}s
                      </span>
                      <span className={`badge ${getDifficultyBadge(q.difficulty)}`}>{q.difficulty}</span>
                    </div>
                  </div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: 'var(--spacing-md)' }}>{q.text}</h4>
                  <div className="grid-2" style={{ gap: 'var(--spacing-sm)' }}>
                    {q.options.map((option, optIdx) => {
                      const key = OPTION_KEYS[optIdx];
                      const isCorrect = key === q.correctKey;
                      return (
                        <div key={optIdx} style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm) var(--spacing-md)',
                          borderRadius: 'var(--radius-md)', fontSize: '14px',
                          background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                          border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-secondary)'}`,
                          color: isCorrect ? '#34d399' : 'var(--text-secondary)'
                        }}>
                          <span style={{ fontWeight: 600, minWidth: 20 }}>{key}.</span>
                          {isCorrect && <BiCheck size={16} />}
                          {option}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <button type="button" className="btn-icon" onClick={() => openEditModal(q)} title="Edit"><BiEdit size={18} /></button>
                  <button type="button" className="btn-icon danger" onClick={() => { setSelectedQuestion(q); setShowDeleteModal(true); }} title="Delete"><BiTrash size={18} /></button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card"><div className="empty-state"><BiFile size={48} className="empty-state-icon" /><p>No questions yet</p></div></div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? 'Edit' : 'Add'} Question</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
                  <div className="alert-content"><BiErrorCircle size={18} /><span>{error}</span></div>
                  <button onClick={() => setError(null)} className="btn-icon" style={{ padding: 4 }}><BiX size={16} /></button>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Question Text *</label>
                <textarea value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="form-input form-textarea" placeholder="Enter the question" rows={3} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label">Difficulty *</label>
                  <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })}
                    className="form-input form-select">
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Points *</label>
                  <input type="number" value={formData.points} onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    className="form-input" min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time (sec) *</label>
                  <input type="number" value={formData.timeLimit} onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 0 })}
                    className="form-input" min={0} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Answer Options * (click to mark correct)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {formData.options.map((option, idx) => {
                    const key = OPTION_KEYS[idx];
                    const isCorrect = formData.correctKey === key;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, correctKey: key })}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${isCorrect ? 'var(--color-success)' : 'var(--border-secondary)'}`,
                            background: isCorrect ? 'var(--color-success)' : 'transparent',
                            color: isCorrect ? 'white' : 'var(--text-secondary)',
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
                          className="form-input"
                          style={{ flex: 1 }}
                          placeholder={`Option ${key}`}
                        />
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)' }}>
                  Click the letter button to mark the correct answer
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn btn-primary">{isEditing ? 'Update' : 'Add'} Question</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedQuestion && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Question</h2>
              <button onClick={() => setShowDeleteModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to delete this question?</p>
              <p style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontWeight: 500 }}>
                "{selectedQuestion.text}"
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
