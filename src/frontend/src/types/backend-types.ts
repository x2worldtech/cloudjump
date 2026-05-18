import type { Principal } from "@dfinity/principal";

export interface UserProgress {
  level: bigint;
  xp: bigint;
  highestHeight: bigint;
  clouds: bigint;
  prestige: bigint;
}

export interface UserProfile {
  name: string;
  joinedAt: bigint;
}

export interface GlobalStatistics {
  totalPlayers: bigint;
  totalJumps: bigint;
  totalGamesPlayed: bigint;
  totalHeightReached: bigint;
}

export interface ChatMessage {
  sender: Principal;
  content: string;
  timestamp: bigint;
}

export interface Clan {
  name: string;
  owner: Principal;
  members: Principal[];
  totalHeight: bigint;
}

export interface LeaderboardEntry {
  principal: Principal;
  highestScore: bigint;
  level: bigint;
  prestige: bigint;
}

export interface PlayerStats {
  principal: Principal;
  level: bigint;
  xp: bigint;
  highestHeight: bigint;
  clouds: bigint;
  prestige: bigint;
  joinedAt: bigint;
}
