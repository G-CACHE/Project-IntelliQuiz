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
} from 'react-icons/bi';
import { questionsApi, quizzesApi, type Question, type Quiz, type CreateQuestionRequest } from '../../services/api';

const initialForm: CreateQuestionRequest = {
  text: '', type: 'MULTIPLE_CHOICE', difficulty: 'MEDIUM',
  answers: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
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
    if (!formData.text.trim()) return setError('Question text is required');
    const hasCorrect = formData.answers.some((a) => a.isCorrect && a.text.trim());
    if (!hasCorrect) return setError('At least one correct answer is required');
    const validAnswers = formData.answers.filter((a) => a.text.trim());
    if (validAnswers.length < 2) return setError('At least two answers are required');

    try {
      if (isEditing && selectedQuestion) {
        await questionsApi.update(selectedQuestion.id, { ...formData, answers: validAnswers });
      } else {
        await questionsApi.create(quizIdNum, { ...formData, answers: validAnswers });
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
    const answers = question.answers.length >= 4
      ? question.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect }))
      : [...question.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect })), ...Array(4 - question.answers.length).fill({ text: '', isCorrect: false })];
    setFormData({ text: question.text, type: question.type, difficulty: question.difficulty, answers });
    setShowModal(true);
  };

  const resetForm = () => { setFormData(initialForm); setIsEditing(false); setSelectedQuestion(null); setError(null); };

  const updateAnswer = (idx: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const newAnswers = [...formData.answers];
    newAnswers[idx] = { ...newAnswers[idx], [field]: value };
    setFormData({ ...formData, answers: newAnswers });
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

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <div className="alert-content"><BiErrorCircle size={20} /><span>{error}</span></div>
          <button onClick={() => setError(null)} className="btn-icon"><BiX size={20} /></button>
        </div>
      )}

      {/* Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {questions.length > 0 ? (
          questions.map((q, idx) => (
            <div key={q.id} className="data-card">
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <div style={{ color: 'var(--text-muted)', paddingTop: 4 }}><BiGridVertical size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Question {idx + 1}</span>
                    <span className={`badge ${getDifficultyBadge(q.difficulty)}`}>{q.difficulty}</span>
                  </div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: 'var(--spacing-md)' }}>{q.text}</h4>
                  <div className="grid-2" style={{ gap: 'var(--spacing-sm)' }}>
                    {q.answers.map((a) => (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-md)', fontSize: '14px',
                        background: a.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                        border: `1px solid ${a.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-secondary)'}`,
                        color: a.isCorrect ? '#34d399' : 'var(--text-secondary)'
                      }}>
                        {a.isCorrect && <BiCheck size={16} />}
                        {a.text}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <button className="btn-icon" onClick={() => openEditModal(q)} title="Edit"><BiEdit size={18} /></button>
                  <button className="btn-icon danger" onClick={() => { setSelectedQuestion(q); setShowDeleteModal(true); }} title="Delete"><BiTrash size={18} /></button>
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
          <div className="modal-content" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? 'Edit' : 'Add'} Question</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon"><BiX size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Question Text *</label>
                <textarea value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="form-input form-textarea" placeholder="Enter the question" rows={3} />
              </div>
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
                <label className="form-label">Answers * (check correct ones)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {formData.answers.map((a, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      <input type="checkbox" checked={a.isCorrect} onChange={(e) => updateAnswer(idx, 'isCorrect', e.target.checked)} className="form-checkbox" />
                      <input type="text" value={a.text} onChange={(e) => updateAnswer(idx, 'text', e.target.value)}
                        className="form-input" style={{ flex: 1 }} placeholder={`Answer ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn btn-primary">{isEditing ? 'Update' : 'Add'}</button>
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
