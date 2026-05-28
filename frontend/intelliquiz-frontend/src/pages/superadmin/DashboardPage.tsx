import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BiPlus, 
  BiRightArrowAlt, 
  BiTime, 
  BiBookOpen, 
  BiUser, 
  BiGroup, 
  BiTrophy,
  BiPlay,
  BiFile,
  BiRocket,
  BiBoltCircle,
  BiStar,
} from 'react-icons/bi';
import { quizzesApi, usersApi, type Quiz } from '../../services/api';
import './DashboardPage.css';

interface DashboardStats {
  totalQuizzes: number;
  activeQuizzes: number;
  totalAdmins: number;
  draftQuizzes: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuizzes: 0, activeQuizzes: 0, totalAdmins: 0, draftQuizzes: 0,
  });
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) setUsername(storedUsername);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [quizzes, users] = await Promise.all([
        quizzesApi.getAll(), 
        usersApi.getAll().catch(() => [])
      ]);
      setStats({
        totalQuizzes: quizzes.length,
        activeQuizzes: quizzes.filter((q) => q.status === 'ACTIVE').length,
        totalAdmins: users.filter((u) => u.role === 'ADMIN' || u.role === 'EXAMINER').length,
        draftQuizzes: quizzes.filter((q) => q.status === 'DRAFT').length,
      });
      setRecentQuizzes(quizzes.slice(0, 4));
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: Quiz['status']) => {
    const config: Record<string, { class: string }> = {
      DRAFT:    { class: 'status-draft' },
      READY:    { class: 'status-ready' },
      ACTIVE:   { class: 'status-active' },
      ARCHIVED: { class: 'status-archived' },
    };
    return config[status] || config.DRAFT;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-bounce">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-kahoot">
      {/* Hero Section */}
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
            <h1 className="hero-title">{username || 'superadmin'}</h1>
            <p className="hero-subtitle">Ready to create something amazing? Let's make learning fun!</p>
          </div>
          
          <div className="hero-right">
            <button 
              className="hero-cta" 
              onClick={() => navigate('/superadmin/users')}
              aria-label="Manage Admins"
            >
              <BiRocket size={24} />
              <span>Manage Admins</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Kahoot Style */}
      <div className="stats-row">
        <div className="stat-card-kahoot red">
          <div className="stat-card-inner">
            <div className="stat-icon-wrap">
              <BiBookOpen size={28} />
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
              <BiPlay size={28} />
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
              <BiGroup size={28} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.totalAdmins}</span>
              <span className="stat-text">Team Members</span>
            </div>
          </div>
          <div className="stat-decoration"></div>
        </div>

        <div className="stat-card-kahoot yellow">
          <div className="stat-card-inner">
            <div className="stat-icon-wrap">
              <BiFile size={28} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.draftQuizzes}</span>
              <span className="stat-text">In Progress</span>
            </div>
          </div>
          <div className="stat-decoration"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-grid">
        {/* Recent Quizzes */}
        <div className="dashboard-card quizzes-card">
          <div className="card-header-kahoot">
            <div className="card-title-wrap">
              <BiStar className="card-icon" />
              <h2>Recent Quiz Activity</h2>
            </div>
            <button className="view-all-btn" onClick={() => navigate('/superadmin/permissions')}>
              Permission Control <BiRightArrowAlt size={18} />
            </button>
          </div>
          
          <div className="quizzes-list">
            {recentQuizzes.length > 0 ? (
              recentQuizzes.map((quiz, index) => {
                const statusConfig = getStatusConfig(quiz.status);
                const colors = ['#7a1733', '#9f2346', '#d4a017', '#6f4e57'];
                return (
                  <div 
                    key={quiz.id} 
                    className="quiz-item"
                    onClick={() => navigate('/superadmin/permissions')}
                    style={{ '--accent-color': colors[index % 4] } as React.CSSProperties}
                  >
                    <div className="quiz-item-left">
                      <div className="quiz-icon" style={{ background: colors[index % 4] }}>
                        <BiBookOpen size={20} />
                      </div>
                      <div className="quiz-details">
                        <h4>{quiz.title}</h4>
                        <span className="quiz-meta">
                          <BiTime size={14} />
                          {new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className={`quiz-status ${statusConfig.class}`}>
                      {quiz.status === 'ACTIVE' ? 'LIVE' : quiz.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="empty-quizzes">
                <div className="empty-illustration">
                  <BiBookOpen size={48} />
                </div>
                <h3>No recent quiz activity</h3>
                <p>Assign admins to quizzes from permission control</p>
                <button className="create-first-btn" onClick={() => navigate('/superadmin/permissions')}>
                  <BiPlus size={20} /> Assign Permissions
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card actions-card">
          <div className="card-header-kahoot">
            <div className="card-title-wrap">
              <BiBoltCircle className="card-icon" />
              <h2>Quick Actions</h2>
            </div>
          </div>
          
          <div className="actions-grid">
            <button className="action-btn red" onClick={() => navigate('/superadmin/users')}>
              <div className="action-icon">
                <BiPlus size={24} />
              </div>
              <span>New Admin</span>
            </button>
            
            <button className="action-btn blue" onClick={() => navigate('/superadmin/users')}>
              <div className="action-icon">
                <BiUser size={24} />
              </div>
              <span>Users</span>
            </button>
            
            <button className="action-btn green" onClick={() => navigate('/superadmin/permissions')}>
              <div className="action-icon">
                <BiGroup size={24} />
              </div>
              <span>Permissions</span>
            </button>
            
            <button className="action-btn yellow" onClick={() => navigate('/superadmin/backups')}>
              <div className="action-icon">
                <BiTrophy size={24} />
              </div>
              <span>Backups</span>
            </button>
          </div>

          {/* Fun Tip */}
          <div className="fun-tip">
            <div className="tip-icon"><BiBoltCircle size={24} /></div>
            <div className="tip-content">
              <strong>Pro Tip!</strong>
              <p>Add images to your questions to make them more engaging!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
