import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accessApi } from '../../services/api';
import { saveProctorSession } from '../../services/sessionStorage';
import '../../styles/proctor.css';

const ProctorLogin: React.FC = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and remove non-alphanumeric characters
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setPin(value);
    setError(null);
  };

  const validatePin = (): boolean => {
    if (!pin.trim()) {
      setError('Please enter a proctor PIN');
      return false;
    }
    if (pin.trim().length < 4) {
      setError('PIN must be at least 4 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePin()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await accessApi.resolveCode(pin.trim());
      
      if (result.routeType === 'HOST' && result.quiz) {
        // Save session and navigate to lobby
        saveProctorSession(
          result.quiz.id,
          result.quiz.title,
          result.quiz.proctorPin
        );
        navigate(`/host/lobby`);
      } else if (result.routeType === 'INVALID') {
        setError(result.errorMessage || 'Invalid proctor PIN. Please try again.');
      } else {
        setError('This code is not a proctor PIN. Please use the participant login.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="proctor-page">
      {/* Page Header */}
      <div className="proctor-page-header">
        <div className="proctor-header-decoration proctor-header-decoration-1"></div>
        <div className="proctor-header-decoration proctor-header-decoration-2"></div>
        <h1 className="proctor-page-title">IntelliQuiz</h1>
        <p className="proctor-page-subtitle">Proctor Portal</p>
      </div>

      {/* Login Card */}
      <div className="proctor-login-container">
        <div className="proctor-card">
          <h2 className="proctor-card-title">Proctor Login</h2>
          <p className="proctor-card-subtitle">
            Enter your proctor PIN to host the quiz
          </p>

          <form onSubmit={handleSubmit}>
            {/* PIN Input */}
            <div className="proctor-form-group">
              <label htmlFor="proctor-pin" className="proctor-form-label">
                Proctor PIN
              </label>
              <input
                id="proctor-pin"
                type="text"
                value={pin}
                onChange={handlePinChange}
                className="proctor-form-input proctor-pin-input"
                placeholder="XXXX-XXXX"
                maxLength={9}
                autoComplete="off"
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="proctor-alert-error">
                <span className="proctor-alert-icon">⚠</span>
                <p>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !pin.trim()}
              className="proctor-btn-primary proctor-btn-full"
            >
              {loading ? (
                <span className="proctor-btn-loading">
                  <span className="proctor-loading-spinner"></span>
                  Validating...
                </span>
              ) : (
                'Enter Lobby'
              )}
            </button>
          </form>

          {/* Back Link */}
          <div className="proctor-back-link">
            <a href="/">← Back to Home</a>
          </div>
        </div>

        {/* Help Text */}
        <p className="proctor-help-text">
          Don't have a proctor PIN? Contact your quiz administrator.
        </p>
      </div>
    </div>
  );
};

export default ProctorLogin;
