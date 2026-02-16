import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Clan {
    members: Array<Principal>;
    owner: Principal;
    name: string;
    totalHeight: bigint;
}
export interface LeaderboardEntry {
    principal: Principal;
    highestScore: bigint;
    prestige: bigint;
    level: bigint;
}
export interface GlobalStatistics {
    totalHeightReached: bigint;
    totalPlayers: bigint;
    totalGamesPlayed: bigint;
    totalJumps: bigint;
}
export interface ChatMessage {
    content: string;
    sender: Principal;
    timestamp: bigint;
}
export interface UserProgress {
    xp: bigint;
    clouds: bigint;
    highestHeight: bigint;
    prestige: bigint;
    level: bigint;
}
export interface UserProfile {
    name: string;
    joinedAt: bigint;
}
export interface PlayerStats {
    xp: bigint;
    clouds: bigint;
    principal: Principal;
    highestHeight: bigint;
    joinedAt: bigint;
    prestige: bigint;
    level: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createClan(clanName: string): Promise<void>;
    getCallerClanInfo(): Promise<Clan | null>;
    getCallerProgress(): Promise<UserProgress | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClanInfo(clanName: string): Promise<Clan | null>;
    getClanLeaderboard(): Promise<Array<Clan>>;
    getGlobalLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getGlobalStatistics(): Promise<GlobalStatistics>;
    getHighScores(): Promise<Array<[string, bigint]>>;
    getPlayerStats(principal: Principal): Promise<PlayerStats | null>;
    getRecentChatMessages(): Promise<Array<ChatMessage>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserProgress(user: Principal): Promise<UserProgress | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    joinClan(clanName: string): Promise<void>;
    leaveClan(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendChatMessage(content: string): Promise<void>;
    submitProgress(height: bigint): Promise<void>;
    submitScore(playerName: string, score: bigint): Promise<void>;
    updateGlobalStatistics(jumps: bigint, games: bigint, height: bigint): Promise<void>;
}
