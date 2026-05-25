import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiLogIn, BiErrorCircle, BiShow, BiHide, BiUser, BiLock } from 'react-icons/bi';
import { 
  GiTrophyCup, 
  GiGamepad, 
  GiBrain, 
  GiRocket, 
  GiCheckeredFlag, 
  GiJeweledChalice,
  GiStarShuriken,
  GiCrownedHeart
} from 'react-icons/gi';
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
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          font-family: var(--font-body);
          overflow: hidden;
          position: fixed;
          top: 0;
          left: 0;
          background-image: url('/login-background/background.png');
          background-color:   #870016;
          background-size: 100% 100%;
          background-position: center center;
          background-repeat: no-repeat;
        }

        /* ── Left panel: form ── */
        .portal-login-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 480px;
          min-width: 380px;
          height: 100vh;
          padding: 40px 48px;
          box-sizing: border-box;
          position: relative;
          z-index: 10;
          flex-shrink: 0;
          margin-left: 80px;
        }

        .portal-login-card {
          width: 100%;
          background: transparent;
          border-radius: 32px;
          padding: 0;
          box-shadow: none;
          border: none;
          backdrop-filter: none;
        }

        .portal-login-card h2 {
          margin: 0;
          color: var(--color-maroon);
          font-size: 38px;
          font-weight: 800;
          letter-spacing: -0.5px;
          font-family: var(--font-heading);
          text-align: center;
        }

        .portal-login-card p {
          margin: 12px 0 0;
          color: rgba(122,23,51,0.8);
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
          color: var(--color-maroon);
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
          border: 1px solid #c9c9c9;
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
          background: rgba(135, 0, 22, 0.9);
          color: #ffffff;
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
          background: rgba(135, 0, 22, 0.8);
          transform: translateY(-2px);
        }

        .portal-submit:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(122, 23, 51, 0.3);
        }

        .portal-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .portal-note {
          margin-top: 16px;
          color: rgba(122,23,51,0.65);
          font-size: 12px;
          text-align: center;
          font-weight: 600;
        }

        /* ── Right side: floating icons ── */
        .portal-floating-icons {
          position: absolute;
          top: 0;
          left: 560px;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 5;
          overflow: hidden;
        }

        .portal-floating-icon {
          position: absolute;
          color: rgba(255, 255, 255, 0.08);
          animation: portal-float infinite ease-in-out;
          filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.06));
        }

        /* Icons use left/right relative to the .portal-floating-icons container (right half only).
           Positions are spread into a loose 3-column grid so no two icons are close. */
        .p-icon-1  { width: 100px; height: 100px; top:  4%;  left:  5%;  animation-duration: 20s; animation-delay:   0s; }
        .p-icon-2  { width: 110px; height: 110px; top:  6%;  left: 45%;  animation-duration: 26s; animation-delay:  -4s; }
        .p-icon-3  { width: 120px; height: 120px; top:  8%;  right: 4%;  animation-duration: 23s; animation-delay:  -9s; }
        .p-icon-4  { width: 105px; height: 105px; top: 36%;  left: %;  animation-duration: 29s; animation-delay:  -6s; }
        .p-icon-5  { width: 115px; height: 115px; top: 40%;  left: 42%;  animation-duration: 19s; animation-delay: -14s; }
        .p-icon-6  { width: 100px; height: 100px; top: 38%;  right: 5%;  animation-duration: 25s; animation-delay:  -2s; }
        .p-icon-7  { width: 110px; height: 110px; top: 72%;  left: 22%;  animation-duration: 22s; animation-delay: -11s; }
        .p-icon-8  { width: 120px; height: 120px; top: 70%;  left: 44%;  animation-duration: 31s; animation-delay:  -7s; }
        .p-icon-9  { width: 105px; height: 105px; top: 74%;  right: 4%;  animation-duration: 18s; animation-delay:  -3s; }
        .p-icon-10 { width: 100px; height: 100px; top: 20%;  left: 22%;  animation-duration: 27s; animation-delay: -16s; }

        @keyframes portal-float {
          0%,  100% { transform: translateY(0)    rotate(0deg)   scale(1);    }
          33%        { transform: translateY(-28px) rotate(14deg)  scale(1.05); }
          66%        { transform: translateY(14px)  rotate(-10deg) scale(0.95); }
        }

        /* ── Responsive — form position stays consistent across all displays ── */

        /* Large desktops & Full HD (1920x1080+) */
        @media (min-width: 1920px) {
          .portal-login-panel {
            width: 480px;
            margin-left: 80px;
          }
          .portal-floating-icons {
            left: 560px;
          }
        }

        /* Standard desktops & laptops (1280px – 1919px) */
        @media (min-width: 1280px) and (max-width: 1919px) {
          .portal-login-panel {
            width: 480px;
            margin-left: 80px;
          }
          .portal-floating-icons {
            left: 560px;
          }
        }

        /* Small laptops & large tablets (1024px – 1279px) */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .portal-login-panel {
            width: 440px;
            margin-left: 60px;
          }
          .portal-floating-icons {
            left: 500px;
          }
        }

        /* Tablets (901px – 1023px) */
        @media (min-width: 901px) and (max-width: 1023px) {
          .portal-login-panel {
            width: 420px;
            margin-left: 40px;
          }
          .portal-floating-icons {
            left: 460px;
          }
        }

        /* Small tablets & large phones (≤ 900px) — center the form */
        @media (max-width: 900px) {
          .portal-login-shell {
            justify-content: center;
          }
          .portal-login-panel {
            width: 100%;
            max-width: 480px;
            min-width: unset;
            margin-left: 0;
            padding: 32px 24px;
          }
          .portal-floating-icons {
            left: 0;
          }
        }

        /* Phones (≤ 480px) */
        @media (max-width: 480px) {
          .portal-login-panel {
            padding: 24px 16px;
          }
          .portal-submit {
            padding: 14px;
            font-size: 15px;
          }
        }
      `}</style>

      {/* Floating icons on the right half */}
      <div className="portal-floating-icons" aria-hidden="true">
        <GiTrophyCup    className="portal-floating-icon p-icon-1"  />
        <GiGamepad      className="portal-floating-icon p-icon-2"  />
        <GiBrain        className="portal-floating-icon p-icon-3"  />
        <GiRocket       className="portal-floating-icon p-icon-4"  />
        <GiCheckeredFlag className="portal-floating-icon p-icon-5" />
        <GiJeweledChalice className="portal-floating-icon p-icon-6"/>
        <GiStarShuriken className="portal-floating-icon p-icon-7"  />
        <GiCrownedHeart className="portal-floating-icon p-icon-8"  />
        <GiBrain        className="portal-floating-icon p-icon-9"  />
        <GiGamepad      className="portal-floating-icon p-icon-10" />
      </div>

      {/* Form on the left */}
      <section className="portal-login-panel">
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
    </div>
  );
}
