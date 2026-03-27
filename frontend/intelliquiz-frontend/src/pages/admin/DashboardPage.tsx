import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiBookOpen,
  BiRightArrowAlt,
  BiTime,
  BiRocket,
  BiTargetLock,
} from 'react-icons/bi';
import { useQuizzes } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin.css';

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
      <div className="admin-grid-3" style={{ marginBottom: 24 }}>
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
          <div className="admin-stat-icon green"><BiTargetLock size={24} /></div>
          <p className="admin-stat-value">{stats.activeQuizzes}</p>
          <p className="admin-stat-label">Live Now</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="admin-grid-2">
        {/* Quick Actions */}
        <div className="admin-card">
          <h2 className="admin-card-title"><BiRocket size={18} /> Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="admin-quick-action" onClick={() => navigate('/admin/quizzes')} style={{ background: 'linear-gradient(135deg, #e21b3c 0%, #ff6b6b 100%)', color: '#fff' }}>
              <div className="admin-quick-action-icon red" style={{ background: 'rgba(255,255,255,0.2)' }}><BiBookOpen size={20} style={{ color: '#fff' }} /></div>
              <div className="admin-quick-action-text">
                <p className="admin-quick-action-title" style={{ color: '#fff' }}>Create New Quiz</p>
                <p className="admin-quick-action-desc" style={{ color: 'rgba(255,255,255,0.8)' }}>Build your own quiz</p>
              </div>
              <BiRightArrowAlt size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </div>
            <div className="admin-quick-action" onClick={() => navigate('/admin/quizzes')}>
              <div className="admin-quick-action-icon yellow"><BiTargetLock size={20} /></div>
              <div className="admin-quick-action-text">
                <p className="admin-quick-action-title">Review Quiz Status</p>
                <p className="admin-quick-action-desc">Open quiz workspaces and monitor lifecycle state</p>
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
                  onClick={() => canEditQuiz(quiz.id, quiz.createdByUserId) ? navigate(`/admin/quizzes/${quiz.id}/questions`) : navigate('/admin/quizzes')}
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
                  Click "Create New Quiz" to build your first quiz
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
