import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type QuizAssignment, PERMISSIONS } from '../services/api';

interface AuthContextType {
  role: string | null;
  username: string | null;
  assignments: QuizAssignment[];
  loading: boolean;
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

  // Load current user's role and username from localStorage (just auth info, not permissions)
  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    const storedUsername = localStorage.getItem('username');
    
    setRole(storedRole);
    setUsername(storedUsername);
    
    // Load assignments for current user from global store
    if (storedUsername) {
      const userAssignments = globalUserAssignments.get(storedUsername) || [];
      setAssignments(userAssignments);
    }
    setLoading(false);
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
