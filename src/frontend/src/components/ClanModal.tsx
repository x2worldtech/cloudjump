import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreateClan,
  useGetCallerClanInfo,
  useGetClanLeaderboard,
  useJoinClan,
  useLeaveClan,
} from "@/hooks/useQueries";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Crown, Loader2, LogOut, Search, Trophy, Users, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import PlayerStatsModal from "./PlayerStatsModal";

interface ClanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ClanModal: React.FC<ClanModalProps> = ({ isOpen, onClose }) => {
  const [clanName, setClanName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayerPrincipal, setSelectedPlayerPrincipal] = useState<
    string | null
  >(null);
  const { identity } = useInternetIdentity();

  const {
    data: myClan,
    isLoading: myClanLoading,
    refetch: refetchMyClan,
  } = useGetCallerClanInfo();
  const { data: leaderboard = [], isLoading: leaderboardLoading } =
    useGetClanLeaderboard();
  const createClanMutation = useCreateClan();
  const joinClanMutation = useJoinClan();
  const leaveClanMutation = useLeaveClan();

  const currentUserPrincipal = identity?.getPrincipal().toString();

  const handleCreateClan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clanName.trim()) {
      toast.error("Please enter a clan name");
      return;
    }

    try {
      await createClanMutation.mutateAsync(clanName.trim());
      toast.success("Clan created successfully!");
      setClanName("");
      refetchMyClan();
    } catch (error: any) {
      console.error("Failed to create clan:", error);
      if (error?.message?.includes("already exists")) {
        toast.error("Clan name already taken");
      } else if (error?.message?.includes("already in a clan")) {
        toast.error("You are already in a clan");
      } else {
        toast.error("Failed to create clan");
      }
    }
  };

  const handleJoinClan = async (clanName: string) => {
    try {
      await joinClanMutation.mutateAsync(clanName);
      toast.success(`Joined ${clanName}!`);
      refetchMyClan();
    } catch (error: any) {
      console.error("Failed to join clan:", error);
      if (error?.message?.includes("already in a clan")) {
        toast.error("You are already in a clan");
      } else if (error?.message?.includes("full")) {
        toast.error("Clan is full (50 members max)");
      } else {
        toast.error("Failed to join clan");
      }
    }
  };

  const handleLeaveClan = async () => {
    try {
      await leaveClanMutation.mutateAsync();
      toast.success("Left clan successfully");
      refetchMyClan();
    } catch (error: any) {
      console.error("Failed to leave clan:", error);
      toast.error("Failed to leave clan");
    }
  };

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
    if (principal.length <= 12) return principal;
    return `${principal.slice(0, 6)}...${principal.slice(-4)}`;
  };

  const handlePlayerClick = (principal: string) => {
    setSelectedPlayerPrincipal(principal);
  };

  const filteredLeaderboard = leaderboard.filter((clan) =>
    clan.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
        />

        {/* Close button - top right */}
        <div className="relative z-10 flex justify-end p-4 sm:p-6">
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all shadow-lg hover:shadow-xl"
            type="button"
            aria-label="Close clan modal"
          >
            <X className="h-6 w-6 text-white drop-shadow-md" />
          </button>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 overflow-hidden px-4 sm:px-6 pb-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] tracking-wide uppercase">
                Clans
              </h1>
              <p className="text-white/80 text-sm mt-2">
                Join forces and climb the leaderboard together
              </p>
            </div>

            {/* Tabs */}
            <Tabs
              defaultValue="my-clan"
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
                <TabsTrigger
                  value="my-clan"
                  className="data-[state=active]:bg-white/90 data-[state=active]:text-purple-900"
                >
                  My Clan
                </TabsTrigger>
                <TabsTrigger
                  value="join"
                  className="data-[state=active]:bg-white/90 data-[state=active]:text-purple-900"
                >
                  Join
                </TabsTrigger>
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-white/90 data-[state=active]:text-purple-900"
                >
                  Create
                </TabsTrigger>
                <TabsTrigger
                  value="leaderboard"
                  className="data-[state=active]:bg-white/90 data-[state=active]:text-purple-900"
                >
                  Leaderboard
                </TabsTrigger>
              </TabsList>

              {/* My Clan Tab */}
              <TabsContent
                value="my-clan"
                className="flex-1 overflow-hidden mt-0"
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 h-full overflow-y-auto">
                  {myClanLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                    </div>
                  ) : myClan ? (
                    <div className="space-y-6">
                      {/* Clan Header */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-300">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-500 rounded-full p-3">
                              <Users className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-black text-purple-900">
                                {myClan.name}
                              </h2>
                              <p className="text-sm text-purple-700">
                                {myClan.members.length} / 50 members
                              </p>
                            </div>
                          </div>
                          {myClan.owner.toString() === currentUserPrincipal && (
                            <div className="bg-amber-500 rounded-full p-2">
                              <Crown className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Total Height */}
                        <div className="bg-white/80 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-6 w-6 text-amber-500" />
                              <span className="text-sm font-medium text-purple-700">
                                Total Height
                              </span>
                            </div>
                            <span className="text-2xl font-black text-purple-900">
                              {formatNumber(myClan.totalHeight)}
                            </span>
                          </div>
                        </div>

                        {/* Leave Clan Button */}
                        <Button
                          onClick={handleLeaveClan}
                          disabled={leaveClanMutation.isPending}
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          {leaveClanMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="mr-2 h-4 w-4" />
                          )}
                          Leave Clan
                        </Button>
                      </div>

                      {/* Members List */}
                      <div>
                        <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Members
                        </h3>
                        <ScrollArea className="h-[300px] rounded-lg border border-purple-200">
                          <div className="space-y-2 p-2">
                            {myClan.members.map((member, _index) => (
                              <div
                                key={member.toString()}
                                className="bg-purple-50 rounded-lg p-3 flex items-center justify-between hover:bg-purple-100 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {formatPrincipal(member.toString())
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePlayerClick(member.toString())
                                    }
                                    className="text-sm font-mono text-purple-900 hover:text-purple-700 hover:underline transition-colors cursor-pointer"
                                  >
                                    {formatPrincipal(member.toString())}
                                  </button>
                                </div>
                                {member.toString() ===
                                  myClan.owner.toString() && (
                                  <Crown className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                      <div className="bg-purple-100 rounded-full p-8">
                        <Users className="h-16 w-16 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-purple-900 mb-2">
                          You are not in a clan
                        </h3>
                        <p className="text-purple-700 text-sm">
                          Join an existing clan or create your own!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Join Clan Tab */}
              <TabsContent value="join" className="flex-1 overflow-hidden mt-0">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 h-full flex flex-col">
                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
                      <Input
                        type="text"
                        placeholder="Search clans..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>
                  </div>

                  {/* Clans List */}
                  {leaderboardLoading ? (
                    <div className="flex items-center justify-center flex-1">
                      <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                    </div>
                  ) : filteredLeaderboard.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4">
                      <div className="bg-purple-100 rounded-full p-8">
                        <Users className="h-16 w-16 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-purple-900 mb-2">
                          No clans found
                        </h3>
                        <p className="text-purple-700 text-sm">
                          Be the first to create one!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1">
                      <div className="space-y-3">
                        {filteredLeaderboard.map((clan, index) => {
                          const isFull = clan.members.length >= 50;
                          const isInClan = myClan?.name === clan.name;

                          return (
                            <div
                              key={`${clan.name}-${index}`}
                              className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 hover:shadow-lg transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h3 className="text-lg font-bold text-purple-900 mb-1">
                                    {clan.name}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-purple-700">
                                    <span className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      {clan.members.length} / 50
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Trophy className="h-4 w-4 text-amber-500" />
                                      {formatNumber(clan.totalHeight)}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleJoinClan(clan.name)}
                                  disabled={
                                    isFull ||
                                    isInClan ||
                                    joinClanMutation.isPending ||
                                    !!myClan
                                  }
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                                >
                                  {isInClan
                                    ? "Joined"
                                    : isFull
                                      ? "Full"
                                      : myClan
                                        ? "In Clan"
                                        : "Join"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </TabsContent>

              {/* Create Clan Tab */}
              <TabsContent
                value="create"
                className="flex-1 overflow-hidden mt-0"
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 h-full flex flex-col items-center justify-center">
                  {myClan ? (
                    <div className="text-center space-y-4">
                      <div className="bg-purple-100 rounded-full p-8 inline-block">
                        <Users className="h-16 w-16 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-purple-900 mb-2">
                          Already in a clan
                        </h3>
                        <p className="text-purple-700 text-sm">
                          Leave your current clan to create a new one
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-md space-y-6">
                      <div className="text-center">
                        <div className="bg-purple-100 rounded-full p-8 inline-block mb-4">
                          <Users className="h-16 w-16 text-purple-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-purple-900 mb-2">
                          Create Your Clan
                        </h3>
                        <p className="text-purple-700 text-sm">
                          Choose a unique name for your clan
                        </p>
                      </div>

                      <form onSubmit={handleCreateClan} className="space-y-4">
                        <div>
                          <Input
                            type="text"
                            placeholder="Enter clan name..."
                            value={clanName}
                            onChange={(e) => setClanName(e.target.value)}
                            maxLength={30}
                            className="text-center text-lg border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                          />
                          <p className="text-xs text-purple-600 mt-2 text-center">
                            {clanName.length}/30 characters
                          </p>
                        </div>

                        <Button
                          type="submit"
                          disabled={
                            !clanName.trim() || createClanMutation.isPending
                          }
                          className="w-full bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white text-lg py-6 shadow-lg"
                        >
                          {createClanMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Users className="mr-2 h-5 w-5" />
                              Create Clan
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Leaderboard Tab */}
              <TabsContent
                value="leaderboard"
                className="flex-1 overflow-hidden mt-0"
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 h-full flex flex-col">
                  <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-amber-500" />
                    Global Clan Leaderboard
                  </h3>

                  {leaderboardLoading ? (
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
                          No clans yet
                        </h3>
                        <p className="text-purple-700 text-sm">
                          Create the first clan and lead the leaderboard!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1">
                      <div className="space-y-3">
                        {leaderboard.map((clan, index) => (
                          <div
                            key={`lb-${clan.name}-${index}`}
                            className={`rounded-xl p-4 border-2 transition-all ${
                              index === 0
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
                                  index === 0
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

                              {/* Clan Info */}
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-purple-900 mb-1">
                                  {clan.name}
                                </h4>
                                <div className="flex items-center gap-3 text-sm text-purple-700">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {clan.members.length}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Trophy className="h-4 w-4 text-amber-500" />
                                    {formatNumber(clan.totalHeight)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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

export default ClanModal;
