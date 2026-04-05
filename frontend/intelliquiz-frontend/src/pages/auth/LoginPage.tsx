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
          grid-template-columns: 0.95fr 1.05fr;
          font-family: 'Nunito', sans-serif;
          background-image: url('/icon/design.png');
          background-color: #ffffff;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .portal-login-hero {
          background: transparent;
          color: #23121a;
          padding: 48px 54px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-end;
          gap: 18px;
          padding-top: 80px;
          padding-right: 80px;
        }

        .portal-login-hero::before {
          content: none;
        }

        .portal-login-hero::after {
          content: none;
        }

        .portal-login-brand {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: auto;
          background: #fff8df;
          border: 3px solid #131313;
          border-radius: 8px;
          padding: 8px 14px;
          position: relative;
          z-index: 1;
          box-shadow: 4px 4px 0 #131313;
          font-weight: 800;
          align-self: center;
        }

        .portal-login-title {
          margin: 0;
          margin-top: -8px;
          font-size: 48px;
          line-height: 1.06;
          font-weight: 900;
          max-width: 520px;
          position: relative;
          z-index: 1;
          color: #ffcd4d;
          text-align: right;
        }

        .portal-login-subtitle {
          margin: 0;
          color: #4b3941;
          font-size: 17px;
          max-width: 500px;
          position: relative;
          z-index: 1;
          text-align: right;
        }

        @keyframes portal-float-rocket {
          0% {
            transform: translateX(0) rotate(45deg);
          }
          50% {
            transform: translateX(12px) rotate(45deg);
          }
          100% {
            transform: translateX(0) rotate(45deg);
          }
        }

        @keyframes portal-float-symbol {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
          100% {
            transform: translateY(0);
          }
        }

        .portal-hero-rocket {
          position: absolute;
          right: 365px;
          top: 252px;
          width: 146px;
          height: auto;
          z-index: 0;
          pointer-events: none;
          opacity: 1;
          transform: rotate(50deg);
          filter: drop-shadow(4px 6px 0 rgba(17, 17, 17, 0.35));
          animation: portal-float-rocket 3.2s ease-in-out infinite;
        }

        .portal-hero-symbol-row {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        .portal-hero-question {
          position: absolute;
          right: 40px;
          bottom: 78px;
          width: 102px;
          height: auto;
          opacity: 0.95;
          transform: rotate(-8deg);
          filter: drop-shadow(3px 4px 0 rgba(17, 17, 17, 0.3));
          animation: portal-float-symbol 2.8s ease-in-out infinite;
        }

        .portal-hero-symbol {
          position: absolute;
          width: 42px;
          height: auto;
          opacity: 0.95;
          filter: drop-shadow(2px 3px 0 rgba(17, 17, 17, 0.3));
          animation: portal-float-symbol 2.6s ease-in-out infinite;
        }

        .portal-hero-symbol:nth-of-type(2) {
          left: 88px;
          top: 80px;
          animation-delay: 0.15s;
        }

        .portal-hero-symbol:nth-of-type(3) {
          right: 54px;
          top: 54px;
          animation-delay: 0.3s;
        }

        .portal-hero-symbol:nth-of-type(4) {
          right: 176px;
          bottom: 30px;
          width: 54px;
          animation-delay: 0.45s;
        }

        .portal-login-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 28px;
          margin-left: 8px;
          margin-top: 60px;
          gap: 16px;
        }

        .portal-login-card {
          width: 100%;
          max-width: 460px;
          background: #ffffff;
          border: 4px solid #111111;
          border-radius: 10px;
          padding: 28px;
          box-shadow: 10px 10px 0 #111111;
        }

        .portal-login-card h2 {
          margin: 0;
          color: #111111;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 0.02em;
        }

        .portal-login-card p {
          margin: 8px 0 0;
          color: #2f2f2f;
          font-size: 14px;
          font-weight: 700;
        }

        .portal-login-error {
          margin-top: 14px;
          border: 3px solid #111111;
          background: #ff7a7a;
          color: #1a0505;
          border-radius: 8px;
          padding: 10px 12px;
          align-self: center;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 4px 4px 0 #111111;
        }

        .portal-field {
          margin-top: 16px;
        }

        .portal-field label {
          display: block;
          margin-bottom: 7px;
          color: #161616;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .portal-input-wrap {
          position: relative;
        }

        .portal-input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #350C0C;
          z-index: 2;
          pointer-events: none;
          font-size: 18px;
        }

        .portal-input {
          width: 100%;
          box-sizing: border-box;
          border: 3px solid #111111;
          background: #ffffff;
          border-radius: 8px;
          padding: 12px 42px 12px 40px;
          font-size: 14px;
          color: #111111;
          font-family: 'Nunito', sans-serif;
          font-weight: 700;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 4px 4px 0 #111111;
        }

        .portal-input:focus {
          outline: none;
          transform: translate(-1px, -1px);
          box-shadow: 6px 6px 0 #111111;
        }

        .portal-toggle {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          border: 2px solid #111111;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          background: #ffcd4d;
          color: #111111;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 2px 2px 0 #111111;
        }

        .portal-submit {
          margin-top: 20px;
          width: 100%;
          border: 3px solid #111111;
          border-radius: 8px;
          background: #ffcd4d;
          color: #350C0C;
          font-weight: 900;
          font-size: 15px;
          padding: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 5px 5px 0 #111111;
        }

        .portal-submit:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 7px 7px 0 #111111;
        }

        .portal-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: 2px 2px 0 #111111;
        }

        .portal-note {
          margin-top: 14px;
          color: #2f2f2f;
          font-size: 12px;
          text-align: center;
          font-weight: 800;
          letter-spacing: 0.03em;
        }

        @media (max-width: 960px) {
          .portal-login-shell {
            grid-template-columns: 1fr;
          }

          .portal-login-hero {
            padding: 24px;
            align-items: flex-start;
            padding-right: 24px;
          }

          .portal-login-title {
            font-size: 34px;
            text-align: left;
          }

          .portal-login-subtitle {
            text-align: left;
          }

          .portal-hero-rocket {
            width: 110px;
            right: 24px;
            top: 34px;
          }

          .portal-hero-symbol-row {
            right: 14px;
            bottom: 14px;
            gap: 8px;
          }

          .portal-hero-question {
            width: 80px;
            right: 28px;
            bottom: 86px;
          }

          .portal-hero-symbol {
            width: 34px;
          }

          .portal-hero-symbol:nth-of-type(2) {
            left: 18px;
            top: 98px;
          }

          .portal-hero-symbol:nth-of-type(3) {
            right: 28px;
            top: 24px;
          }

          .portal-hero-symbol:nth-of-type(4) {
            right: 114px;
            bottom: 26px;
            width: 42px;
          }

          .portal-login-panel {
            padding: 20px;
            margin-left: 0;
          }
        }
      `}</style>

      <section className="portal-login-panel">
        <div className="portal-login-brand">
          <BiBrain size={18} /> IntelliQuiz Portal
        </div>
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