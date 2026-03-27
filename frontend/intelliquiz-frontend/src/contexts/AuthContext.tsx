import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type QuizAssignment, PERMISSIONS, currentUserApi } from '../services/api';

interface AuthContextType {
  role: string | null;
  username: string | null;
  assignments: QuizAssignment[];
  loading: boolean;
  refreshAuth: () => Promise<void>;
  clearAuth: () => void;
  setAssignmentsForUser: (username: string, assignments: QuizAssignment[]) => void;
  addAssignmentForUser: (username: string, assignment: QuizAssignment) => void;
  removeAssignmentForUser: (username: string, quizId: number) => void;
  hasPermissionForQuiz: (quizId: number, permission: string) => boolean;
  getAssignedQuizIds: () => number[];
  getQuizPermissions: (quizId: number) => string[];
  canViewQuiz: (quizId: number, createdByUserId?: number) => boolean;
  canEditQuiz: (quizId: number, createdByUserId?: number) => boolean;
  canManageTeams: (quizId: number, createdByUserId?: number) => boolean;
  canHostGame: (quizId: number, createdByUserId?: number) => boolean;
  isSuperAdmin: () => boolean;
  isExaminer: () => boolean;
  isProctor: () => boolean;
  isParticipant: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Global in-memory store for all user assignments (shared across the app)
const globalUserAssignments: Map<string, QuizAssignment[]> = new Map();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const shouldAttemptBackendAuth = () => {
    const path = window.location.pathname;
    const isAdminRoute = path.startsWith('/admin') || path.startsWith('/superadmin') || path === '/login';
    const hasAuthHint = Boolean(localStorage.getItem('role') || localStorage.getItem('username'));
    return isAdminRoute || hasAuthHint;
  };

