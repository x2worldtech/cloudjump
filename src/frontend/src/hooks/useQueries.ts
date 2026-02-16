import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { Principal } from '@icp-sdk/core/principal';
import type { UserProgress, UserProfile, GlobalStatistics, ChatMessage, Clan, LeaderboardEntry, PlayerStats } from '../backend';

export function useGetHighScores() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, bigint]>>({
    queryKey: ['highScores'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      try {
        const scores = await actor.getHighScores();
        return scores;
      } catch (error: any) {
        console.error('Error fetching high scores:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useSubmitScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerName, score }: { playerName: string; score: number }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.submitScore(playerName, BigInt(score));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highScores'] });
    },
  });
}

export function useGetCallerProgress() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProgress | null>({
    queryKey: ['callerProgress'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      if (!identity) return null;
      
      try {
        const progress = await actor.getCallerProgress();
        return progress;
      } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authenticated')) {
          console.log('User not authorized to view progress');
          return null;
        }
        console.error('Error fetching caller progress:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSubmitProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ height }: { height: number }) => {
      if (!actor) throw new Error('Actor not initialized');
      console.log('Submitting progress with height:', height);
      await actor.submitProgress(BigInt(height));
      console.log('Progress submitted successfully');
    },
    onSuccess: async () => {
      console.log('Progress submission successful, invalidating queries');
      await queryClient.invalidateQueries({ queryKey: ['callerProgress'] });
      await queryClient.refetchQueries({ queryKey: ['callerProgress'] });
      await queryClient.invalidateQueries({ queryKey: ['callerClanInfo'] });
      await queryClient.invalidateQueries({ queryKey: ['clanLeaderboard'] });
      await queryClient.invalidateQueries({ queryKey: ['globalLeaderboard'] });
    },
    onError: (error) => {
      console.error('Error submitting progress:', error);
    },
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      if (!identity) return null;
      
      try {
        const profile = await actor.getCallerUserProfile();
        return profile;
      } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authenticated')) {
          console.log('User not authorized to view profile');
          return null;
        }
        console.error('Error fetching user profile:', error);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: 1,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Global Statistics Hooks
export function useGetGlobalStatistics() {
  const { actor, isFetching } = useActor();

  return useQuery<GlobalStatistics>({
    queryKey: ['globalStatistics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      
      try {
        const stats = await actor.getGlobalStatistics();
        return stats;
      } catch (error: any) {
        console.error('Error fetching global statistics:', error);
        // Return default values on error to prevent blocking UI
        return {
          totalPlayers: BigInt(0),
          totalJumps: BigInt(0),
          totalGamesPlayed: BigInt(0),
          totalHeightReached: BigInt(0),
        };
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// Batch update global statistics - called once at game end
export function useUpdateGlobalStatistics() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jumps, games, height }: { jumps: number; games: number; height: number }) => {
      if (!actor) throw new Error('Actor not initialized');
      console.log('Batch updating global statistics:', { jumps, games, height });
      await actor.updateGlobalStatistics(BigInt(jumps), BigInt(games), BigInt(height));
      console.log('Global statistics updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalStatistics'] });
    },
    onError: (error) => {
      console.error('Error updating global statistics:', error);
    },
  });
}

// Global Chat Hooks
export function useGetRecentChatMessages() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<ChatMessage[]>({
    queryKey: ['chatMessages'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      if (!identity) return [];
      
      try {
        const messages = await actor.getRecentChatMessages();
        return messages;
      } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authenticated')) {
          console.log('User not authorized to view chat');
          return [];
        }
        console.error('Error fetching chat messages:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useSendChatMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.sendChatMessage(content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    },
    onError: (error) => {
      console.error('Error sending chat message:', error);
    },
  });
}

// Clan System Hooks
export function useGetCallerClanInfo() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Clan | null>({
    queryKey: ['callerClanInfo'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      if (!identity) return null;
      
      try {
        const clan = await actor.getCallerClanInfo();
        return clan;
      } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authenticated')) {
          console.log('User not authorized to view clan');
          return null;
        }
        console.error('Error fetching caller clan info:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useGetClanLeaderboard() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Clan[]>({
    queryKey: ['clanLeaderboard'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      if (!identity) return [];
      
      try {
        const leaderboard = await actor.getClanLeaderboard();
        return leaderboard;
      } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authenticated')) {
          console.log('User not authorized to view clan leaderboard');
          return [];
        }
        console.error('Error fetching clan leaderboard:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useCreateClan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clanName: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.createClan(clanName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerClanInfo'] });
      queryClient.invalidateQueries({ queryKey: ['clanLeaderboard'] });
    },
    onError: (error) => {
      console.error('Error creating clan:', error);
    },
  });
}

export function useJoinClan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clanName: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.joinClan(clanName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerClanInfo'] });
      queryClient.invalidateQueries({ queryKey: ['clanLeaderboard'] });
    },
    onError: (error) => {
      console.error('Error joining clan:', error);
    },
  });
}

export function useLeaveClan() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.leaveClan();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerClanInfo'] });
      queryClient.invalidateQueries({ queryKey: ['clanLeaderboard'] });
    },
    onError: (error) => {
      console.error('Error leaving clan:', error);
    },
  });
}

// Global Leaderboard Hook
export function useGetGlobalLeaderboard() {
  const { actor, isFetching } = useActor();

  return useQuery<LeaderboardEntry[]>({
    queryKey: ['globalLeaderboard'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      
      try {
        const leaderboard = await actor.getGlobalLeaderboard();
        return leaderboard;
      } catch (error: any) {
        console.error('Error fetching global leaderboard:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// Player Statistics Hook - for viewing any player's stats by Principal ID
export function useGetPlayerStats(playerPrincipal: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PlayerStats | null>({
    queryKey: ['playerStats', playerPrincipal],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      if (!identity) return null;
      
      try {
        const principal = Principal.fromText(playerPrincipal);
        const stats = await actor.getPlayerStats(principal);
        return stats;
      } catch (error: any) {
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('not authenticated')) {
          console.log('User not authorized to view player stats');
          return null;
        }
        console.error('Error fetching player stats:', error);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !!identity && !!playerPrincipal,
    staleTime: 30000,
    retry: 1,
  });
}
