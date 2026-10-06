import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { choreService } from '../api/choreService';
import type {
  CreateChoreRequest,
  ChoreFilterParams,
  DeleteMode,
} from '../types';

export const useChores = (
  homeId: string | undefined,
  filterParams?: ChoreFilterParams,
  leaderboardPeriod: 'WEEKLY' | 'MONTHLY' = 'WEEKLY'
) => {
  const queryClient = useQueryClient();

  const choresQueryKey = ['chores', homeId, filterParams];
  const leaderboardQueryKey = ['chores-leaderboard', homeId, leaderboardPeriod];

  // Consulta de tareas
  const {
    data: chores = [],
    isLoading: isLoadingChores,
    isFetching: isFetchingChores,
    error: choresError,
    refetch: refetchChores,
  } = useQuery({
    queryKey: choresQueryKey,
    queryFn: () => choreService.getChores(homeId!, filterParams),
    enabled: Boolean(homeId),
  });

  // Consulta del Leaderboard
  const {
    data: leaderboard,
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
    refetch: refetchLeaderboard,
  } = useQuery({
    queryKey: leaderboardQueryKey,
    queryFn: () => choreService.getLeaderboard(homeId!, leaderboardPeriod),
    enabled: Boolean(homeId),
  });

  // Invalida tareas, leaderboard y actividades del hogar
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['chores', homeId] });
    queryClient.invalidateQueries({ queryKey: ['chores-leaderboard', homeId] });
    queryClient.invalidateQueries({ queryKey: ['home-activities', homeId] });
  };

  // Mutación: Crear tarea o serie
  const createChoreMutation = useMutation({
    mutationFn: (data: CreateChoreRequest) =>
      choreService.createChore(homeId!, data),
    onSuccess: () => {
      invalidateAll();
    },
  });

  // Mutación: Completar o Rescatar tarea
  const completeChoreMutation = useMutation({
    mutationFn: (choreId: string) =>
      choreService.completeChore(homeId!, choreId),
    onSuccess: () => {
      invalidateAll();
    },
  });

  // Mutación: Eliminar tarea (Single o Forward)
  const deleteChoreMutation = useMutation({
    mutationFn: ({ choreId, mode }: { choreId: string; mode: DeleteMode }) =>
      choreService.deleteChore(homeId!, choreId, mode),
    onSuccess: () => {
      invalidateAll();
    },
  });

  return {
    chores,
    isLoadingChores,
    isFetchingChores,
    choresError: choresError ? (choresError as Error).message : null,
    refetchChores,

    leaderboard,
    isLoadingLeaderboard,
    leaderboardError: leaderboardError ? (leaderboardError as Error).message : null,
    refetchLeaderboard,

    createChore: createChoreMutation.mutateAsync,
    isCreatingChore: createChoreMutation.isPending,
    createChoreError: createChoreMutation.error
      ? (createChoreMutation.error as Error).message
      : null,

    completeChore: completeChoreMutation.mutateAsync,
    isCompletingChore: completeChoreMutation.isPending,

    deleteChore: deleteChoreMutation.mutateAsync,
    isDeletingChore: deleteChoreMutation.isPending,
  };
};
