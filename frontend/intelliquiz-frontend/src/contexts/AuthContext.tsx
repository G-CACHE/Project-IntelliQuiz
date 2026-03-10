import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type QuizAssignment, PERMISSIONS, currentUserApi } from '../services/api';

interface AuthContextType {
  role: string | null;
  username: string | null;
  assignments: QuizAssignment[];
  loading: boolean;
  refreshAuth: () => Promise<void>;
  setAssignmentsForUser: (username: string, assignments: QuizAssignment[]) => void;
  addAssignmentForUser: (username: string, assignment: QuizAssignment) => void;
  removeAssignmentForUser: (username: string, quizId: number) => void;
  hasPermissionForQuiz: (quizId: number, permission: string) => boolean;
  getAssignedQuizIds: () => number[];
  getQuizPermissions: (quizId: number) => string[];
  canViewQuiz: (quizId: number) => boolean;
  canEditQuiz: (quizId: number) => boolean;
  canManageTeams: (quizId: number) => boolean;
  canHostGame: (quizId: number) => boolean;
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

  // Function to refresh auth state from backend
  const refreshAuth = async () => {
    try {
      // Fetch current user info from backend (cookie sent automatically)
      const user = await currentUserApi.getMe();
      console.log('[AuthContext] User info from backend:', user);
      setRole(user.role);
      setUsername(user.username);
      localStorage.setItem('role', user.role);
      localStorage.setItem('username', user.username);

      // Fetch assignments if user is ADMIN
      if (user.role === 'ADMIN' || user.role === 'EXAMINER') {
        const freshAssignments = await currentUserApi.getMyAssignments();
        console.log('[AuthContext] Assignments from backend:', freshAssignments);
        setAssignments(freshAssignments);
        localStorage.setItem('assignments', JSON.stringify(freshAssignments));
      } else {
        // Super admins don't need assignments - they have full access
        setAssignments([]);
        localStorage.removeItem('assignments');
      }
    } catch (err) {
      console.error('[AuthContext] Failed to fetch user info:', err);
      // Cookie might be invalid/expired, clear auth state
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      localStorage.removeItem('assignments');
      setRole(null);
      setUsername(null);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Load auth state on mount
  useEffect(() => {
    // Always try to fetch from backend — cookie presence is determined server-side
    refreshAuth();

    // Listen for visibility changes to re-check auth when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
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

  const canViewQuiz = (quizId: number): boolean => {
    return hasPermissionForQuiz(quizId, PERMISSIONS.CAN_VIEW_DETAILS);
  };

  const canEditQuiz = (quizId: number): boolean => {
    return hasPermissionForQuiz(quizId, PERMISSIONS.CAN_EDIT_CONTENT);
  };

  const canManageTeams = (quizId: number): boolean => {
    return hasPermissionForQuiz(quizId, PERMISSIONS.CAN_MANAGE_TEAMS);
  };

  const canHostGame = (quizId: number): boolean => {
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
