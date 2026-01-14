import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

// Query keys for cache management
export const queryKeys = {
  // Auth
  currentUser: ['currentUser'] as const,
  
  // Users
  users: ['users'] as const,
  user: (id: number) => ['users', id] as const,
  
  // Quizzes
  quizzes: ['quizzes'] as const,
  quiz: (id: number) => ['quizzes', id] as const,
  activeQuiz: ['quizzes', 'active'] as const,
  
  // Questions
  questions: (quizId: number) => ['quizzes', quizId, 'questions'] as const,
  
  // Teams
  teams: (quizId: number) => ['quizzes', quizId, 'teams'] as const,
  
  // Scoreboard
  scoreboard: (quizId: number) => ['quizzes', quizId, 'scoreboard'] as const,
  
  // Backups
  backups: ['backups'] as const,
  backup: (id: number) => ['backups', id] as const,
  
  // Permissions/Assignments - stored per user
  userAssignments: (username: string) => ['assignments', username] as const,
};
