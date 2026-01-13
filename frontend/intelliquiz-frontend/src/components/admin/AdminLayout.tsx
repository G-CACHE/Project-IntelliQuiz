import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  BiHomeAlt,
  BiBookOpen,
  BiGroup,
  BiTrophy,
  BiLogOut,
  BiChevronDown,
  BiPlay,
} from 'react-icons/bi';
import '../../styles/admin.css';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/admin', label: 'Dashboard', icon: <BiHomeAlt size={18} /> },
  { path: '/admin/quizzes', label: 'My Quizzes', icon: <BiBookOpen size={18} /> },
  { path: '/admin/teams', label: 'Teams', icon: <BiGroup size={18} /> },
  { path: '/admin/scoreboard', label: 'Scoreboard', icon: <BiTrophy size={18} /> },
  { path: '/admin/host', label: 'Host Game', icon: <BiPlay size={18} /> },
];

export default function AdminLayout() {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) setUsername(storedUsername);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
      `}</style>

      {/* Top Navigation - Same as SuperAdmin */}
      <header style={{
        background: '#880015',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}>
          {/* Logo */}
          <div 
            onClick={() => navigate('/admin')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <div style={{
              width: 40,
              height: 40,
              background: '#f8c107',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
            }}>
              <BiBookOpen size={22} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>IntelliQuiz</span>
          </div>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  background: isActive(item.path) ? '#f8c107' : 'transparent',
                  border: 'none',
                  borderRadius: 25,
                  color: isActive(item.path) ? '#000' : 'rgba(255,255,255,0.85)',
                  fontSize: 14,
                  fontWeight: isActive(item.path) ? 600 : 500,
                  fontFamily: "'Montserrat', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.icon}
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Profile */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  background: '#f8c107',
                  color: '#000',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}>
                  {username.charAt(0).toUpperCase() || 'A'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{username || 'Admin'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Admin</div>
                </div>
                <BiChevronDown size={18} style={{
                  color: 'rgba(255,255,255,0.6)',
                  transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s',
                }} />
              </button>

              {profileDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: 180,
                  background: '#fff',
                  borderRadius: 12,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  zIndex: 50,
                }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: 14,
                      background: 'transparent',
                      border: 'none',
                      color: '#880015',
                      fontSize: 14,
                      fontFamily: "'Montserrat', sans-serif",
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
