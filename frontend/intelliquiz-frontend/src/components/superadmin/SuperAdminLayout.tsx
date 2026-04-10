import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Home,
  User,
  Shield,
  LogOut,
  ChevronDown,
  Database,
  BookOpen,
} from 'lucide-react';
import '../../styles/superadmin.css';
import { authApi, currentUserApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/superadmin', label: 'Dashboard', icon: <Home size={18} /> },
  { path: '/superadmin/users', label: 'Users', icon: <User size={18} /> },
  { path: '/superadmin/permissions', label: 'Permissions', icon: <Shield size={18} /> },
  { path: '/superadmin/backups', label: 'Backups', icon: <Database size={18} /> },
];

export default function SuperAdminLayout() {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { clearAuth } = useAuth();

  useEffect(() => {
    const verifySessionAndRole = async () => {
      setLoading(true);
      try {
        const me = await currentUserApi.getMe();
        localStorage.setItem('username', me.username);
        localStorage.setItem('role', me.role);
        setUsername(me.username);

        if (me.role !== 'SUPER_ADMIN') {
          if (me.role === 'ADMIN' || me.role === 'EXAMINER') {
            navigate('/admin', { replace: true });
          } else {
            clearAuth();
            navigate('/portal', { replace: true });
          }
          return;
        }
      } catch {
        clearAuth();
        navigate('/portal', { replace: true });
        return;
      } finally {
        setLoading(false);
      }
    };

    verifySessionAndRole();
  }, [navigate, clearAuth]);

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

  const isActive = (path: string) => {
    if (path === '/superadmin') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Show loading while checking role
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-off-white)', fontFamily: 'var(--font-body)' }}>
      {/* Top Navigation */}
      <header className="pb-nav">
        <div className="pb-nav-inner">
          {/* Logo */}
          <div 
            onClick={() => navigate('/superadmin')}
            className="pb-nav-logo-wrap"
          >
            <div className="pb-nav-logo-icon">
              <BookOpen size={20} />
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
                  {username.charAt(0).toUpperCase() || 'S'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div className="pb-nav-profile-name">{username || 'Super Admin'}</div>
                  <div className="pb-nav-profile-role">Super Admin</div>
                </div>
                <ChevronDown size={18} className={`pb-nav-chevron ${profileDropdownOpen ? 'open' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <div className="pb-nav-dropdown">
                  <button
                    onClick={handleLogout}
                    className="pb-nav-dropdown-item"
                  >
                    <LogOut size={18} />
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
