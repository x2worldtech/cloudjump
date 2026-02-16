import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, LogIn, Play, Users, TrendingUp, Trophy, Mountain, MessageCircle, Shield, Award } from 'lucide-react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import Game from './Game';
import ProfileModal from '@/components/ProfileModal';
import ChatModal from '@/components/ChatModal';
import ClanModal from '@/components/ClanModal';
import LeaderboardModal from '@/components/LeaderboardModal';
import CloudCoinIcon from '@/components/CloudCoinIcon';
import { useGetCallerProgress, useGetGlobalStatistics } from '@/hooks/useQueries';

const Home: React.FC = () => {
  const [gameMode, setGameMode] = useState<'none' | 'guest' | 'authenticated'>('none');
  const [showProfile, setShowProfile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showClan, setShowClan] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { login, loginStatus, identity } = useInternetIdentity();
  const { data: userProgress, isLoading: progressLoading } = useGetCallerProgress();
  const { data: globalStats, isLoading: statsLoading } = useGetGlobalStatistics();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handlePlayAsGuest = () => {
    setGameMode('guest');
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handlePlayAuthenticated = () => {
    setGameMode('authenticated');
  };

  const handleBackToHome = () => {
    setGameMode('none');
  };

  const formatNumber = (num: bigint | number): string => {
    const n = typeof num === 'bigint' ? Number(num) : num;
    if (n >= 1000000) {
      return (n / 1000000).toFixed(1) + 'M';
    } else if (n >= 1000) {
      return (n / 1000).toFixed(1) + 'K';
    }
    return n.toString();
  };

  // Get Cloud count - only for authenticated users from backend
  const cloudCount = isAuthenticated && userProgress ? Number(userProgress.clouds) : 0;

  if (gameMode !== 'none') {
    return <Game mode={gameMode} onBackToHome={handleBackToHome} />;
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Animated parallax background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200">
        {/* Cloud layer 1 - slow */}
        <div className="absolute inset-0 animate-float-slow opacity-30">
          <div className="absolute top-[10%] left-[10%] w-32 h-16 bg-white/40 rounded-full blur-xl"></div>
          <div className="absolute top-[30%] right-[15%] w-40 h-20 bg-white/40 rounded-full blur-xl"></div>
          <div className="absolute bottom-[20%] left-[20%] w-36 h-18 bg-white/40 rounded-full blur-xl"></div>
        </div>
        
        {/* Cloud layer 2 - medium */}
        <div className="absolute inset-0 animate-float-medium opacity-40">
          <div className="absolute top-[20%] right-[25%] w-28 h-14 bg-white/50 rounded-full blur-lg"></div>
          <div className="absolute top-[50%] left-[15%] w-32 h-16 bg-white/50 rounded-full blur-lg"></div>
          <div className="absolute bottom-[30%] right-[20%] w-30 h-15 bg-white/50 rounded-full blur-lg"></div>
        </div>
        
        {/* Cloud layer 3 - fast */}
        <div className="absolute inset-0 animate-float-fast opacity-50">
          <div className="absolute top-[15%] left-[30%] w-24 h-12 bg-white/60 rounded-full blur-md"></div>
          <div className="absolute top-[60%] right-[30%] w-28 h-14 bg-white/60 rounded-full blur-md"></div>
        </div>
      </div>

      {/* Cloud Points Display - Top Left - Only visible for authenticated users */}
      {isAuthenticated && (
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center gap-2 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-md rounded-full px-4 py-2.5 border border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]">
            {/* Cloud Coin Icon - Vector based */}
            <div className="relative">
              <CloudCoinIcon 
                size={32} 
                className="drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse-gentle"
              />
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md -z-10"></div>
            </div>
            
            {/* Cloud Count */}
            <div className="flex flex-col items-start">
              <div className="text-lg font-mono font-bold text-amber-300 leading-none tracking-wider drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                {formatNumber(cloudCount)}
              </div>
              <div className="text-[10px] font-medium text-slate-300 leading-none mt-0.5 uppercase tracking-wide">
                Clouds
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top-right buttons */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {/* Clan button - only visible for authenticated users */}
        {isAuthenticated && (
          <button
            onClick={() => setShowClan(true)}
            className="bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 border-2 border-purple-300"
          >
            <Shield className="h-6 w-6 text-purple-700" />
          </button>
        )}

        {/* Leaderboard button - only visible for authenticated users */}
        {isAuthenticated && (
          <button
            onClick={() => setShowLeaderboard(true)}
            className="bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 border-2 border-amber-300"
          >
            <Award className="h-6 w-6 text-amber-700" />
          </button>
        )}

        {/* Chat button - only visible for authenticated users */}
        {isAuthenticated && (
          <button
            onClick={() => setShowChat(true)}
            className="bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 border-2 border-sky-300"
          >
            <MessageCircle className="h-6 w-6 text-sky-700" />
          </button>
        )}

        {/* Profile button */}
        <button
          onClick={() => setShowProfile(true)}
          className="bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 border-2 border-sky-300"
        >
          <User className="h-6 w-6 text-sky-700" />
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center h-full overflow-y-auto py-8">
        <div className="text-center space-y-6 p-4 md:p-8 max-w-4xl mx-auto animate-fade-in-up">
          {/* Global Statistics Section */}
          {statsLoading ? (
            <div className="relative mb-6 px-2 space-y-3">
              <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] tracking-wide uppercase animate-pulse-gentle">
                Global Statistics
              </h2>
              <div className="relative overflow-hidden rounded-full bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-md border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <div className="relative flex items-center justify-center px-4 py-3">
                  <div className="text-sm text-cyan-300 animate-pulse">Loading statistics...</div>
                </div>
              </div>
            </div>
          ) : globalStats ? (
            <div className="relative mb-6 px-2 space-y-3">
              {/* Global Statistics Heading */}
              <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] tracking-wide uppercase animate-pulse-gentle">
                Global Statistics
              </h2>

              {/* Futuristic digital ticker bar */}
              <div className="relative overflow-hidden rounded-full bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-md border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-ticker-glow"></div>
                
                {/* Subtle scan line effect */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(34,211,238,0.03)_50%)] bg-[length:100%_4px]"></div>
                
                {/* Stats content */}
                <div className="relative flex items-center justify-center gap-3 md:gap-6 px-4 py-2.5 md:py-3">
                  {/* Total Players */}
                  <div className="flex items-center gap-1.5 md:gap-2 group">
                    <div className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-cyan-500/20 border border-cyan-400/40 group-hover:bg-cyan-500/30 transition-colors">
                      <Users className="h-3 w-3 md:h-3.5 md:w-3.5 text-cyan-300" />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="text-xs md:text-sm font-mono font-bold text-cyan-300 leading-none tracking-wider drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                        {formatNumber(globalStats.totalPlayers)}
                      </div>
                      <div className="text-[9px] md:text-[10px] font-medium text-slate-400 leading-none mt-0.5 uppercase tracking-wide">
                        Players
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-8 w-px bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent"></div>

                  {/* Total Jumps */}
                  <div className="flex items-center gap-1.5 md:gap-2 group">
                    <div className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 group-hover:bg-emerald-500/30 transition-colors">
                      <TrendingUp className="h-3 w-3 md:h-3.5 md:w-3.5 text-emerald-300" />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="text-xs md:text-sm font-mono font-bold text-emerald-300 leading-none tracking-wider drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]">
                        {formatNumber(globalStats.totalJumps)}
                      </div>
                      <div className="text-[9px] md:text-[10px] font-medium text-slate-400 leading-none mt-0.5 uppercase tracking-wide">
                        Jumps
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-8 w-px bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent"></div>

                  {/* Total Games */}
                  <div className="flex items-center gap-1.5 md:gap-2 group">
                    <div className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-purple-500/20 border border-purple-400/40 group-hover:bg-purple-500/30 transition-colors">
                      <Trophy className="h-3 w-3 md:h-3.5 md:w-3.5 text-purple-300" />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="text-xs md:text-sm font-mono font-bold text-purple-300 leading-none tracking-wider drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
                        {formatNumber(globalStats.totalGamesPlayed)}
                      </div>
                      <div className="text-[9px] md:text-[10px] font-medium text-slate-400 leading-none mt-0.5 uppercase tracking-wide">
                        Games
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-8 w-px bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent"></div>

                  {/* Total Height */}
                  <div className="flex items-center gap-1.5 md:gap-2 group">
                    <div className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-amber-500/20 border border-amber-400/40 group-hover:bg-amber-500/30 transition-colors">
                      <Mountain className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-300" />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="text-xs md:text-sm font-mono font-bold text-amber-300 leading-none tracking-wider drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                        {formatNumber(globalStats.totalHeightReached)}
                      </div>
                      <div className="text-[9px] md:text-[10px] font-medium text-slate-400 leading-none mt-0.5 uppercase tracking-wide">
                        Height
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom glow line */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
              </div>
            </div>
          ) : null}

          {/* Title with 3D effect */}
          <div className="relative">
            <h1 
              className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 drop-shadow-[0_8px_16px_rgba(251,191,36,0.5)] animate-bounce-gentle tracking-tight"
              style={{
                WebkitTextStroke: '2px black',
                paintOrder: 'stroke fill'
              }}
            >
              Cloud Jump
            </h1>
            <div className="absolute inset-0 text-6xl md:text-7xl font-black text-amber-900/20 blur-sm -z-10 translate-y-2">
              Cloud Jump
            </div>
          </div>

          {/* Character preview */}
          <div className="flex justify-center animate-bounce-gentle-delayed">
            <div className="relative">
              <img 
                src="/assets/AECB502E-B024-4E55-9562-6EB302661805-1.png" 
                alt="Cloud Jump Character"
                className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-radial from-amber-400/30 to-transparent blur-xl -z-10"></div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            {/* Play as Guest button - only show when not authenticated */}
            {!isAuthenticated && (
              <button
                onClick={handlePlayAsGuest}
                className="group relative w-full px-8 py-5 text-xl font-bold text-white rounded-2xl overflow-hidden transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700"></div>
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                <div className="absolute inset-0 rounded-2xl border-2 border-white/20"></div>
                <span className="relative z-10 drop-shadow-lg flex items-center justify-center gap-2">
                  <Play className="h-6 w-6" />
                  Play as Guest
                </span>
                <div className="absolute inset-0 rounded-2xl bg-emerald-900/50 translate-y-1 -z-10"></div>
              </button>
            )}

            {/* Login / Play Authenticated button */}
            {!isAuthenticated ? (
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="group relative w-full px-8 py-5 text-xl font-bold text-white rounded-2xl overflow-hidden transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-500 to-sky-700"></div>
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                <div className="absolute inset-0 rounded-2xl border-2 border-white/20"></div>
                <span className="relative z-10 drop-shadow-lg flex items-center justify-center gap-2">
                  <LogIn className="h-6 w-6" />
                  {isLoggingIn ? 'Logging in...' : 'Login with Internet Identity'}
                </span>
                <div className="absolute inset-0 rounded-2xl bg-sky-900/50 translate-y-1 -z-10"></div>
              </button>
            ) : (
              <button
                onClick={handlePlayAuthenticated}
                disabled={progressLoading}
                className="group relative w-full px-8 py-5 text-xl font-bold text-white rounded-2xl overflow-hidden transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-purple-400 via-purple-500 to-purple-700"></div>
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                <div className="absolute inset-0 rounded-2xl border-2 border-white/20"></div>
                <span className="relative z-10 drop-shadow-lg flex items-center justify-center gap-2">
                  <Play className="h-6 w-6" />
                  Start Game
                  {userProgress && (
                    <span className="ml-2 text-sm bg-white/20 px-2 py-1 rounded-full">
                      Level {Number(userProgress.level)}
                    </span>
                  )}
                </span>
                <div className="absolute inset-0 rounded-2xl bg-purple-900/50 translate-y-1 -z-10"></div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)}
        isAuthenticated={isAuthenticated}
      />

      {/* Chat Modal */}
      <ChatModal 
        isOpen={showChat} 
        onClose={() => setShowChat(false)}
      />

      {/* Clan Modal */}
      <ClanModal 
        isOpen={showClan} 
        onClose={() => setShowClan(false)}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal 
        isOpen={showLeaderboard} 
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
};

export default Home;
