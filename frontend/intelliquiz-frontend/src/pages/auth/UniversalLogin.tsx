import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/landing.css';

const UniversalLogin: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="landing-hero">
        <div className="landing-hero-decoration landing-hero-decoration-1"></div>
        <div className="landing-hero-decoration landing-hero-decoration-2"></div>
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">IntelliQuiz</h1>
          <p className="landing-hero-subtitle">Interactive Quiz Platform</p>
          <p className="landing-hero-tagline">Engage, Learn, and Compete in Real-Time</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="landing-content">
        <div className="landing-cards-container">
          {/* Participant Login - Primary Action */}
          <div
            className="landing-card landing-card-primary"
            onClick={() => navigate('/participant/login')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/participant/login')}
            aria-label="Join as Participant"
          >
            <div className="landing-card-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="landing-card-content">
              <h2 className="landing-card-title">Join as Participant</h2>
              <p className="landing-card-description">Enter your team code to join a quiz session</p>
            </div>
            <svg className="landing-card-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Proctor Login - Secondary Action */}
          <div
            className="landing-card landing-card-secondary"
            onClick={() => navigate('/proctor/login')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/proctor/login')}
            aria-label="Host as Proctor"
          >
            <div className="landing-card-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="landing-card-content">
              <h2 className="landing-card-title">Host as Proctor</h2>
              <p className="landing-card-description">Enter your proctor PIN to host and manage a quiz</p>
            </div>
            <svg className="landing-card-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Divider */}
          <div className="landing-divider">
            <div className="landing-divider-line"></div>
            <span className="landing-divider-text">or</span>
            <div className="landing-divider-line"></div>
          </div>

          {/* Admin Login - Tertiary Action */}
          <div
            className="landing-card landing-card-tertiary"
            onClick={() => navigate('/login')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/login')}
            aria-label="Admin Portal"
          >
            <div className="landing-card-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="landing-card-content">
              <h2 className="landing-card-title">Admin Portal</h2>
              <p className="landing-card-description">Manage quizzes, teams, and system settings</p>
            </div>
            <svg className="landing-card-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <p className="landing-footer-text">
          © 2026 IntelliQuiz. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default UniversalLogin;
