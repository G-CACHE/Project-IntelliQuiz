import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSession, getProctorSession, getParticipantSession, GameSession } from '../../services/sessionStorage';
import LoadingSpinner from './LoadingSpinner';

interface SessionGuardProps {
  children: React.ReactNode;
  requiredRole?: 'PROCTOR' | 'PARTICIPANT';
  redirectTo?: string;
}

/**
 * SessionGuard component that checks for valid session and redirects if needed.
 * Also handles session restoration on page refresh.
 */
const SessionGuard: React.FC<SessionGuardProps> = ({
  children,
  requiredRole,
  redirectTo,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [session, setSession] = useState<GameSession | null>(null);

  useEffect(() => {
    const validateSession = () => {
      const currentSession = getSession();
      
      if (!currentSession) {
        // No session, redirect to appropriate login
        const defaultRedirect = requiredRole === 'PROCTOR' 
          ? '/proctor/login' 
          : requiredRole === 'PARTICIPANT'
          ? '/participant/login'
          : '/';
        navigate(redirectTo || defaultRedirect);
        return;
      }

      // Check if role matches
      if (requiredRole && currentSession.role !== requiredRole) {
        // Wrong role, redirect to appropriate login
        const roleRedirect = requiredRole === 'PROCTOR' 
          ? '/proctor/login' 
          : '/participant/login';
        navigate(redirectTo || roleRedirect);
        return;
      }

      // Session is valid
      setSession(currentSession);
      setIsValidating(false);
    };

    validateSession();
  }, [navigate, requiredRole, redirectTo, location.pathname]);

  if (isValidating) {
    return <LoadingSpinner fullScreen message="Restoring session..." />;
  }

  return <>{children}</>;
};

/**
 * Hook to get the current session with automatic redirect if not found
 */
export const useSession = (requiredRole?: 'PROCTOR' | 'PARTICIPANT') => {
  const navigate = useNavigate();
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentSession = requiredRole === 'PROCTOR'
      ? getProctorSession()
      : requiredRole === 'PARTICIPANT'
      ? getParticipantSession()
      : getSession();

    if (!currentSession) {
      const redirectTo = requiredRole === 'PROCTOR'
        ? '/proctor/login'
        : requiredRole === 'PARTICIPANT'
        ? '/participant/login'
        : '/';
      navigate(redirectTo);
    } else {
      setSession(currentSession);
    }
    setLoading(false);
  }, [navigate, requiredRole]);

  return { session, loading };
};

export default SessionGuard;
