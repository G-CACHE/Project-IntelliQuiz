import { useState, useEffect } from 'react';
import { Eye, Edit2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { ErrorBanner } from '../../components/common/ErrorBanner';

interface Question {
  id: number;
  text: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  position: number;
  answers: Answer[];
}

interface Answer {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface Quiz {
  id: number;
  title: string;
  status: 'DRAFT' | 'READY' | 'ACTIVE' | 'ARCHIVED';
}

interface UserPermissions {
  canViewDetails: boolean;
  canEditContent: boolean;
  canManageTeams: boolean;
  canHostGame: boolean;
}

export default function QuestionManagementPage({ 
  quizId, 
  userPermissions 
}: { 
  quizId: number;
  userPermissions: UserPermissions;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<{
    text: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    answers: { text: string; isCorrect: boolean }[];
  }>({
    text: '',
    difficulty: 'MEDIUM',
    answers: [],
  });

  useEffect(() => {
    loadData();
  }, [quizId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [questionsRes, quizRes] = await Promise.all([
        fetch(`/api/quizzes/${quizId}/questions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`/api/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (!questionsRes.ok || !quizRes.ok) {
        throw new Error('Failed to load data');
      }

      const questionsData = await questionsRes.json();
      const quizData = await quizRes.json();
      
      setQuestions(questionsData);
      setQuiz(quizData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
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
      loadData();
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
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  const openEditModal = (question: Question) => {
    if (!userPermissions.canEditContent) {
      setError('You do not have permission to edit questions');
      return;
    }
    setSelectedQuestion(question);
    setFormData({
      text: question.text,
      difficulty: question.difficulty,
      answers: question.answers.map(a => ({ text: a.text, isCorrect: a.isCorrect })),
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (question: Question) => {
    if (!userPermissions.canEditContent) {
      setError('You do not have permission to delete questions');
      return;
    }
    setSelectedQuestion(question);
    setShowDeleteConfirm(true);
  };

  const openPreview = (question: Question) => {
    setPreviewQuestion(question);
    setShowPreview(true);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{quiz?.title} - Questions</h1>
        <p className="text-gray-600 mt-1">
          {userPermissions.canEditContent ? 'View and edit' : 'View'} quiz questions
        </p>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {!userPermissions.canViewDetails && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          You have limited access to this quiz. Contact your administrator for full access.
        </div>
      )}

      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No questions in this quiz yet.
          </div>
        ) : (
          questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
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
                    <p className="text-xs text-gray-500 font-medium">Answer Options:</p>
                    {question.answers.map(answer => (
                      <div 
                        key={answer.id} 
                        className={`p-2 rounded text-sm flex items-center gap-2 ${
                          answer.isCorrect 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {answer.isCorrect && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-xs">✓</span>
                        )}
                        <span className={answer.isCorrect ? 'text-green-700 font-semibold' : 'text-gray-700'}>
                          {answer.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 flex-col">
                  <button
                    onClick={() => openPreview(question)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded flex items-center gap-1"
                    title="Preview question"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {userPermissions.canEditContent && (
                    <>
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
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      <Modal 
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewQuestion(null);
        }}
        title="Question Preview"
      >
        {previewQuestion && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Question</p>
              <p className="text-lg font-semibold text-gray-900">{previewQuestion.text}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Difficulty: <span className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(previewQuestion.difficulty)}`}>{previewQuestion.difficulty}</span></p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Answers:</p>
              <div className="space-y-2">
                {previewQuestion.answers.map((answer) => (
                  <div key={answer.id} className={`p-3 rounded border ${
                    answer.isCorrect 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        disabled
                        defaultChecked={answer.isCorrect}
                        className="w-4 h-4"
                      />
                      <span className={answer.isCorrect ? 'font-semibold text-green-700' : 'text-gray-700'}>
                        {answer.text}
                      </span>
                      {answer.isCorrect && <span className="text-xs text-green-700 font-semibold ml-auto">Correct</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => {
                setShowPreview(false);
                setPreviewQuestion(null);
              }}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </Modal>

      {/* Edit Question Modal */}
      {userPermissions.canEditContent && (
        <Modal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedQuestion(null);
          }}
          title="Edit Question"
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
                Answers * (mark correct)
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
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleUpdateQuestion}
                className="flex-1"
              >
                Update
              </Button>
              <Button 
                onClick={() => {
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
      )}

      {/* Delete Confirmation Modal */}
      {userPermissions.canEditContent && (
        <Modal 
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Question"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete this question?
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
      )}
    </div>
  );
}
