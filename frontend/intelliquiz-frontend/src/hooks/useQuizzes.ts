import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizzesApi, type Quiz, type CreateQuizRequest, type UpdateQuizRequest } from '../services/api';
import { queryKeys } from '../lib/queryClient';

export function useQuizzes() {
  return useQuery({
    queryKey: queryKeys.quizzes,
    queryFn: quizzesApi.getAll,
  });
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
    mutationFn: ({ id, action }: { id: number; action: 'ready' | 'activate' | 'deactivate' | 'archive' }) => {
      switch (action) {
        case 'ready': return quizzesApi.markReady(id);
        case 'activate': return quizzesApi.activate(id);
        case 'deactivate': return quizzesApi.deactivate(id);
        case 'archive': return quizzesApi.archive(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeQuiz });
    },
  });
}
