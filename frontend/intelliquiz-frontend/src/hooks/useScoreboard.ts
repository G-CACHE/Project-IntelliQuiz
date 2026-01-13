import { useQuery } from '@tanstack/react-query';
import { scoreboardApi } from '../services/api';
import { queryKeys } from '../lib/queryClient';

export function useScoreboard(quizId: number, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.scoreboard(quizId),
    queryFn: () => scoreboardApi.getByQuiz(quizId),
    enabled: quizId > 0,
    refetchInterval: options?.refetchInterval,
  });
}
