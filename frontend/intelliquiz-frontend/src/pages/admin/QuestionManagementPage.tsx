import { useMemo, useState, useEffect } from 'react';
import { Eye, Edit2, Check, X, ChevronLeft, ChevronRight, BookOpen, Layers3, Lock } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { ErrorBanner } from '../../components/common/ErrorBanner';

interface Question {
  id: number;
  text: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'TIE_BREAKER';
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
  const questionsPerPage = 4;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<{
    text: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'TIE_BREAKER';
    answers: { text: string; isCorrect: boolean }[];
  }>({
    text: '',
    difficulty: 'MEDIUM',
    answers: [],
  });

  useEffect(() => {
    loadData();
    setCurrentPage(1);
  }, [quizId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [questionsRes, quizRes] = await Promise.all([
        fetch(`/api/quizzes/${quizId}/questions`, {
          credentials: 'include',
        }),
        fetch(`/api/quizzes/${quizId}`, {
          credentials: 'include',
        }),
      ]);

      if (!questionsRes.ok || !quizRes.ok) {
        throw new Error('Failed to load data');
      }

      const questionsData = await questionsRes.json();
      const quizData = await quizRes.json();
      
      setQuestions(questionsData);
      setQuiz(quizData);
      setCurrentPage(1);
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
        credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
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
        credentials: 'include',
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

  const sortedQuestions = useMemo(
    () => [...questions].sort((left, right) => (left.position ?? left.id) - (right.position ?? right.id)),
    [questions],
  );

  const totalPages = Math.max(1, Math.ceil(sortedQuestions.length / questionsPerPage));

  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * questionsPerPage;
    return sortedQuestions.slice(startIndex, startIndex + questionsPerPage);
  }, [currentPage, sortedQuestions]);

  const startQuestionIndex = (currentPage - 1) * questionsPerPage + 1;
  const endQuestionIndex = Math.min(currentPage * questionsPerPage, sortedQuestions.length);

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-red-100 text-red-800';
      case 'TIE_BREAKER':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-[28px] border border-[#e7dfe2] bg-gradient-to-r from-[#7a1733] via-[#8d2144] to-[#a93a5c] px-6 py-6 text-white shadow-[0_14px_28px_rgba(95,16,39,0.12)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Quiz Questions</p>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                  {quiz?.title || 'Quiz'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-white/88 sm:text-[15px]">
              Review questions in a cleaner, easier-to-scan layout with page navigation for quicker browsing.
            </p>

            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold text-white/95">
                <Layers3 className="h-4 w-4" />
                {sortedQuestions.length} questions
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold text-white/95">
                <Lock className="h-4 w-4" />
                {userPermissions.canEditContent ? 'Editable access' : 'View only'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold text-white/95">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[280px]">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Visible</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{sortedQuestions.length === 0 ? 0 : `${startQuestionIndex}-${endQuestionIndex}`}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Per page</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{questionsPerPage}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm sm:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Mode</p>
              <p className="mt-1 text-base font-semibold text-white">{userPermissions.canEditContent ? 'Manage' : 'Inspect'}</p>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {!userPermissions.canViewDetails && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          You have limited access to this quiz. Contact your administrator for full access.
        </div>
      )}

      <div className="space-y-4">
        {sortedQuestions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No questions in this quiz yet.
          </div>
        ) : (
          paginatedQuestions.map((question, index) => (
            <div key={question.id} className="rounded-2xl border border-[#e7dfe2] bg-white p-5 shadow-[0_1px_2px_rgba(17,17,17,0.04)] transition-shadow hover:shadow-[0_6px_18px_rgba(17,17,17,0.05)]">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-3">
                    <div className="space-y-2 min-w-0">
                      <p className="inline-flex w-fit items-center rounded-full border border-[#e7dfe2] bg-[#faf8f6] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#7b6f73]">
                        Question {startQuestionIndex + index}
                      </p>
                      <h3 className="text-xl font-extrabold leading-snug text-[#241015] break-words">
                        {question.text}
                      </h3>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap sm:ml-4 ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 rounded-2xl border border-[#ece3e6] bg-[#fcfbfa] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b6f73]">Answer Options</p>
                    {question.answers.map(answer => (
                      <div 
                        key={answer.id} 
                        className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm ${
                          answer.isCorrect 
                            ? 'border-[#d8e8d0] bg-[#f4faef]' 
                            : 'border-[#e7dfe2] bg-white'
                        }`}
                      >
                        <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${answer.isCorrect ? 'border-[#c9e0bc] bg-[#eaf5e2] text-[#2f6b1f]' : 'border-[#e7dfe2] bg-[#faf8f6] text-[#7b6f73]'}`}>
                          {String.fromCharCode(65 + question.answers.findIndex((item) => item.id === answer.id))}
                        </span>
                        {answer.isCorrect && (
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-white text-xs"><Check className="h-3 w-3" /></span>
                        )}
                        <span className={answer.isCorrect ? 'font-semibold text-green-700' : 'text-gray-700'}>
                          {answer.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2 self-start flex-col rounded-2xl border border-[#ece3e6] bg-[#fcfbfa] p-2">
                  <button
                    onClick={() => openPreview(question)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-white hover:text-[#7a1733]"
                    title="Preview question"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  
                  {userPermissions.canEditContent && (
                    <>
                      <button
                        onClick={() => openEditModal(question)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                        title="Edit question"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(question)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                        title="Delete question"
                      >
                        <X className="h-4 w-4" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {sortedQuestions.length > questionsPerPage && (
        <div className="flex flex-col gap-4 rounded-2xl border border-[#e7dfe2] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(17,17,17,0.04)] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#665c60]">
            Showing <span className="font-semibold text-[#241015]">{startQuestionIndex}</span> to <span className="font-semibold text-[#241015]">{endQuestionIndex}</span> of <span className="font-semibold text-[#241015]">{sortedQuestions.length}</span> questions
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-2 rounded-xl border border-[#ddd2d6] bg-white px-3 py-2 text-sm font-semibold text-[#241015] transition-colors hover:border-[#7a1733] hover:text-[#7a1733] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {paginationPages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                    page === currentPage
                      ? 'border-[#7a1733] bg-[#7a1733] text-white'
                      : 'border-[#ddd2d6] bg-white text-[#241015] hover:border-[#7a1733] hover:text-[#7a1733]'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-2 rounded-xl border border-[#ddd2d6] bg-white px-3 py-2 text-sm font-semibold text-[#241015] transition-colors hover:border-[#7a1733] hover:text-[#7a1733] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' | 'TIE_BREAKER' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="TIE_BREAKER">Tie Breaker</option>
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
