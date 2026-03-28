import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiBoltCircle,
  BiBookOpen,
  BiFile,
  BiPlay,
  BiRightArrowAlt,
  BiStar,
  BiTime,
  BiTrendingUp,
  BiTargetLock,
} from 'react-icons/bi';
import { useQuizzes } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin.css';
import '../superadmin/DashboardPage.css';
import './DashboardPage.css';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { canEditQuiz } = useAuth();
  const username = localStorage.getItem('username') || 'Admin';
  
  // React Query hook
  const { data: allQuizzes = [], isLoading } = useQuizzes();

  // No need to filter by assignments - backend already filters by createdByUserId
  const quizzes = allQuizzes;

  const stats = useMemo(() => ({
    totalQuizzes: quizzes.length,
    activeQuizzes: quizzes.filter(q => q.status === 'ACTIVE').length,
    readyQuizzes: quizzes.filter(q => q.status === 'READY').length,
    draftQuizzes: quizzes.filter(q => q.status === 'DRAFT').length,
  }), [quizzes]);

  const recentQuizzes = useMemo(() => quizzes.slice(0, 5), [quizzes]);

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'draft', READY: 'ready', ACTIVE: 'active', ARCHIVED: 'archived'
    };
    return map[status] || 'draft';
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-kahoot admin-dashboard-shell">
      <div className="dashboard-hero">
        <div className="hero-background">
          <div className="hero-shape shape-1"></div>
          <div className="hero-shape shape-2"></div>
          <div className="hero-shape shape-3"></div>
          <div className="hero-dots"></div>
        </div>

        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-greeting">
              <BiBoltCircle className="greeting-icon" />
              <span>Welcome back!</span>
            </div>
            <h1 className="hero-title">{username || 'AdminIT'}</h1>
            <p className="hero-subtitle">Launch, track, and level up your quiz sessions from one command center.</p>
          </div>

          <div className="hero-right">
            <button className="hero-cta" onClick={() => navigate('/admin/quizzes')}>
              <BiPlay size={22} />
              <span>Open Quizzes</span>
            </button>
          </div>
        </div>
      </div>

      <div className="stats-row admin-stats-row-4">
        <div className="stat-card-kahoot red">
          <div className="stat-card-inner">
            <div className="stat-icon-wrap">
              <BiBookOpen size={26} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.totalQuizzes}</span>
              <span className="stat-text">Total Quizzes</span>
            </div>
          </div>
          <div className="stat-decoration"></div>
        </div>

        <div className="stat-card-kahoot green">
          <div className="stat-card-inner">
            <div className="stat-icon-wrap">
              <BiPlay size={26} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.activeQuizzes}</span>
              <span className="stat-text">Live Now</span>
            </div>
            {stats.activeQuizzes > 0 && <div className="live-pulse"></div>}
          </div>
          <div className="stat-decoration"></div>
        </div>

        <div className="stat-card-kahoot blue">
          <div className="stat-card-inner">
            <div className="stat-icon-wrap">
              <BiTargetLock size={26} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.readyQuizzes}</span>
              <span className="stat-text">Ready</span>
            </div>
          </div>
          <div className="stat-decoration"></div>
        </div>

        <div className="stat-card-kahoot yellow">
          <div className="stat-card-inner">
            <div className="stat-icon-wrap">
              <BiFile size={26} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.draftQuizzes}</span>
              <span className="stat-text">Draft</span>
            </div>
          </div>
          <div className="stat-decoration"></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card actions-card">
          <div className="card-header-kahoot">
            <div className="card-title-wrap">
              <BiBoltCircle className="card-icon" />
              <h2>Quick Actions</h2>
            </div>
          </div>

          <div className="actions-grid actions-grid-admin">
            <button className="action-btn red" onClick={() => navigate('/admin/quizzes')}>
              <div className="action-icon">
                <BiBookOpen size={24} />
              </div>
              <span>Create Quiz</span>
            </button>

            <button className="action-btn blue" onClick={() => navigate('/admin/quizzes')}>
              <div className="action-icon">
                <BiTrendingUp size={24} />
              </div>
              <span>Track Status</span>
            </button>
          </div>

          <div className="fun-tip">
            <div className="tip-icon"><BiStar size={22} /></div>
            <div className="tip-content">
              <strong>Tip</strong>
              <p>Start with draft quizzes, then mark them ready when questions are polished.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card quizzes-card">
          <div className="card-header-kahoot">
            <div className="card-title-wrap">
              <BiStar className="card-icon" />
              <h2>Recent Quizzes</h2>
            </div>
            <button className="view-all-btn" onClick={() => navigate('/admin/quizzes')}>
              View All <BiRightArrowAlt size={18} />
            </button>
          </div>

          <div className="quizzes-list">
            {recentQuizzes.length > 0 ? (
              recentQuizzes.map((quiz, index) => {
                const colors = ['#7a1733', '#9f2346', '#d4a017', '#6f4e57'];
                return (
                <div 
                  key={quiz.id} 
                  className="quiz-item"
                  onClick={() => canEditQuiz(quiz.id, quiz.createdByUserId) ? navigate(`/admin/quizzes/${quiz.id}/questions`) : navigate('/admin/quizzes')}
                >
                  <div className="quiz-item-left">
                    <div className="quiz-icon" style={{ background: colors[index % 4] }}>
                      <BiBookOpen size={20} />
                    </div>
                    <div className="quiz-details">
                      <h4>{quiz.title}</h4>
                      <span className="quiz-meta">
                        <BiTime size={12} style={{ marginRight: 4 }} />
                        {quiz.questionCount || 0} questions
                      </span>
                    </div>
                  </div>
                  <div className={`quiz-status status-${getStatusClass(quiz.status)}`}>
                    <span>{quiz.status}</span>
                  </div>
                </div>
              );})
            ) : (
              <div className="empty-quizzes">
                <div className="empty-illustration">
                  <BiBookOpen size={48} />
                </div>
                <h3>No quizzes yet</h3>
                <p>Click create quiz to build your first game-ready set.</p>
                <button className="create-first-btn" onClick={() => navigate('/admin/quizzes')}>
                  <BiBookOpen size={18} /> Create Your First Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
