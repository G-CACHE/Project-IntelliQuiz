import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiLogIn, BiErrorCircle, BiShow, BiHide, BiBrain, BiUser, BiLock } from 'react-icons/bi';
import { authApi, currentUserApi } from '../../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return setError('Username is required');
    if (!password.trim()) return setError('Password is required');

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(username, password);
      // Clear all previous auth data before setting new values
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('assignments');
      
      // Set new auth data
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', username);
      localStorage.setItem('role', response.role);

      if (response.role === 'SUPER_ADMIN') {
        navigate('/superadmin');
      } else if (response.role === 'ADMIN') {
        // Fetch assignments to check if admin has any permissions
        try {
          const assignments = await currentUserApi.getMyAssignments();
          localStorage.setItem('assignments', JSON.stringify(assignments));
          
          if (assignments.length === 0) {
            // No permissions assigned yet - redirect to waiting page
            navigate('/admin/no-permissions');
          } else {
            navigate('/admin');
          }
        } catch {
          // If fetching assignments fails, still allow login but show no permissions
          localStorage.setItem('assignments', JSON.stringify([]));
          navigate('/admin/no-permissions');
        }
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
    <div className="login-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .login-container {
          min-height: 100vh;
          display: flex;
          font-family: 'Montserrat', sans-serif;
          overflow: hidden;
        }
        
        /* Left Side - Animated Background */
        .login-hero {
          flex: 1;
          background: linear-gradient(135deg, #880015 0%, #6b0012 50%, #4a000d 100%);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          overflow: hidden;
        }
        
        /* Floating Shapes Animation */
        .shape {
          position: absolute;
          animation: float 25s infinite ease-in-out;
        }
        
        /* Question mark shape */
        .shape-1 {
          width: 80px;
          height: 80px;
          top: 10%;
          right: 15%;
          animation-delay: 0s;
          font-size: 60px;
          font-weight: 900;
          color: rgba(248, 193, 7, 0.15);
          font-family: 'Montserrat', sans-serif;
        }
        .shape-1::before { content: '?'; }
        
        /* Answer option box A */
        .shape-2 {
          width: 50px;
          height: 50px;
          background: rgba(226, 27, 60, 0.15);
          bottom: 20%;
          left: 8%;
          animation-delay: -5s;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 24px;
          color: rgba(226, 27, 60, 0.4);
        }
        .shape-2::before { content: 'A'; }
        
        /* Answer option box B */
        .shape-3 {
          width: 45px;
          height: 45px;
          background: rgba(19, 104, 206, 0.15);
          top: 35%;
          left: 5%;
          animation-delay: -10s;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 22px;
          color: rgba(19, 104, 206, 0.4);
        }
        .shape-3::before { content: 'B'; }
        
        /* Checkmark circle */
        .shape-4 {
          width: 55px;
          height: 55px;
          background: rgba(38, 137, 12, 0.12);
          bottom: 35%;
          right: 8%;
          animation-delay: -15s;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: rgba(38, 137, 12, 0.4);
        }
        .shape-4::before { content: '✓'; }
        
        /* Quiz-themed floating elements */
        .floating-icon {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: floatIcon 18s infinite ease-in-out;
        }
        
        /* Small question mark */
        .icon-1 { 
          top: 60%; 
          left: 12%; 
          animation-delay: 0s; 
          font-size: 32px;
          font-weight: 900;
          color: rgba(248, 193, 7, 0.2);
        }
        .icon-1::before { content: '?'; }
        
        /* Answer option C */
        .icon-2 { 
          top: 15%; 
          right: 25%; 
          animation-delay: -3s; 
          width: 36px; 
          height: 36px;
          background: rgba(255, 166, 2, 0.12);
          border-radius: 8px;
          font-weight: 800;
          font-size: 18px;
          color: rgba(255, 166, 2, 0.5);
        }
        .icon-2::before { content: 'C'; }
        
        /* Star/points */
        .icon-3 { 
          bottom: 12%; 
          left: 25%; 
          animation-delay: -6s; 
          font-size: 28px;
          color: rgba(248, 193, 7, 0.25);
        }
        .icon-3::before { content: '★'; }
        
        /* Answer option D */
        .icon-4 { 
          bottom: 45%; 
          right: 5%; 
          animation-delay: -9s; 
          width: 40px; 
          height: 40px;
          background: rgba(38, 137, 12, 0.1);
          border-radius: 8px;
          font-weight: 800;
          font-size: 20px;
          color: rgba(38, 137, 12, 0.4);
        }
        .icon-4::before { content: 'D'; }
        
        /* Trophy */
        .icon-5 { 
          top: 70%; 
          right: 20%; 
          animation-delay: -12s; 
          font-size: 30px;
          color: rgba(248, 193, 7, 0.2);
        }
        .icon-5::before { content: '🏆'; }
        
        /* Additional quiz elements */
        .quiz-element {
          position: absolute;
          animation: floatIcon 20s infinite ease-in-out;
        }
        
        /* Lightbulb idea */
        .quiz-element-1 {
          top: 25%;
          left: 18%;
          font-size: 26px;
          color: rgba(248, 193, 7, 0.18);
          animation-delay: -2s;
        }
        .quiz-element-1::before { content: '💡'; }
        
        /* Target/bullseye */
        .quiz-element-2 {
          bottom: 55%;
          left: 3%;
          font-size: 24px;
          color: rgba(226, 27, 60, 0.15);
          animation-delay: -8s;
        }
        .quiz-element-2::before { content: '🎯'; }
        
        /* 100 points badge */
        .quiz-element-3 {
          top: 45%;
          right: 3%;
          width: 44px;
          height: 28px;
          background: rgba(248, 193, 7, 0.15);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: rgba(248, 193, 7, 0.5);
          animation-delay: -14s;
        }
        .quiz-element-3::before { content: '+100'; }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(30px, -30px) rotate(5deg); }
          50% { transform: translate(-20px, 20px) rotate(-5deg); }
          75% { transform: translate(20px, 30px) rotate(3deg); }
        }
        
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.25; }
          50% { transform: translateY(-20px) rotate(10deg); opacity: 0.4; }
        }
        
        .hero-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
          max-width: 450px;
        }
        
        .hero-logo {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 48px;
          padding: 16px 32px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .hero-logo-icon {
          width: 56px;
          height: 56px;
          background: #f8c107;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #880015;
          box-shadow: 0 8px 32px rgba(248, 193, 7, 0.3);
          flex-shrink: 0;
        }
        
        .hero-logo-text {
          text-align: left;
        }
        
        .hero-logo-text h1 {
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
          margin: 0;
        }
        
        .hero-logo-text span {
          font-size: 11px;
          color: #f8c107;
          text-transform: uppercase;
          letter-spacing: 3px;
          font-weight: 600;
        }
        
        .hero-title {
          font-size: 44px;
          font-weight: 900;
          color: #fff;
          line-height: 1.2;
          margin: 0 0 28px 0;
          text-shadow: 0 4px 30px rgba(0,0,0,0.3);
        }
        
        .hero-title .highlight {
          color: #f8c107;
          display: block;
        }
        
        .hero-subtitle {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.7;
          margin: 0;
          padding: 0 20px;
        }
        
        /* Decorative dots */
        .dots {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 36px;
        }
        
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        .dot:nth-child(1) { background: #f8c107; animation-delay: 0s; }
        .dot:nth-child(2) { background: #fff; animation-delay: 0.2s; }
        .dot:nth-child(3) { background: #f8c107; animation-delay: 0.4s; }
        .dot:nth-child(4) { background: #fff; animation-delay: 0.6s; }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        
        /* Right Side - Form */
        .login-form-side {
          width: 520px;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 50px;
          position: relative;
        }
        
        .form-header {
          margin-bottom: 32px;
        }
        
        .form-header h2 {
          font-size: 32px;
          font-weight: 800;
          color: #1a1a2e;
          margin-bottom: 8px;
        }
        
        .form-header p {
          font-size: 15px;
          color: #6b7280;
        }
        
        .login-error {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          border-left: 4px solid #dc2626;
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #991b1b;
          font-size: 14px;
          font-weight: 500;
          animation: shake 0.5s ease;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .form-group {
          margin-bottom: 24px;
        }
        
        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #880015;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        .form-input {
          width: 100%;
          padding: 16px 20px;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 14px;
          color: #1a1a2e;
          font-size: 16px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #880015;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(136, 0, 21, 0.1);
        }
        
        .form-input::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }
        
        /* Hide native browser password toggle */
        .form-input::-ms-reveal,
        .form-input::-ms-clear {
          display: none;
        }
        
        input[type="password"]::-webkit-credentials-auto-fill-button,
        input[type="password"]::-webkit-clear-button {
          display: none !important;
        }
        
        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          display: flex;
          transition: color 0.2s;
        }
        
        .password-toggle:hover {
          color: #880015;
        }
        
        .login-btn {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #f8c107 0%, #e6b006 100%);
          border: none;
          border-radius: 14px;
          color: #1a1a2e;
          font-size: 17px;
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(248, 193, 7, 0.4);
          margin-top: 8px;
        }
        
        .login-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(248, 193, 7, 0.5);
        }
        
        .login-btn:active:not(:disabled) {
          transform: translateY(-1px);
        }
        
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .login-spinner {
          width: 22px;
          height: 22px;
          border: 3px solid rgba(26, 26, 46, 0.2);
          border-top-color: #1a1a2e;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Quick Access Section */
        .quick-access {
          margin-top: 36px;
          padding-top: 28px;
          border-top: 2px dashed #e9ecef;
        }
        
        .quick-access-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        
        .quick-access-title {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a2e;
        }
        
        .quick-access-badge {
          background: linear-gradient(135deg, #880015, #6b0012);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .demo-accounts {
          display: flex;
          gap: 12px;
        }
        
        .demo-account {
          flex: 1;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }
        
        .demo-account:hover {
          border-color: #880015;
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(136, 0, 21, 0.1);
        }
        
        .demo-account-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 12px;
          background: linear-gradient(135deg, #880015, #f8c107);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 16px;
        }
        
        .demo-account h4 {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 4px;
        }
        
        .demo-account p {
          font-size: 12px;
          color: #6b7280;
          font-family: 'Courier New', monospace;
        }
        
        .login-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
        
        @media (max-width: 1024px) {
          .login-hero { display: none; }
          .login-form-side { width: 100%; max-width: 480px; margin: 0 auto; }
        }
      `}</style>

      {/* Left Hero Section */}
      <div className="login-hero">
        {/* Quiz-themed Shapes */}
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        
        {/* Floating Quiz Elements */}
        <div className="floating-icon icon-1"></div>
        <div className="floating-icon icon-2"></div>
        <div className="floating-icon icon-3"></div>
        <div className="floating-icon icon-4"></div>
        <div className="floating-icon icon-5"></div>
        
        {/* Additional Quiz Elements */}
        <div className="quiz-element quiz-element-1"></div>
        <div className="quiz-element quiz-element-2"></div>
        <div className="quiz-element quiz-element-3"></div>

        <div className="hero-content">
          <div className="hero-logo">
            <div className="hero-logo-icon">
              <BiBrain size={28} />
            </div>
            <div className="hero-logo-text">
              <h1>IntelliQuiz</h1>
            </div>
          </div>
          
          <h2 className="hero-title">
            PUP Quiz System
            <span className="highlight">Fun & Interactive!</span>
          </h2>
          
          <p className="hero-subtitle">
            Create engaging quizzes, manage teams, and track scores in real-time with our powerful admin dashboard.
          </p>
          
          <div className="dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="login-form-side">
        <div className="form-header">
          <h2>Welcome Back</h2>
          <p>Sign in to access your admin dashboard</p>
        </div>

        {error && (
          <div className="login-error">
            <BiErrorCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <BiUser size={16} /> Username
            </label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <BiLock size={16} /> Password
            </label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ paddingRight: 50 }}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <BiHide size={22} /> : <BiShow size={22} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <div className="login-spinner" /> : <><BiLogIn size={22} /> Sign In</>}
          </button>
        </form>



        <div className="login-footer">
          IntelliQuiz v1.0.0 • Admin Portal
        </div>
      </div>
    </div>
  );
}
