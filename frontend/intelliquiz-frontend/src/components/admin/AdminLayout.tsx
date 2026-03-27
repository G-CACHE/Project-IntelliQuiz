import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  BiHomeAlt,
  BiBookOpen,
  BiLogOut,
  BiChevronDown,
} from 'react-icons/bi';
import '../../styles/admin.css';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiresPermission?: string;
}

export default function AdminLayout() {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { clearAuth } = useAuth();

  // Build nav items based on user's permissions
  const navItems: NavItem[] = [
    { path: '/admin', label: 'Dashboard', icon: <BiHomeAlt size={18} /> },
    { path: '/admin/quizzes', label: 'My Quizzes', icon: <BiBookOpen size={18} /> },
  ];

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    
    if (storedUsername) setUsername(storedUsername);
    
    // Redirect super admins to their dashboard
    if (storedRole === 'SUPER_ADMIN') {
      navigate('/superadmin');
      return;
    }
    
    // Redirect unauthenticated users to login
    if (!storedRole || (storedRole !== 'ADMIN' && storedRole !== 'EXAMINER')) {
      navigate('/portal');
      return;
    }
    
    // Admin users can access their own quizzes directly (no assignment check needed)
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/portal');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '4px solid #e5e7eb',
            borderTopColor: '#880015',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#6b7280', fontFamily: "'Montserrat', sans-serif" }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fffaf2', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
      `}</style>

      {/* Top Navigation - Same as SuperAdmin */}
      <header className="pb-nav">
        <div className="pb-nav-inner">
          {/* Logo */}
          <div 
            onClick={() => navigate('/admin')}
            className="pb-nav-logo-wrap"
          >
            <div className="pb-nav-logo-icon">
              <BiBookOpen size={22} />
            </div>
            <span className="pb-nav-logo-text">IntelliQuiz</span>
          </div>

          {/* Desktop Nav */}
          <nav className="pb-nav-links">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`pb-nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                {item.icon}
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Section */}
          <div className="pb-nav-right">
            {/* Profile */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="pb-nav-profile-btn"
              >
                <div className="pb-nav-avatar">
                  {username.charAt(0).toUpperCase() || 'A'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div className="pb-nav-profile-name">{username || 'Admin'}</div>
                  <div className="pb-nav-profile-role">Admin</div>
                </div>
                <BiChevronDown size={18} className={`pb-nav-chevron ${profileDropdownOpen ? 'open' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <div className="pb-nav-dropdown">
                  <button
                    onClick={handleLogout}
                    className="pb-nav-dropdown-item"
                  >
                    <BiLogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
