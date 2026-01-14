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
    const token = localStorage.getItem('token');
    if (!token) {
      setRole(null);
      setUsername(null);
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch current user info from backend (authoritative source)
      const user = await currentUserApi.getMe();
      console.log('[AuthContext] User info from backend:', user);
      setRole(user.role);
      setUsername(user.username);
      localStorage.setItem('role', user.role);
      localStorage.setItem('username', user.username);

      // Fetch assignments if user is ADMIN
      if (user.role === 'ADMIN') {
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
      // Token might be invalid, clear auth state
      localStorage.removeItem('token');
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
    const loadAuthState = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Always fetch fresh data from backend to ensure role is correct
      await refreshAuth();
    };

    loadAuthState();

    // Listen for storage changes (e.g., when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        refreshAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
