import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiLogIn, BiErrorCircle, BiShow, BiHide, BiBrain, BiUser, BiLock } from 'react-icons/bi';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return setError('Username is required');
    if (!password.trim()) return setError('Password is required');

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(username, password);
      await refreshAuth();

      if (response.role === 'SUPER_ADMIN') {
        navigate('/superadmin');
      } else if (response.role === 'ADMIN' || response.role === 'EXAMINER') {
        const assignments = JSON.parse(localStorage.getItem('assignments') || '[]') as unknown[];
        navigate(assignments.length === 0 ? '/admin/no-permissions' : '/admin');
      } else {
        setError('Invalid role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-login-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

        .portal-login-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          font-family: 'Nunito', sans-serif;
          background: linear-gradient(135deg, #fffaf2 0%, #fdf4df 100%);
        }

        .portal-login-hero {
          background: linear-gradient(125deg, #5f1027 0%, #7a1733 58%, #9f2346 100%);
          color: #fff;
          padding: 48px 54px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 18px;
        }

        .portal-login-hero::before {
          content: '';
          position: absolute;
          right: -120px;
          top: -140px;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: rgba(250, 237, 192, 0.17);
        }

        .portal-login-hero::after {
          content: '';
          position: absolute;
          left: -70px;
          bottom: -100px;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
        }

        .portal-login-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          width: fit-content;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 999px;
          padding: 8px 14px;
          position: relative;
          z-index: 1;
        }

        .portal-login-title {
          margin: 0;
          font-size: 48px;
          line-height: 1.06;
          font-weight: 900;
          max-width: 520px;
          position: relative;
          z-index: 1;
        }

        .portal-login-subtitle {
          margin: 0;
          color: rgba(255, 255, 255, 0.88);
          font-size: 17px;
          max-width: 500px;
          position: relative;
          z-index: 1;
        }

        .portal-login-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
        }

        .portal-login-card {
          width: 100%;
          max-width: 460px;
          background: #ffffff;
          border: 1px solid #e7d8dc;
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 20px 40px rgba(95, 16, 39, 0.14);
        }

        .portal-login-card h2 {
          margin: 0;
          color: #241015;
          font-size: 28px;
          font-weight: 900;
        }

        .portal-login-card p {
          margin: 8px 0 0;
          color: #6f4e57;
          font-size: 14px;
        }

        .portal-login-error {
          margin-top: 14px;
          border: 1px solid #f4c8d4;
          background: #fff2f6;
          color: #9f2346;
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
        }

        .portal-field {
          margin-top: 16px;
        }

        .portal-field label {
          display: block;
          margin-bottom: 7px;
          color: #5d3a43;
          font-size: 13px;
          font-weight: 700;
        }

        .portal-input-wrap {
          position: relative;
        }

        .portal-input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #8b6a74;
        }

        .portal-input {
          width: 100%;
          box-sizing: border-box;
          border: 2px solid #e7d8dc;
          background: #fffcf7;
          border-radius: 12px;
          padding: 12px 42px 12px 40px;
          font-size: 14px;
          color: #241015;
          font-family: 'Nunito', sans-serif;
          transition: all 0.2s ease;
        }

        .portal-input:focus {
          outline: none;
          border-color: #9f2346;
          box-shadow: 0 0 0 3px rgba(159, 35, 70, 0.14);
        }

        .portal-toggle {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: transparent;
          color: #7a1733;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .portal-submit {
          margin-top: 20px;
          width: 100%;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #d4a017 0%, #f2c84b 100%);
          color: #2b1a00;
          font-weight: 900;
          font-size: 15px;
          padding: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .portal-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(212, 160, 23, 0.35);
        }

        .portal-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .portal-note {
          margin-top: 14px;
          color: #8b6a74;
          font-size: 12px;
          text-align: center;
          font-weight: 700;
        }

        @media (max-width: 960px) {
          .portal-login-shell {
            grid-template-columns: 1fr;
          }

          .portal-login-hero {
            padding: 24px;
          }

          .portal-login-title {
            font-size: 34px;
          }

          .portal-login-panel {
            padding: 20px;
          }
        }
      `}</style>

      <section className="portal-login-hero">
        <div className="portal-login-brand">
          <BiBrain size={18} /> IntelliQuiz Portal
        </div>
        <h1 className="portal-login-title">Admin And Examiner Access</h1>
        <p className="portal-login-subtitle">
          Sign in to manage quizzes, monitor progress, and publish game-ready sessions.
        </p>
      </section>

      <section className="portal-login-panel">
        <div className="portal-login-card">
          <h2>Sign In</h2>
          <p>Use your assigned account credentials.</p>

          {error && (
            <div className="portal-login-error">
              <BiErrorCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="portal-field">
              <label htmlFor="username">Username</label>
              <div className="portal-input-wrap">
                <BiUser size={16} className="portal-input-icon" />
                <input
                  id="username"
                  className="portal-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="portal-field">
              <label htmlFor="password">Password</label>
              <div className="portal-input-wrap">
                <BiLock size={16} className="portal-input-icon" />
                <input
                  id="password"
                  className="portal-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="portal-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <BiHide size={16} /> : <BiShow size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="portal-submit" disabled={loading}>
              {loading ? 'Signing In...' : (<><BiLogIn size={18} /> Sign In</>)}
            </button>
          </form>

          <p className="portal-note">IntelliQuiz v1.0.0</p>
        </div>
      </section>
    </div>
  );
}
