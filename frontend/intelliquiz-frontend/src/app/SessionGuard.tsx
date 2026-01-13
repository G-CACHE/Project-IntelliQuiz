import React from 'react';
import type { ReactNode } from 'react';

interface SessionGuardProps {
  children: ReactNode;
  isSessionActive?: boolean;
}

export const SessionGuard: React.FC<SessionGuardProps> = ({
  children,
  isSessionActive = false,
}) => {
  if (!isSessionActive) {
    return <div>No Active Quiz Session</div>;
  }

  return <>{children}</>;
};