  const clearAuth = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('assignments');
    setRole(null);
    setUsername(null);
    setAssignments([]);
  };

  // Function to refresh auth state from backend
  const refreshAuth = async () => {
    try {
      const previousUsername = localStorage.getItem('username');

      // Fetch current user info from backend (cookie sent automatically)
      const user = await currentUserApi.getMe();

      // Switching accounts in the same tab should never inherit stale assignments.
      if (previousUsername && previousUsername !== user.username) {
        setAssignments([]);
      }

      setRole(user.role);
      setUsername(user.username);
      localStorage.setItem('role', user.role);
      localStorage.setItem('username', user.username);
      localStorage.setItem('userId', String(user.id));

      // Fetch assignments if user is ADMIN
      if (user.role === 'ADMIN' || user.role === 'EXAMINER') {
        const freshAssignments = await currentUserApi.getMyAssignments();
        setAssignments(freshAssignments);
        localStorage.setItem('assignments', JSON.stringify(freshAssignments));
      } else {
        // Super admins don't need assignments - they have full access
        setAssignments([]);
        localStorage.removeItem('assignments');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('HTTP 401') || message.includes('HTTP 403')) {
        console.log('[AuthContext] No active authenticated session.');
      } else {
        console.error('[AuthContext] Failed to fetch user info:', err);
      }
      // Cookie might be invalid/expired, clear auth state
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  // Load auth state on mount
  useEffect(() => {
    // Hydrate from local storage first for snappier initial render.
    const cachedRole = localStorage.getItem('role');
    const cachedUsername = localStorage.getItem('username');
    const cachedAssignments = localStorage.getItem('assignments');

    if (cachedRole) setRole(cachedRole);
    if (cachedUsername) setUsername(cachedUsername);
    if (cachedAssignments) {
      try {
        setAssignments(JSON.parse(cachedAssignments) as QuizAssignment[]);
      } catch {
        localStorage.removeItem('assignments');
      }
    }

    // Only probe /api/users/me on admin routes or when a prior auth hint exists.
    if (shouldAttemptBackendAuth()) {
      refreshAuth();
    } else {
      setLoading(false);
    }

    // Listen for visibility changes to re-check auth when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldAttemptBackendAuth()) {
        refreshAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Set all assignments for a specific user (used by super admin)
  const setAssignmentsForUser = (targetUsername: string, newAssignments: QuizAssignment[]) => {
    globalUserAssignments.set(targetUsername, newAssignments);
    // If this is the current user, update local state
    if (targetUsername === username) {
      setAssignments(newAssignments);
    }
  };

  // Add a single assignment for a user (used by super admin when assigning)
  const addAssignmentForUser = (targetUsername: string, assignment: QuizAssignment) => {
    const current = globalUserAssignments.get(targetUsername) || [];
    const updated = [...current.filter(a => a.quizId !== assignment.quizId), assignment];
    globalUserAssignments.set(targetUsername, updated);
    // If this is the current user, update local state
    if (targetUsername === username) {
      setAssignments(updated);
    }
  };

  // Remove an assignment for a user (used by super admin when revoking)
  const removeAssignmentForUser = (targetUsername: string, quizId: number) => {
    const current = globalUserAssignments.get(targetUsername) || [];
    const updated = current.filter(a => a.quizId !== quizId);
    globalUserAssignments.set(targetUsername, updated);
    // If this is the current user, update local state
    if (targetUsername === username) {
      setAssignments(updated);
    }
  };

  const isSuperAdmin = (): boolean => {
    return role === 'SUPER_ADMIN';
  };

  const hasPermissionForQuiz = (quizId: number, permission: string): boolean => {
    if (isSuperAdmin()) return true;
    
    const assignment = assignments.find(a => a.quizId === quizId);
    return assignment?.permissions.includes(permission) ?? false;
  };

  const getAssignedQuizIds = (): number[] => {
    return assignments.map(a => a.quizId);
  };

  const getQuizPermissions = (quizId: number): string[] => {
    if (isSuperAdmin()) return Object.values(PERMISSIONS);
    
    const assignment = assignments.find(a => a.quizId === quizId);
    return assignment?.permissions ?? [];
  };

  const canViewQuiz = (quizId: number, createdByUserId?: number): boolean => {
    // Fallback for legacy/partial payloads where creator id is omitted.
    if ((role === 'ADMIN' || role === 'EXAMINER') && (createdByUserId === undefined || createdByUserId === null)) {
      return true;
    }

    // Check if user is the quiz creator (admins/examiners own their quizzes)
    if (createdByUserId && (role === 'ADMIN' || role === 'EXAMINER')) {
      const myId = localStorage.getItem('userId');
      if (myId && parseInt(myId) === createdByUserId) {
        return true;
      }
    }
    return hasPermissionForQuiz(quizId, PERMISSIONS.CAN_VIEW_DETAILS);
  };

  const canEditQuiz = (quizId: number, createdByUserId?: number): boolean => {
    // Fallback for legacy/partial payloads where creator id is omitted.
    if ((role === 'ADMIN' || role === 'EXAMINER') && (createdByUserId === undefined || createdByUserId === null)) {
      return true;
    }

    // Check if user is the quiz creator (admins/examiners own their quizzes)
    if (createdByUserId && (role === 'ADMIN' || role === 'EXAMINER')) {
      const myId = localStorage.getItem('userId');
      if (myId && parseInt(myId) === createdByUserId) {
        return true;
      }
    }
    return hasPermissionForQuiz(quizId, PERMISSIONS.CAN_EDIT_CONTENT);
  };

  const canManageTeams = (quizId: number, createdByUserId?: number): boolean => {
    // Fallback for legacy/partial payloads where creator id is omitted.
    if ((role === 'ADMIN' || role === 'EXAMINER') && (createdByUserId === undefined || createdByUserId === null)) {
      return true;
    }

    // Check if user is the quiz creator (admins/examiners own their quizzes)
    if (createdByUserId && (role === 'ADMIN' || role === 'EXAMINER')) {
      const myId = localStorage.getItem('userId');
      if (myId && parseInt(myId) === createdByUserId) {
        return true;
      }
    }
    return hasPermissionForQuiz(quizId, PERMISSIONS.CAN_MANAGE_TEAMS);
  };

  const canHostGame = (quizId: number, createdByUserId?: number): boolean => {
    // Fallback for legacy/partial payloads where creator id is omitted.
    if ((role === 'ADMIN' || role === 'EXAMINER') && (createdByUserId === undefined || createdByUserId === null)) {
      return true;
    }

    // Check if user is the quiz creator (admins/examiners own their quizzes)
    if (createdByUserId && (role === 'ADMIN' || role === 'EXAMINER')) {
      const myId = localStorage.getItem('userId');
      if (myId && parseInt(myId) === createdByUserId) {
        return true;
      }
    }
    return hasPermissionForQuiz(quizId, PERMISSIONS.CAN_HOST_GAME);
  };

  const isExaminer = (): boolean => role === 'EXAMINER';
  const isProctor = (): boolean => role === 'PROCTOR';
  const isParticipant = (): boolean => role === 'PARTICIPANT';

  return (
    <AuthContext.Provider value={{
      role,
      username,
      assignments,
      loading,
      refreshAuth,
      clearAuth,
      setAssignmentsForUser,
      addAssignmentForUser,
      removeAssignmentForUser,
      hasPermissionForQuiz,
      getAssignedQuizIds,
      getQuizPermissions,
      canViewQuiz,
      canEditQuiz,
      canManageTeams,
      canHostGame,
      isSuperAdmin,
      isExaminer,
      isProctor,
      isParticipant,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
