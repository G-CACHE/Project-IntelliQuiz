import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backupsApi } from '../services/api';
import { queryKeys } from '../lib/queryClient';

export function useBackups() {
  return useQuery({
    queryKey: queryKeys.backups,
    queryFn: backupsApi.getAll,
  });
}

export function useBackup(id: number) {
  return useQuery({
    queryKey: queryKeys.backup(id),
    queryFn: () => backupsApi.getById(id),
    enabled: id > 0,
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: backupsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backups });
    },
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => backupsApi.restore(id),
    onSuccess: () => {
      // Invalidate everything after restore
      queryClient.invalidateQueries();
    },
  });
}

export function useDeleteBackup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => backupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.backups });
    },
  });
}
