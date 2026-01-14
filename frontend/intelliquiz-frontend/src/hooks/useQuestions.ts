import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionsApi, type CreateQuestionRequest, type UpdateQuestionRequest } from '../services/api';
import { queryKeys } from '../lib/queryClient';

export function useQuestions(quizId: number) {
  return useQuery({
    queryKey: queryKeys.questions(quizId),
    queryFn: () => questionsApi.getByQuiz(quizId),
    enabled: quizId > 0,
  });
}

export function useCreateQuestion(quizId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateQuestionRequest) => questionsApi.create(quizId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions(quizId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.quiz(quizId) });
    },
  });
}

export function useUpdateQuestion(quizId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateQuestionRequest }) => 
      questionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions(quizId) });
    },
  });
}

export function useDeleteQuestion(quizId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => questionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions(quizId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.quiz(quizId) });
    },
  });
}

export function useReorderQuestions(quizId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (questionIds: number[]) => questionsApi.reorder(quizId, questionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions(quizId) });
    },
  });
}
