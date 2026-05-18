import { useGetPlayerStats } from "@/hooks/useQueries";
import {
  Calendar,
  Crown,
  Loader2,
  TrendingUp,
  Trophy,
  User,
  X,
} from "lucide-react";
import type React from "react";
import CloudCoinIcon from "./CloudCoinIcon";

interface PlayerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerPrincipal: string;
}

const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({
  isOpen,
  onClose,
  playerPrincipal,
}) => {
  const {
    data: playerStats,
    isLoading,
    error,
  } = useGetPlayerStats(playerPrincipal);

  const formatNumber = (num: bigint | number): string => {
    const n = typeof num === "bigint" ? Number(num) : num;
    if (n >= 1000000) {
      return `${(n / 1000000).toFixed(1)}M`;
    }
    if (n >= 1000) {
      return `${(n / 1000).toFixed(1)}K`;
    }
    return n.toString();
  };

  const formatPrincipal = (principal: string): string => {
    if (principal.length <= 16) return principal;
    return `${principal.slice(0, 8)}...${principal.slice(-6)}`;
  };

  const formatJoinDate = (timestamp: bigint): string => {
    if (!timestamp || timestamp === BigInt(0)) return "Unknown";

    // Convert nanoseconds to milliseconds
    const milliseconds = Number(timestamp / BigInt(1000000));
    const date = new Date(milliseconds);

    // Format as dd.mm.yyyy
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  };

  const hasPrestige = playerStats && Number(playerStats.prestige) > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Fully opaque dark overlay with backdrop blur */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-indigo-900/95 to-indigo-800/95 backdrop-blur-lg"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
        aria-label="Close player stats"
      />

      {/* Close button - top right */}
      <div className="relative z-10 flex justify-end p-4 sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all shadow-lg hover:shadow-xl"
          aria-label="Close player stats modal"
        >
          <X className="h-6 w-6 text-white drop-shadow-md" />
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <User className="h-10 w-10 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
              <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] tracking-wide uppercase">
                Player Stats
              </h1>
            </div>
            <p className="text-white/80 text-sm">Detailed player statistics</p>
          </div>

          {/* Stats Content */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-indigo-700 text-sm">
                    Loading player stats...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="bg-red-100 rounded-full p-6">
                  <svg
                    className="h-16 w-16 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    role="img"
                    aria-label="Player stats icon"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-indigo-900">
                    Unable to load player stats
                  </p>
                  <p className="text-sm text-indigo-700 mt-1">
                    Please try again later
                  </p>
                </div>
              </div>
            ) : !playerStats ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="bg-indigo-100 rounded-full p-6">
                  <User className="h-16 w-16 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-indigo-900">
                    No stats available
                  </p>
                  <p className="text-sm text-indigo-700 mt-1">
                    This player hasn't played yet
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Principal ID */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 border-2 border-indigo-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-indigo-500 rounded-full p-2">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">
                      Principal ID
                    </h3>
                  </div>
                  <p className="text-base font-mono text-indigo-900 break-all pl-10">
                    {formatPrincipal(playerPrincipal)}
                  </p>
                </div>

                {/* Prestige Display - Only visible if player has prestige */}
                {hasPrestige && (
                  <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-xl p-5 border-2 border-purple-400 shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-purple-500 rounded-full p-2">
                        <Crown className="h-5 w-5 text-amber-300 drop-shadow-md" />
                      </div>
                      <h3 className="text-sm font-semibold text-purple-200 uppercase tracking-wide">
                        Prestige Level
                      </h3>
                    </div>
                    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] pl-10">
                      {Number(playerStats.prestige)}
                    </p>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Level */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-2 border-purple-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-purple-500 rounded-full p-2">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                        Level
                      </h3>
                    </div>
                    <p className="text-3xl font-black text-purple-900 pl-10">
                      {Number(playerStats.level)}
                    </p>
                  </div>

                  {/* XP */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-500 rounded-full p-2">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                        Total XP
                      </h3>
                    </div>
                    <p className="text-3xl font-black text-blue-900 pl-10">
                      {formatNumber(playerStats.xp)}
                    </p>
                  </div>

                  {/* Highest Score */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border-2 border-amber-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-amber-500 rounded-full p-2">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
                        Highest Score
                      </h3>
                    </div>
                    <p className="text-3xl font-black text-amber-900 pl-10">
                      {formatNumber(playerStats.highestHeight)}
                    </p>
                  </div>

                  {/* Clouds */}
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-5 border-2 border-cyan-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-cyan-500 rounded-full p-2">
                        <CloudCoinIcon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-semibold text-cyan-700 uppercase tracking-wide">
                        Clouds
                      </h3>
                    </div>
                    <p className="text-3xl font-black text-cyan-900 pl-10">
                      {formatNumber(playerStats.clouds)}
                    </p>
                  </div>
                </div>

                {/* Join Date */}
                {playerStats.joinedAt && playerStats.joinedAt !== BigInt(0) && (
                  <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-5 border-2 border-violet-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-violet-500 rounded-full p-2">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-violet-700 uppercase tracking-wide">
                          Joined
                        </h3>
                        <p className="text-2xl font-black text-violet-900 mt-1">
                          {formatJoinDate(playerStats.joinedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                  <p className="text-xs text-indigo-700 text-center">
                    Statistics are updated after each game session
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsModal;
