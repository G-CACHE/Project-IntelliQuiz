import { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { ErrorBanner } from '../../components/common/ErrorBanner';

interface Question {
  id: number;
  text: string;
  type: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  position: number;
  answers: Answer[];
}

interface Answer {
  id: number;
  text: string;
  isCorrect: boolean;
  position: number;
}

interface CreateQuestionRequest {
  text: string;
  type: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  answers: { text: string; isCorrect: boolean }[];
}

const initialQuestionForm: CreateQuestionRequest = {
  text: '',
  type: 'MULTIPLE_CHOICE',
  difficulty: 'MEDIUM',
  answers: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
};

export default function QuizEditorPage({ quizId }: { quizId: number }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<CreateQuestionRequest>(initialQuestionForm);

  useEffect(() => {
    loadQuestions();
  }, [quizId]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/quizzes/${quizId}/questions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load questions');
      const data = await response.json();
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!formData.text) {
      setError('Question text is required');
      return;
    }

    const hasCorrectAnswer = formData.answers.some(a => a.isCorrect);
    if (!hasCorrectAnswer) {
      setError('At least one answer must be marked as correct');
      return;
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create question');
      
      setShowCreateModal(false);
      setFormData(initialQuestionForm);
      loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
    }
  };

  const handleUpdateQuestion = async () => {
    if (!selectedQuestion || !formData.text) {
      setError('Question text is required');
      return;
    }

    const hasCorrectAnswer = formData.answers.some(a => a.isCorrect);
    if (!hasCorrectAnswer) {
      setError('At least one answer must be marked as correct');
      return;
    }

    try {
      const response = await fetch(`/api/questions/${selectedQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update question');
      
      setShowEditModal(false);
      setSelectedQuestion(null);
      setFormData(initialQuestionForm);
      loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update question');
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;

    try {
      const response = await fetch(`/api/questions/${selectedQuestion.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete question');
      
      setShowDeleteConfirm(false);
      setSelectedQuestion(null);
      loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  const openEditModal = (question: Question) => {
    setSelectedQuestion(question);
    setFormData({
      text: question.text,
      type: question.type,
      difficulty: question.difficulty,
      answers: question.answers.map(a => ({ text: a.text, isCorrect: a.isCorrect })),
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (question: Question) => {
    setSelectedQuestion(question);
    setShowDeleteConfirm(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quiz Questions Editor</h1>
        <Button 
          onClick={() => {
            setFormData(initialQuestionForm);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Add Question
        </Button>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No questions yet. Add the first question to get started.
          </div>
        ) : (
          questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className="flex items-start pt-1">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Question {index + 1}</p>
                      <h3 className="text-lg font-semibold text-gray-900 break-words">{question.text}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ml-4 ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                  </div>

                  <div className="space-y-2 mt-3">
                    {question.answers.map(answer => (
                      <div 
                        key={answer.id} 
                        className={`p-2 rounded text-sm ${
                          answer.isCorrect 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <span className={answer.isCorrect ? 'text-green-700 font-semibold' : 'text-gray-700'}>
                          {answer.isCorrect && '✓ '}{answer.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(question)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit question"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(question)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Question Modal */}
      <Modal 
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedQuestion(null);
        }}
        title={showEditModal ? 'Edit Question' : 'Add Question'}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Text *
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the question"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty *
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Options * (mark correct answer)
            </label>
            <div className="space-y-2">
              {formData.answers.map((answer, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={answer.isCorrect}
                    onChange={(e) => {
                      const newAnswers = [...formData.answers];
                      newAnswers[idx].isCorrect = e.target.checked;
                      setFormData({ ...formData, answers: newAnswers });
                    }}
                    className="mt-2 w-4 h-4 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={answer.text}
                    onChange={(e) => {
                      const newAnswers = [...formData.answers];
                      newAnswers[idx].text = e.target.value;
                      setFormData({ ...formData, answers: newAnswers });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Answer ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={showEditModal ? handleUpdateQuestion : handleCreateQuestion}
              className="flex-1"
            >
              {showEditModal ? 'Update' : 'Add'} Question
            </Button>
            <Button 
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedQuestion(null);
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Question"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this question? This action cannot be undone.
          </p>
          <p className="text-sm text-gray-600 font-medium break-words">
            "{selectedQuestion?.text}"
          </p>
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleDeleteQuestion}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
            <Button 
              onClick={() => setShowDeleteConfirm(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
