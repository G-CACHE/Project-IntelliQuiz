import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi, type RegisterTeamRequest } from '../services/api';
import { queryKeys } from '../lib/queryClient';

export function useTeams(quizId: number) {
  return useQuery({
    queryKey: queryKeys.teams(quizId),
    queryFn: () => teamsApi.getByQuiz(quizId),
    enabled: quizId > 0,
  });
}

export function useRegisterTeam(quizId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RegisterTeamRequest) => teamsApi.register(quizId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams(quizId) });
    },
  });
}

export function useDeleteTeam(quizId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => teamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams(quizId) });
    },
  });
}

export function useResetTeamScores(quizId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => teamsApi.resetScores(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams(quizId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.scoreboard(quizId) });
    },
  });
}
