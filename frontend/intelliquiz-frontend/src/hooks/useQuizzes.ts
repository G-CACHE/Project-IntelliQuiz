import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { quizzesApi, type CreateQuizRequest, type Quiz, type UpdateQuizRequest } from '../services/api';
import { queryKeys } from '../lib/queryClient';

export function useQuizzes() {
  const queryClient = useQueryClient();
  const activeQuizQuery = useActiveQuiz();

  const query = useQuery({
    queryKey: queryKeys.quizzes,
    queryFn: quizzesApi.getAll,
  });

  // Keep quizzes cache in sync with runtime active quiz
  useEffect(() => {
    if (!activeQuizQuery.isSuccess) return;

    const active = activeQuizQuery.data;
    queryClient.setQueryData(queryKeys.quizzes, (old: any) => {
      if (!old || !Array.isArray(old)) return old;
      return old.map((q: any) => {
        // Only upgrade to ACTIVE if this quiz matches the active one
        if (active && q.id === active.id) {
          return { ...q, status: 'ACTIVE', isLiveSession: true };
        }
        // Don't downgrade - trust server state for other quizzes
        return q;
      });
    });
  }, [activeQuizQuery.data, activeQuizQuery.isSuccess, queryClient]);

  return query;
}

export function useQuiz(id: number) {
  return useQuery({
    queryKey: queryKeys.quiz(id),
    queryFn: () => quizzesApi.getById(id),
    enabled: id > 0,
  });
}

export function useActiveQuiz() {
  return useQuery({
    queryKey: queryKeys.activeQuiz,
    queryFn: quizzesApi.getActive,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateQuizRequest) => quizzesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes });
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateQuizRequest }) => 
      quizzesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes });
      queryClient.invalidateQueries({ queryKey: queryKeys.quiz(id) });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => quizzesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes });
    },
  });
}

export function useQuizStatusChange() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'ready' | 'draft' | 'activate' | 'deactivate' | 'archive' }) => {
      switch (action) {
        case 'ready': return quizzesApi.markReady(id);
        case 'draft': return quizzesApi.markDraft(id);
        case 'activate': return quizzesApi.activate(id);
        case 'deactivate': return quizzesApi.deactivate(id);
        case 'archive': return quizzesApi.archive(id);
      }
    },
    onSuccess: (updatedQuiz: Quiz, { id, action }) => {
      queryClient.setQueryData(queryKeys.quiz(id), updatedQuiz);
      queryClient.setQueryData(queryKeys.quizzes, (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((quiz: Quiz) => (quiz.id === updatedQuiz.id ? { ...quiz, ...updatedQuiz } : quiz));
      });

      if (action === 'activate') {
        queryClient.setQueryData(queryKeys.activeQuiz, updatedQuiz);
      }

      if (action === 'deactivate' || action === 'archive') {
        queryClient.setQueryData(queryKeys.activeQuiz, null);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeQuiz });
      queryClient.invalidateQueries({ queryKey: queryKeys.quiz(id) });
    },
  });
}
