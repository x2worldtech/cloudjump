import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useGameLogic } from '@/hooks/useGameLogic';
import { GameState } from '@/lib/types';
import { Pause, Play, RotateCcw, Smartphone, Home, Crown } from 'lucide-react';
import { useSubmitProgress, useUpdateGlobalStatistics, useGetCallerProgress } from '@/hooks/useQueries';
import CloudCoinIcon from '@/components/CloudCoinIcon';
import { calculatePrestige } from '@/lib/levelUtils';

interface GameProps {
  mode: 'guest' | 'authenticated';
  onBackToHome: () => void;
}

const Game: React.FC<GameProps> = ({ mode, onBackToHome }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [showTiltHint, setShowTiltHint] = useState(false);
  const [tiltHintDismissed, setTiltHintDismissed] = useState(false);
  const submitProgress = useSubmitProgress();
  const updateGlobalStatistics = useUpdateGlobalStatistics();
  const { data: userProgress } = useGetCallerProgress();
  const hasAutoStarted = useRef(false);
  const progressSubmitted = useRef(false);
  const statsSubmitted = useRef(false);
  
  // Local tracking for batch submission at game end
  const jumpCountRef = useRef(0);

  // Handle jump event - increment local counter only
  const handleJump = useCallback(() => {
    jumpCountRef.current += 1;
  }, []);

  const {
    score,
    highScore,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    isPaused,
    isMobile,
  } = useGameLogic(canvasRef, gameState, setGameState, handleJump);

  // Calculate current Clouds based on user progress (after score is available)
  const currentClouds = mode === 'authenticated' && userProgress 
    ? Number(userProgress.clouds) 
    : Math.floor(score / 2500);

  // Calculate prestige level for display
  const prestigeLevel = mode === 'authenticated' && userProgress
    ? calculatePrestige(Number(userProgress.xp), Number(userProgress.level))
    : 0;

  const isPrestigeActive = mode === 'authenticated' && userProgress && Number(userProgress.level) >= 100;

  useEffect(() => {
    const dismissed = localStorage.getItem('cloudJumpTiltHintDismissed');
    if (dismissed === 'true') {
      setTiltHintDismissed(true);
    }
  }, []);

  // Auto-start game for both guest and authenticated modes
  useEffect(() => {
    if (!hasAutoStarted.current) {
      hasAutoStarted.current = true;
      startGame();
      
      if (isMobile && !tiltHintDismissed) {
        setShowTiltHint(true);
        setTimeout(() => {
          setShowTiltHint(false);
          localStorage.setItem('cloudJumpTiltHintDismissed', 'true');
          setTiltHintDismissed(true);
        }, 4000);
      }
    }
  }, [startGame, isMobile, tiltHintDismissed]);

  const handlePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
      pauseGame();
    }
  }, [gameState, pauseGame]);

  const handleResume = useCallback(() => {
    if (gameState === 'paused') {
      setGameState('playing');
      resumeGame();
    }
  }, [gameState, resumeGame]);

  const handleRestart = useCallback(() => {
    progressSubmitted.current = false;
    statsSubmitted.current = false;
    jumpCountRef.current = 0; // Reset jump counter for new game
    setGameState('playing');
    resetGame();
  }, [resetGame]);

  const handleBackToMenu = useCallback(() => {
    onBackToHome();
  }, [onBackToHome]);

  // Batch submit progress and global statistics when game ends
  useEffect(() => {
    if (gameState === 'gameOver' && score > 0 && !statsSubmitted.current) {
      statsSubmitted.current = true;
      
      // Batch update global statistics (for both guest and authenticated users)
      // Submit jumps, games (1), and height in a single call
      console.log('Game over, batch updating global statistics:', {
        jumps: jumpCountRef.current,
        games: 1,
        height: score
      });
      
      updateGlobalStatistics.mutate({
        jumps: jumpCountRef.current,
        games: 1,
        height: score
      });
      
      // Submit personal progress (authenticated users only)
      if (mode === 'authenticated' && !progressSubmitted.current) {
        progressSubmitted.current = true;
        console.log('Game over, submitting progress for height:', score);
        submitProgress.mutate({ height: score });
      }
    }
  }, [gameState, mode, score, submitProgress, updateGlobalStatistics]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvas.width = width;
      canvas.height = height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-sky-200 to-sky-100">
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm border-b border-sky-300 py-2 px-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              onClick={onBackToHome}
              size="icon"
              variant="ghost"
              className="text-sky-700 hover:text-sky-900"
            >
              <Home className="h-5 w-5" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-sky-900">Cloud Jump</h1>
          </div>
          <div className="flex gap-3 md:gap-4 items-center">
            <div className="text-right">
              <div className="text-xs text-sky-700">Height</div>
              <div className="text-lg md:text-xl font-bold text-sky-900">{score}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-sky-700">Best</div>
              <div className="text-lg md:text-xl font-bold text-amber-600">{highScore}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Currency Display - Top Left Corner - Only visible for authenticated users */}
      {mode === 'authenticated' && (
        <div className="absolute top-16 md:top-20 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border-2 border-amber-300">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex-shrink-0">
              <CloudCoinIcon 
                size={32} 
                className="drop-shadow-md animate-pulse"
              />
            </div>
            <span className="text-lg md:text-xl font-bold text-amber-600 drop-shadow-sm">
              {currentClouds}
            </span>
          </div>
        </div>
      )}

      {/* Prestige Display - Top Left Corner (below Cloud Currency) - Only visible for authenticated users at level 100+ */}
      {isPrestigeActive && (
        <div className="absolute top-32 md:top-36 left-4 z-20 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border-2 border-purple-400">
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs text-purple-200 font-medium uppercase tracking-wide">Prestige</span>
              <span className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 drop-shadow-sm">
                {prestigeLevel}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-full">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="w-full h-full focus:outline-none"
          style={{ touchAction: 'none' }}
        />

        {showTiltHint && gameState === 'playing' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="bg-sky-900/90 text-white rounded-2xl p-6 md:p-8 mx-4 max-w-sm shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-3">
                <Smartphone className="h-8 w-8 flex-shrink-0" />
                <h3 className="text-xl md:text-2xl font-bold">Tip</h3>
              </div>
              <p className="text-base md:text-lg leading-relaxed">
                Tilt your phone left or right to control the character!
              </p>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 md:p-8 text-center space-y-4 shadow-2xl mx-4 border-4 border-sky-300">
              <h2 className="text-2xl md:text-3xl font-bold text-sky-900">Paused</h2>
              <div className="flex gap-3 md:gap-4">
                <Button onClick={handleResume} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg">
                  <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  Resume
                </Button>
                <Button onClick={handleBackToMenu} size="lg" variant="outline" className="font-bold border-2">
                  Menu
                </Button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 md:p-8 text-center space-y-4 md:space-y-6 shadow-2xl mx-4 border-4 border-red-300">
              <h2 className="text-3xl md:text-4xl font-bold text-red-600">Game Over!</h2>
              <div className="space-y-2">
                <p className="text-xl md:text-2xl text-sky-900">
                  Height: <span className="font-bold">{score}</span>
                </p>
                {mode === 'authenticated' && (
                  <>
                    <p className="text-sm text-sky-700">
                      XP Earned: <span className="font-bold text-emerald-600">+{score}</span>
                    </p>
                    <p className="text-sm text-amber-700">
                      Clouds Earned: <span className="font-bold text-amber-600">+{Math.floor(score / 2500)}</span>
                    </p>
                  </>
                )}
                {score === highScore && score > 0 && (
                  <p className="text-base md:text-lg text-amber-600 font-bold animate-bounce">🎉 New Record! 🎉</p>
                )}
                {mode === 'authenticated' && submitProgress.isPending && (
                  <p className="text-sm text-sky-600">Saving progress...</p>
                )}
                {mode === 'authenticated' && submitProgress.isSuccess && (
                  <p className="text-sm text-emerald-600">✓ Progress saved!</p>
                )}
                {mode === 'authenticated' && submitProgress.isError && (
                  <p className="text-sm text-red-600">⚠ Failed to save progress</p>
                )}
              </div>
              <div className="flex gap-3 md:gap-4 justify-center">
                <Button onClick={handleRestart} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg">
                  <RotateCcw className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  New Game
                </Button>
                <Button onClick={handleBackToMenu} size="lg" variant="outline" className="font-bold border-2">
                  Menu
                </Button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <Button
            onClick={handlePause}
            size="icon"
            className="absolute top-16 md:top-20 right-4 bg-white/80 hover:bg-white text-sky-900 z-20 shadow-lg"
            variant="outline"
          >
            <Pause className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Game;
