import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accessApi } from '../../services/api';
import { saveParticipantSession } from '../../services/sessionStorage';
import '../../styles/participant.css';

const ParticipantLogin: React.FC = () => {
  const [teamCode, setTeamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and remove non-alphanumeric characters
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setTeamCode(value);
    setError(null);
  };

  const validateCode = (): boolean => {
    if (!teamCode.trim()) {
      setError('Please enter your team code');
      return false;
    }
    if (teamCode.trim().length < 4) {
      setError('Team code must be at least 4 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCode()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await accessApi.resolveCode(teamCode.trim());
      
      if (result.routeType === 'PARTICIPANT' && result.team) {
        // Save session and navigate to lobby
        saveParticipantSession(
          result.team.quizId,
          result.team.id,
          result.team.name,
          result.team.accessCode
        );
        navigate(`/player/lobby`);
      } else if (result.routeType === 'INVALID') {
        setError(result.errorMessage || 'Invalid team code. Please try again.');
      } else {
        setError('This code is not a team code. Please use the proctor login.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="participant-page">
      {/* Page Header */}
      <div className="participant-page-header">
        <div className="participant-header-decoration participant-header-decoration-1"></div>
        <div className="participant-header-decoration participant-header-decoration-2"></div>
        <h1 className="participant-page-title">IntelliQuiz</h1>
        <p className="participant-page-subtitle">Join the Quiz</p>
      </div>

      {/* Login Card */}
      <div className="participant-login-container">
        <div className="participant-card">
          <h2 className="participant-card-title">Team Login</h2>
          <p className="participant-card-subtitle">
            Enter your team code to join the quiz
          </p>

          <form onSubmit={handleSubmit}>
            {/* Team Code Input */}
            <div className="participant-form-group">
              <label htmlFor="team-code" className="participant-form-label">
                Team Code
              </label>
              <input
                id="team-code"
                type="text"
                value={teamCode}
                onChange={handleCodeChange}
                className="participant-form-input participant-pin-input"
                placeholder="XXXX-XXXX"
                maxLength={9}
                autoComplete="off"
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="participant-alert-error">
                <span className="participant-alert-icon">⚠</span>
                <p>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !teamCode.trim()}
              className="participant-btn-primary participant-btn-full"
            >
              {loading ? (
                <span className="participant-btn-loading">
                  <span className="participant-loading-spinner"></span>
                  Joining...
                </span>
              ) : (
                'Join Quiz'
              )}
            </button>
          </form>

          {/* Back Link */}
          <div className="participant-back-link">
            <a href="/">← Back to Home</a>
          </div>
        </div>

        {/* Help Text */}
        <p className="participant-help-text">
          Your team code was provided by your quiz administrator.
        </p>
      </div>
    </div>
  );
};

export default ParticipantLogin;
