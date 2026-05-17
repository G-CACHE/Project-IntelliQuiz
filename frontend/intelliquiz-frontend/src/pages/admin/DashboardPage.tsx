import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiBarChartAlt2,
  BiBookOpen,
  BiFile,
  BiFolderOpen,
  BiLayer,
  BiPlusCircle,
  BiRightArrowAlt,
  BiRocket,
  BiTime,
} from 'react-icons/bi';
import { useQuizzes } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import CreateQuizModal from '../../components/admin/CreateQuizModal';
import '../../styles/admin.css';
import './DashboardPage.css';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { canEditQuiz } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
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

  const recentQuizzes = useMemo(() => quizzes.slice(0, 3), [quizzes]);

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'draft', READY: 'ready', ACTIVE: 'live', ARCHIVED: 'archived'
    };
    return map[status] || 'draft';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'ARCHIVED') return 'DONE';
    if (status === 'ACTIVE') return 'LIVE';
    return status;
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p className="admin-loading-text">Loading dashboard...</p>
      </div>
    );
  }

  const statItems = [
    { key: 'total', label: 'Total Quizzes', value: stats.totalQuizzes, Icon: BiLayer },
    { key: 'active', label: 'Live Now', value: stats.activeQuizzes, Icon: BiRocket },
    { key: 'ready', label: 'Ready', value: stats.readyQuizzes, Icon: BiBarChartAlt2 },
    { key: 'draft', label: 'Draft', value: stats.draftQuizzes, Icon: BiFile },
  ] as const;

  return (
    <div className="admin-dashboard-shell admin-clean-dashboard">
      <section className="admin-clean-hero">
        <div className="admin-clean-hero-content">
          <div className="admin-clean-hero-left">
            <span className="admin-clean-chip">Admin Workspace</span>
            <h1 className="admin-clean-title">Quiz Dashboard</h1>
            <p className="admin-clean-subtitle">
              Create, organize, and monitor quizzes from one workspace.
            </p>
          </div>

          <div className="admin-clean-hero-right">
            <button className="admin-clean-btn-primary" onClick={() => navigate('/admin/quizzes')}>
              <BiFolderOpen size={18} /> Open Quizzes
            </button>
          </div>
        </div>
      </section>

      <section className="admin-clean-stats" aria-label="Dashboard statistics">
        {statItems.map(({ key, label, value, Icon }) => (
          <div key={key} className="admin-clean-stat-card">
            <div className="admin-clean-stat-icon">
              <Icon size={22} />
            </div>
            <div className="admin-clean-stat-body">
              <p className="admin-clean-stat-value">{value}</p>
              <p className="admin-clean-stat-label">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="admin-clean-main-grid">
        <div className="admin-clean-panel admin-clean-panel-actions">
          <div className="admin-clean-panel-head">
            <h2><BiPlusCircle size={18} /> Quick Actions</h2>
          </div>

          <div className="admin-clean-actions-grid">
            <button className="admin-clean-action" onClick={() => setShowCreateModal(true)}>
              <span className="admin-clean-action-icon"><BiBookOpen size={16} /></span>
              <span>
                <strong>Create Quiz</strong>
                <small>Build a new question set</small>
              </span>
            </button>

            <button className="admin-clean-action" onClick={() => navigate('/admin/quizzes')}>
              <span className="admin-clean-action-icon"><BiBarChartAlt2 size={16} /></span>
              <span>
                <strong>Manage Quizzes</strong>
                <small>Update and publish content</small>
              </span>
            </button>
          </div>

          <div className="admin-clean-actions-note">
            <div className="admin-clean-actions-note-text">
              <h3>Recommended flow</h3>
              <p>Draft quizzes first, then mark them ready before launching live sessions for your teams.</p>
            </div>
            <div className="admin-clean-actions-steps">
              <span>Draft</span>
              <span>Ready</span>
              <span>Live</span>
            </div>
          </div>
        </div>

        <div className="admin-clean-panel">
          <div className="admin-clean-panel-head admin-clean-panel-head-row">
            <h2><BiBookOpen size={18} /> Recent Quizzes</h2>
            <button className="admin-clean-btn-secondary" onClick={() => navigate('/admin/quizzes')}>
              View All <BiRightArrowAlt size={18} />
            </button>
          </div>

          <div className="admin-clean-recent-list">
            {recentQuizzes.length > 0 ? (
                recentQuizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  className="admin-clean-quiz-row"
                  onClick={() =>
                    canEditQuiz(quiz.id, quiz.createdByUserId)
                      ? navigate(`/admin/quizzes/${quiz.id}`)
                      : navigate('/admin/quizzes')
                  }
                >
                  <span className="admin-clean-quiz-icon"><BiBookOpen size={16} /></span>
                  <span className="admin-clean-quiz-meta-wrap">
                    <span className="admin-clean-quiz-title">{quiz.title}</span>
                    <span className="admin-clean-quiz-meta">
                      <BiTime size={12} /> {quiz.questionCount || 0} questions
                    </span>
                  </span>
                  <span className={`admin-clean-status status-${getStatusClass(quiz.status)}`}>
                    {getStatusLabel(quiz.status)}
                  </span>
                </button>
              ))
            ) : (
              <div className="admin-clean-empty">
                <div className="admin-clean-empty-icon"><BiBookOpen size={24} /></div>
                <h3>No quizzes yet</h3>
                <p>Create your first quiz to get started.</p>
                <button className="admin-clean-btn-primary" onClick={() => setShowCreateModal(true)}>
                  <BiBookOpen size={16} /> Create First Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
      {showCreateModal && <CreateQuizModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
