import { useNavigate } from 'react-router-dom';
import { BiLock, BiLogOut, BiRefresh } from 'react-icons/bi';
import { currentUserApi } from '../../services/api';
import { useState } from 'react';

export default function NoPermissionsPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const username = localStorage.getItem('username') || 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('assignments');
    navigate('/login');
  };

  const handleCheckPermissions = async () => {
    setChecking(true);
    try {
      const assignments = await currentUserApi.getMyAssignments();
      localStorage.setItem('assignments', JSON.stringify(assignments));
      
      if (assignments.length > 0) {
        navigate('/admin');
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Montserrat', sans-serif",
      padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
      `}</style>

      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: 48,
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          width: 80,
          height: 80,
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <BiLock size={40} color="#92400e" />
        </div>

        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#1a1a2e',
          marginBottom: 12,
        }}>
          Welcome, {username}!
        </h1>

        <p style={{
          fontSize: 16,
          color: '#6b7280',
          lineHeight: 1.6,
          marginBottom: 32,
        }}>
          Your account has been created, but you don't have any quiz permissions yet. 
          Please wait for a Super Admin to assign quizzes and permissions to your account.
        </p>

        <div style={{
          background: '#f8fafc',
          borderRadius: 16,
          padding: 20,
          marginBottom: 32,
        }}>
          <p style={{
            fontSize: 14,
            color: '#64748b',
            margin: 0,
          }}>
            Once permissions are assigned, you'll be able to:
          </p>
          <ul style={{
            textAlign: 'left',
            margin: '16px 0 0 0',
            padding: '0 0 0 20px',
            color: '#475569',
            fontSize: 14,
            lineHeight: 1.8,
          }}>
            <li>View assigned quizzes</li>
            <li>Manage quiz content</li>
            <li>Register and manage teams</li>
            <li>Host live quiz sessions</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleCheckPermissions}
            disabled={checking}
            style={{
              flex: 1,
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #f8c107, #e6b006)',
              border: 'none',
              borderRadius: 12,
              color: '#1a1a2e',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Montserrat', sans-serif",
              cursor: checking ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: checking ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            <BiRefresh size={20} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
            {checking ? 'Checking...' : 'Check Again'}
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: '14px 20px',
              background: '#fff',
              border: '2px solid #e5e7eb',
              borderRadius: 12,
              color: '#6b7280',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "'Montserrat', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <BiLogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
