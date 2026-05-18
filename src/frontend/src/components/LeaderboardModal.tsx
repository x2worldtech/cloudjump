import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetGlobalLeaderboard } from "@/hooks/useQueries";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Award, Crown, Loader2, Trophy, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import PlayerStatsModal from "./PlayerStatsModal";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedPlayerPrincipal, setSelectedPlayerPrincipal] = useState<
    string | null
  >(null);
  const { data: leaderboard = [], isLoading } = useGetGlobalLeaderboard();
  const { identity } = useInternetIdentity();

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
    // Show first 5 and last 3 characters of principal
    if (principal.length <= 10) return principal;
    return `${principal.slice(0, 5)}...${principal.slice(-3)}`;
  };

  const handlePlayerClick = (principal: string) => {
    setSelectedPlayerPrincipal(principal);
  };

  const currentUserPrincipal = identity?.getPrincipal().toString();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col">
        {/* Fully opaque dark overlay with backdrop blur */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-purple-900/95 to-purple-800/95 backdrop-blur-lg"
          onClick={onClose}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onClose();
          }}
          aria-label="Close leaderboard"
        />

        {/* Close button - top right */}
        <div className="relative z-10 flex justify-end p-4 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all shadow-lg hover:shadow-xl"
            aria-label="Close leaderboard modal"
          >
            <X className="h-6 w-6 text-white drop-shadow-md" />
          </button>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 overflow-hidden px-4 sm:px-6 pb-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Trophy className="h-10 w-10 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] tracking-wide uppercase">
                  Global Leaderboard
                </h1>
                <Trophy className="h-10 w-10 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
              </div>
              <p className="text-white/80 text-sm">
                Top players ranked by highest score
              </p>
            </div>

            {/* Leaderboard Content */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 flex-1 overflow-hidden flex flex-col">
              {isLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4">
                  <div className="bg-purple-100 rounded-full p-8">
                    <Trophy className="h-16 w-16 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-900 mb-2">
                      No scores yet
                    </h3>
                    <p className="text-purple-700 text-sm">
                      Be the first to set a high score!
                    </p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => {
                      const principalString = entry.principal.toString();
                      const isCurrentUser =
                        currentUserPrincipal === principalString;
                      const hasPrestige = Number(entry.prestige) > 0;

                      return (
                        <div
                          key={principalString}
                          className={`rounded-xl p-4 border-2 transition-all ${
                            isCurrentUser
                              ? "bg-gradient-to-r from-cyan-100 to-cyan-200 border-cyan-400 shadow-lg"
                              : index === 0
                                ? "bg-gradient-to-r from-amber-100 to-amber-200 border-amber-400"
                                : index === 1
                                  ? "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400"
                                  : index === 2
                                    ? "bg-gradient-to-r from-orange-100 to-orange-200 border-orange-400"
                                    : "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div
                              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${
                                isCurrentUser
                                  ? "bg-cyan-500 text-white"
                                  : index === 0
                                    ? "bg-amber-500 text-white"
                                    : index === 1
                                      ? "bg-gray-400 text-white"
                                      : index === 2
                                        ? "bg-orange-500 text-white"
                                        : "bg-purple-500 text-white"
                              }`}
                            >
                              {index === 0
                                ? "🥇"
                                : index === 1
                                  ? "🥈"
                                  : index === 2
                                    ? "🥉"
                                    : index + 1}
                            </div>

                            {/* Player Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePlayerClick(principalString)
                                  }
                                  className="text-base font-bold text-purple-900 font-mono truncate hover:text-purple-700 hover:underline transition-colors cursor-pointer"
                                >
                                  {formatPrincipal(principalString)}
                                </button>
                                {isCurrentUser && (
                                  <Award className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                                )}
                                {hasPrestige && (
                                  <Crown className="h-5 w-5 text-purple-600 flex-shrink-0 drop-shadow-md" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-purple-700 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Trophy className="h-4 w-4 text-amber-500" />
                                  <span className="font-mono font-bold">
                                    {formatNumber(entry.highestScore)}
                                  </span>
                                </span>
                                <span className="text-purple-600 font-semibold">
                                  Level {Number(entry.level)}
                                </span>
                                {hasPrestige && (
                                  <span className="flex items-center gap-1 text-purple-800 font-bold bg-purple-200 px-2 py-0.5 rounded-full">
                                    <Crown className="h-3 w-3" />
                                    Prestige {Number(entry.prestige)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Score Badge */}
                            <div
                              className={`flex-shrink-0 px-4 py-2 rounded-full font-mono font-bold text-lg ${
                                isCurrentUser
                                  ? "bg-cyan-500 text-white"
                                  : index === 0
                                    ? "bg-amber-500 text-white"
                                    : index === 1
                                      ? "bg-gray-400 text-white"
                                      : index === 2
                                        ? "bg-orange-500 text-white"
                                        : "bg-purple-500 text-white"
                              }`}
                            >
                              {formatNumber(entry.highestScore)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Player Stats Modal */}
      {selectedPlayerPrincipal && (
        <PlayerStatsModal
          isOpen={!!selectedPlayerPrincipal}
          onClose={() => setSelectedPlayerPrincipal(null)}
          playerPrincipal={selectedPlayerPrincipal}
        />
      )}
    </>
  );
};

export default LeaderboardModal;
