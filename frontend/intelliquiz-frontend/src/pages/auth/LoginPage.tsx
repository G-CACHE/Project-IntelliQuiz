import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiLogIn, BiErrorCircle, BiShow, BiHide, BiUser, BiLock } from 'react-icons/bi';
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

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (err instanceof Error && err.message) {
      try {
        const parsed = JSON.parse(err.message) as { message?: string; errorMessage?: string };
        if (parsed?.message) return parsed.message;
        if (parsed?.errorMessage) return parsed.errorMessage;
      } catch {
        // Not JSON; use the raw message.
      }

      return err.message;
    }

    return fallback;
  };

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
      setError(extractErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-login-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:ital,wght@1,800;1,900&family=Montserrat:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap');

        .portal-login-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-body);
          padding: 20px;
          overflow: hidden;
          position: relative;
          background-image: url('/login-background/background.png');
          background-color: rgba(0,0,0,0);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
        }

        .portal-login-hero {
          display: none;
        }

        .portal-login-brand {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: auto;
          background: #d4b91e;
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          position: relative;
          z-index: 1;
          font-weight: 700;
          align-self: center;
          margin-bottom: 20px;
          font-size: 16px;
          color: var(--color-maroon);
        }

        .portal-login-title {
          margin: 0;
          font-size: 28px;
          line-height: 1.2;
          font-weight: 800;
          max-width: 100%;
          position: relative;
          z-index: 1;
          color: var(--color-accent);
          text-align: center;
          font-family: var(--font-heading);
        }

        .portal-login-subtitle {
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          max-width: 100%;
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .portal-hero-rocket {
          display: none;
        }

        .portal-hero-symbol-row {
          display: none;
        }

        .portal-hero-question {
          display: none;
        }

        .portal-hero-symbol {
          display: none;
        }

        .portal-login-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 480px;
          gap: 20px;
          position: relative;
          z-index: 10;
        }

        .portal-login-card {
          width: 100%;
          background: linear-gradient(180deg, rgba(122,23,51,0.12), rgba(122,23,51,0.08));
          border-radius: 32px;
          padding: 18px 40px 40px 40px ;
          box-shadow: var(--shadow-md);
          border: 1px solid rgba(122,23,51,0.12);
          backdrop-filter: blur(8px) saturate(120%);
          transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .portal-login-card h2 {
          margin: 0;
          color: #ffffff;
          font-size: 38px;
          font-weight: 800;
          letter-spacing: -0.5px;
          font-family: var(--font-heading);
          text-align: center;
        }

        .portal-login-card p {
          margin: 12px 0 0;
          color: var(--text-secondary);
          font-size: 15px;
          font-weight: 600;
          text-align: center;
        }

        .portal-login-error {
          margin-top: 16px;
          border: 2px solid #dc2626;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
        }

        .portal-field {
          margin-top: 20px;
        }

        .portal-field label {
          display: block;
          margin-bottom: 8px;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .portal-input-wrap {
          position: relative;
        }

        .portal-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-maroon);
          z-index: 2;
          pointer-events: none;
          font-size: 20px;
        }

        .portal-input {
          width: 100%;
          box-sizing: border-box;
          border: 4px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.85);
          border-radius: 16px;
          padding: 14px 16px 14px 50px;
          font-size: 16px;
          color: var(--color-maroon);
          font-family: var(--font-body);
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .portal-input::placeholder {
          color: rgba(122,23,51,0.45);
          font-weight: 500;
        }

        .portal-input:focus {
          outline: none;
          border-color: #ffd700;
          background: #ffffff;
          box-shadow: 0 0 0 6px rgba(255, 215, 0, 0.2);
          transform: translateY(-2px);
        }

        .portal-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: 2px solid #e5e7eb;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #f3f4f6;
          color: var(--color-maroon);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .portal-toggle:hover {
          background: #e5e7eb;
          border-color: var(--color-maroon);
          box-shadow: 0 0 0 3px rgba(122, 23, 51, 0.2);
        }

       

        .portal-submit {
          margin-top: 28px;
          width: 100%;
          border: none;
          border-radius: 16px;
          background: #ffd700;
          color: var(--color-maroon);
          font-weight: 800;
          font-size: 16px;
          padding: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: none;
          font-family: var(--font-heading);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .portal-submit:hover:not(:disabled) {
          background: #ffed4e;
          transform: translateY(-2px);
          box-shadow: none;
        }

        .portal-submit:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.3);
        }

        .portal-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .portal-note {
          margin-top: 16px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-align: center;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .portal-login-card {
            padding: 32px;
          }

          .portal-login-title {
            font-size: 24px;
          }
        }

        @media (max-width: 480px) {
          .portal-login-card {
            padding: 24px;
          }

          .portal-submit {
            padding: 14px;
            font-size: 15px;
            box-shadow: 0 6px 0 #e0a800;
          }
        }
      `}</style>

      <section className="portal-login-panel">
        <div className="portal-login-brand">
          IntelliQuiz Portal
        </div>
        <div className="portal-login-card">
        <h2>Sign In</h2>
        <p className="portal-login-intro">Use your assigned account credentials.</p>

        {error && (
          <div className="portal-login-error">
            <BiErrorCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <form className="portal-login-form" onSubmit={handleSubmit}>
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

      <section className="portal-login-hero">
        <img className="portal-hero-rocket" src="/icon/rocket.png" alt="" aria-hidden="true" />
        <div className="portal-hero-symbol-row" aria-hidden="true">
          <img className="portal-hero-question" src="/icon/question_mark.png" alt="" />
          <img className="portal-hero-symbol" src="/icon/multiplication_icon.png" alt="" />
          <img className="portal-hero-symbol" src="/icon/plus_icon.png" alt="" />
          <img className="portal-hero-symbol" src="/icon/trophy_icon.png" alt="" />
        </div>
        <h1 className="portal-login-title">Admin And Examiner Access</h1>
        <p className="portal-login-subtitle">
          Sign in to manage quizzes, monitor progress, and publish game-ready sessions.
        </p>
      </section>
    </div>
  );
}