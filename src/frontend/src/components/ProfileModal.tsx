import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LogOut, Trophy, Star, TrendingUp, LogIn, RefreshCw, Calendar, Crown } from 'lucide-react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useGetCallerProgress, useGetCallerUserProfile } from '@/hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import CloudCoinIcon from '@/components/CloudCoinIcon';
import {
  getCurrentLevelXp,
  getXpNeededForNextLevel,
  getLevelProgress,
  calculatePrestige,
  getCurrentPrestigeXp,
  getXpNeededForNextPrestige,
  getPrestigeProgress,
} from '@/lib/levelUtils';
import { getHeightUntilNextCloud } from '@/lib/cloudUtils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, isAuthenticated }) => {
  const { clear, identity, login, loginStatus } = useInternetIdentity();
  const { data: userProgress, isLoading: progressLoading, refetch: refetchProgress, isFetching: progressFetching } = useGetCallerProgress();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const isLoggingIn = loginStatus === 'logging-in';
  const isLoading = progressLoading || profileLoading;
  const isFetching = progressFetching;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    onClose();
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handleRefresh = () => {
    refetchProgress();
  };

  const formatJoinDate = (timestamp: bigint): string => {
    if (!timestamp || timestamp === BigInt(0)) return 'Unknown';
    
    // Convert nanoseconds to milliseconds
    const milliseconds = Number(timestamp / BigInt(1000000));
    const date = new Date(milliseconds);
    
    // Format as dd.mm.yyyy
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  // Calculate prestige level
  const prestigeLevel = userProgress 
    ? calculatePrestige(Number(userProgress.xp), Number(userProgress.level))
    : 0;

  const isPrestigeActive = userProgress && Number(userProgress.level) >= 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-sky-900 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Profile
          </DialogTitle>
          <DialogDescription>
            {isAuthenticated ? '' : 'Guest mode'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isAuthenticated ? (
            <div className="text-center py-8 space-y-4">
              <div className="text-6xl">👤</div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-sky-900">Guest Mode</p>
                <p className="text-sm text-muted-foreground">
                  No progress saved
                </p>
                <p className="text-xs text-muted-foreground px-4">
                  Log in with Internet Identity to save your progress and level up!
                </p>
              </div>
              
              {/* Login Button */}
              <div className="pt-4">
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="group relative w-full px-6 py-4 text-lg font-bold text-white rounded-xl overflow-hidden transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-500 to-sky-700"></div>
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                  <div className="absolute inset-0 rounded-xl border-2 border-white/20"></div>
                  <span className="relative z-10 drop-shadow-lg flex items-center justify-center gap-2">
                    <LogIn className="h-5 w-5" />
                    {isLoggingIn ? 'Logging in...' : 'Login with Internet Identity'}
                  </span>
                  <div className="absolute inset-0 rounded-xl bg-sky-900/50 translate-y-1 -z-10"></div>
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
                <p className="text-muted-foreground">Loading profile...</p>
              </div>
            </div>
          ) : userProgress ? (
            <div className="space-y-6">
              {/* Refresh Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleRefresh}
                  disabled={isFetching}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Prestige Display - Only visible at Level 100 */}
              {isPrestigeActive && (
                <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-xl p-6 border-2 border-purple-400 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Crown className="h-10 w-10 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse" />
                      <div>
                        <p className="text-sm text-purple-200 font-medium uppercase tracking-wide">Prestige Level</p>
                        <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                          {prestigeLevel}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-purple-200">of</p>
                      <p className="text-3xl font-bold text-purple-300">10</p>
                    </div>
                  </div>

                  {/* Prestige Progress */}
                  {prestigeLevel < 10 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-200 font-medium">Prestige Progress</span>
                        <span className="text-purple-100 font-bold">
                          {getCurrentPrestigeXp(Number(userProgress.xp), prestigeLevel).toLocaleString()} / {getXpNeededForNextPrestige(Number(userProgress.xp), prestigeLevel).toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={getPrestigeProgress(Number(userProgress.xp), prestigeLevel)}
                        className="h-3 bg-purple-950"
                      />
                      <p className="text-xs text-purple-200 text-right">
                        {(100 - getPrestigeProgress(Number(userProgress.xp), prestigeLevel)).toFixed(1)}% to Prestige {prestigeLevel + 1}
                      </p>
                    </div>
                  )}
                  {prestigeLevel === 10 && (
                    <div className="text-center py-2">
                      <p className="text-purple-100 font-bold text-lg">👑 Maximum Prestige Reached! 👑</p>
                    </div>
                  )}
                </div>
              )}

              {/* Level Display */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border-2 border-amber-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="text-sm text-amber-700 font-medium">Current Level</p>
                      <p className="text-4xl font-black text-amber-600">
                        {Number(userProgress.level)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-amber-700">of</p>
                    <p className="text-2xl font-bold text-amber-600">100</p>
                  </div>
                </div>

                {/* XP Progress */}
                {Number(userProgress.level) < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700 font-medium">XP Progress</span>
                      <span className="text-amber-600 font-bold">
                        {getCurrentLevelXp(Number(userProgress.xp), Number(userProgress.level)).toLocaleString()} / {getXpNeededForNextLevel(Number(userProgress.xp), Number(userProgress.level)).toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={getLevelProgress(Number(userProgress.xp), Number(userProgress.level))}
                      className="h-3 bg-amber-200"
                    />
                    <p className="text-xs text-amber-700 text-right">
                      {(100 - getLevelProgress(Number(userProgress.xp), Number(userProgress.level))).toFixed(1)}% to Level {Number(userProgress.level) + 1}
                    </p>
                  </div>
                )}
                {Number(userProgress.level) === 100 && !isPrestigeActive && (
                  <div className="text-center py-2">
                    <p className="text-amber-700 font-bold">🎉 Maximum level reached! 🎉</p>
                  </div>
                )}
              </div>

              {/* Cloud Currency Display */}
              <div className="bg-gradient-to-br from-sky-50 to-cyan-100 rounded-xl p-6 border-2 border-cyan-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <CloudCoinIcon 
                        size={48} 
                        className="drop-shadow-lg animate-pulse"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-cyan-700 font-medium">Total Clouds</p>
                      <p className="text-4xl font-black text-cyan-600">
                        {Number(userProgress.clouds)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cloud Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-cyan-700 font-medium">Next Cloud Progress</span>
                    <span className="text-cyan-600 font-bold">
                      {getHeightUntilNextCloud(Number(userProgress.xp))} height
                    </span>
                  </div>
                  <p className="text-xs text-cyan-700">
                    {getHeightUntilNextCloud(Number(userProgress.xp))} height until next Cloud
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-sky-600" />
                    <p className="text-xs text-sky-700 font-medium">Total XP</p>
                  </div>
                  <p className="text-2xl font-bold text-sky-900">
                    {Number(userProgress.xp).toLocaleString()}
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-emerald-600" />
                    <p className="text-xs text-emerald-700 font-medium">Highest Height</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">
                    {Number(userProgress.highestHeight).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Join Date */}
              {userProfile && userProfile.joinedAt && userProfile.joinedAt !== BigInt(0) && (
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-4 border border-violet-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-violet-600" />
                    <div>
                      <p className="text-xs text-violet-700 font-medium">Joined</p>
                      <p className="text-lg font-bold text-violet-900">
                        {formatJoinDate(userProfile.joinedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Principal ID (truncated) */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Principal ID</p>
                <p className="text-xs font-mono text-foreground break-all">
                  {identity?.getPrincipal().toString().slice(0, 20)}...
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="text-6xl">🎮</div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-sky-900">No progress yet</p>
                <p className="text-sm text-muted-foreground">
                  Play your first game to earn XP!
                </p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isFetching}
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Check Again
              </Button>
            </div>
          )}

          {/* Logout Button */}
          {isAuthenticated && (
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
