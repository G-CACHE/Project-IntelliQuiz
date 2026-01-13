import React from 'react';
import type { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  userRole?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  userRole,
}) => {
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <div>Access Denied: Insufficient Permissions</div>;
  }

  return <>{children}</>;
};
