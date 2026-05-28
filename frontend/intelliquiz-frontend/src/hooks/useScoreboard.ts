import { useQuery } from '@tanstack/react-query';
import { scoreboardApi } from '../services/api';
import { queryKeys } from '../lib/queryClient';

export function useScoreboard(quizId: number, options?: { refetchInterval?: number }) {
  const baseIntervalMs = options?.refetchInterval ?? 5000;

  return useQuery({
    queryKey: queryKeys.scoreboard(quizId),
    queryFn: () => scoreboardApi.getByQuiz(quizId),
    enabled: quizId > 0,
    // Keep scoreboard updates live, but back off when backend is briefly unavailable.
    refetchInterval: (query) => (query.state.error ? Math.max(baseIntervalMs * 3, 15000) : baseIntervalMs),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
