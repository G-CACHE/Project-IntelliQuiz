import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiBookOpen,
  BiGroup,
  BiPlay,
  BiRightArrowAlt,
  BiTime,
  BiRocket,
  BiTrophy,
  BiTargetLock,
} from 'react-icons/bi';
import { useQuizzes } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin.css';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { assignments, canEditQuiz } = useAuth();
  const username = localStorage.getItem('username') || 'Admin';
  
  // React Query hook
  const { data: allQuizzes = [], isLoading } = useQuizzes();

  // Filter quizzes to only show assigned quizzes
  const quizzes = useMemo(() => {
    const assignedQuizIds = assignments.map(a => a.quizId);
    return allQuizzes.filter(q => assignedQuizIds.includes(q.id));
  }, [allQuizzes, assignments]);

  const stats = useMemo(() => ({
    totalQuizzes: quizzes.length,
    activeQuizzes: quizzes.filter(q => q.status === 'ACTIVE').length,
    readyQuizzes: quizzes.filter(q => q.status === 'READY').length,
    totalTeams: 0,
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
    <div>
      {/* Welcome Header */}
      <div className="admin-page-header purple">
        <div className="admin-page-header-bg">
          <div className="admin-page-header-shape shape-1" />
          <div className="admin-page-header-shape shape-2" />
          <div className="admin-page-header-dots" />
        </div>
        <div className="admin-page-header-content">
          <div className="admin-page-header-left">
            <div className="admin-page-icon"><BiRocket size={26} /></div>
            <div>
              <h1 className="admin-page-title">Welcome back, {username}!</h1>
              <p className="admin-page-subtitle">Here's what's happening with your quizzes</p>
            </div>
          </div>

        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-grid-4" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card red">
          <div className="admin-stat-icon red"><BiBookOpen size={24} /></div>
          <p className="admin-stat-value">{stats.totalQuizzes}</p>
          <p className="admin-stat-label">Total Quizzes</p>
        </div>
        <div className="admin-stat-card yellow">
          <div className="admin-stat-icon yellow"><BiTargetLock size={24} /></div>
          <p className="admin-stat-value">{stats.readyQuizzes}</p>
          <p className="admin-stat-label">Ready to Play</p>
        </div>
        <div className="admin-stat-card green">
          <div className="admin-stat-icon green"><BiPlay size={24} /></div>
          <p className="admin-stat-value">{stats.activeQuizzes}</p>
          <p className="admin-stat-label">Live Now</p>
        </div>
        <div className="admin-stat-card blue">
          <div className="admin-stat-icon blue"><BiGroup size={24} /></div>
          <p className="admin-stat-value">{stats.totalTeams}</p>
          <p className="admin-stat-label">Teams</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="admin-grid-2">
        {/* Quick Actions */}
        <div className="admin-card">
          <h2 className="admin-card-title"><BiRocket size={18} /> Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="admin-quick-action" onClick={() => navigate('/admin/host')}>
              <div className="admin-quick-action-icon green"><BiPlay size={20} /></div>
              <div className="admin-quick-action-text">
                <p className="admin-quick-action-title">Host a Game</p>
                <p className="admin-quick-action-desc">Start a live quiz session</p>
              </div>
              <BiRightArrowAlt size={18} style={{ color: '#94a3b8' }} />
            </div>
            <div className="admin-quick-action" onClick={() => navigate('/admin/teams')}>
              <div className="admin-quick-action-icon yellow"><BiGroup size={20} /></div>
              <div className="admin-quick-action-text">
                <p className="admin-quick-action-title">Manage Teams</p>
                <p className="admin-quick-action-desc">View and manage quiz teams</p>
              </div>
              <BiRightArrowAlt size={18} style={{ color: '#94a3b8' }} />
            </div>
            <div className="admin-quick-action" onClick={() => navigate('/admin/scoreboard')}>
              <div className="admin-quick-action-icon blue"><BiTrophy size={20} /></div>
              <div className="admin-quick-action-text">
                <p className="admin-quick-action-title">View Scoreboard</p>
                <p className="admin-quick-action-desc">Check quiz rankings</p>
              </div>
              <BiRightArrowAlt size={18} style={{ color: '#94a3b8' }} />
            </div>
          </div>
        </div>

        {/* Recent Quizzes */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="admin-card-title" style={{ margin: 0 }}><BiBookOpen size={18} /> Recent Quizzes</h2>
            <button 
              className="admin-btn admin-btn-secondary" 
              style={{ padding: '8px 14px', fontSize: 12 }}
              onClick={() => navigate('/admin/quizzes')}
            >
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentQuizzes.length > 0 ? (
              recentQuizzes.map((quiz) => (
                <div 
                  key={quiz.id} 
                  className="admin-recent-item"
                  onClick={() => canEditQuiz(quiz.id) ? navigate(`/admin/quizzes/${quiz.id}/questions`) : navigate('/admin/quizzes')}
                >
                  <div className="admin-recent-item-left">
                    <div className="admin-recent-item-icon"><BiBookOpen size={16} /></div>
                    <div>
                      <p className="admin-recent-item-title">{quiz.title}</p>
                      <p className="admin-recent-item-meta">
                        <BiTime size={12} style={{ marginRight: 4 }} />
                        {quiz.questionCount || 0} questions
                      </p>
                    </div>
                  </div>
                  <span className={`admin-badge-status ${getStatusClass(quiz.status)}`}>{quiz.status}</span>
                </div>
              ))
            ) : (
              <div className="admin-empty-state" style={{ padding: 32 }}>
                <div className="admin-empty-icon" style={{ width: 56, height: 56 }}><BiBookOpen size={24} /></div>
                <p className="admin-empty-title" style={{ fontSize: 15 }}>No quizzes yet</p>
                <p className="admin-empty-text" style={{ marginBottom: 16 }}>
                  No quizzes have been assigned to you yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
