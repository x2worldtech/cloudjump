import CloudCoinIcon from "@/components/CloudCoinIcon";
import { Button } from "@/components/ui/button";
import { useGameLogic } from "@/hooks/useGameLogic";
import {
  useGetCallerProgress,
  useSubmitProgress,
  useUpdateGlobalStatistics,
} from "@/hooks/useQueries";
import { calculatePrestige } from "@/lib/levelUtils";
import type { GameState } from "@/lib/types";
import { Crown, Home, Pause, Play, RotateCcw, Smartphone } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface GameProps {
  mode: "guest" | "authenticated";
  onBackToHome: () => void;
}

const Game: React.FC<GameProps> = ({ mode, onBackToHome }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [showTiltHint, setShowTiltHint] = useState(false);
  const [tiltHintDismissed, setTiltHintDismissed] = useState(false);

  const submitProgress = useSubmitProgress();
  const updateGlobalStatistics = useUpdateGlobalStatistics();
  const { data: userProgress } = useGetCallerProgress();

  const hasAutoStarted = useRef(false);
  const progressSubmitted = useRef(false);
  const statsSubmitted = useRef(false);

  const jumpCountRef = useRef(0);

  const handleJump = useCallback(() => {
    jumpCountRef.current += 1;
  }, []);

  const {
    score,
    highScore,
    hud,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    shoot,
    isMobile,
  } = useGameLogic(canvasRef, gameState, setGameState, handleJump);

  const currentClouds =
    mode === "authenticated" && userProgress
      ? Number(userProgress.clouds)
      : Math.floor(score / 2500);

  const prestigeLevel =
    mode === "authenticated" && userProgress
      ? calculatePrestige(Number(userProgress.xp), Number(userProgress.level))
      : 0;

  const isPrestigeActive =
    mode === "authenticated" &&
    userProgress &&
    Number(userProgress.level) >= 100;

  useEffect(() => {
    const dismissed = localStorage.getItem("cloudJumpHowToDismissed");
    if (dismissed === "true") {
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
        const t = setTimeout(() => {
          setShowTiltHint(false);
          try {
            localStorage.setItem("cloudJumpHowToDismissed", "true");
          } catch {
            /* ignore */
          }
          setTiltHintDismissed(true);
        }, 4000);
        return () => clearTimeout(t);
      }
    }
  }, [startGame, isMobile, tiltHintDismissed]);

  const handlePause = useCallback(() => {
    if (gameState === "playing") {
      setGameState("paused");
      pauseGame();
    }
  }, [gameState, pauseGame]);

  const handleResume = useCallback(() => {
    if (gameState === "paused") {
      setGameState("playing");
      resumeGame();
    }
  }, [gameState, resumeGame]);

  const handleRestart = useCallback(() => {
    progressSubmitted.current = false;
    statsSubmitted.current = false;
    jumpCountRef.current = 0;
    setGameState("playing");
    resetGame();
  }, [resetGame]);

  const handleBackToMenu = useCallback(() => {
    onBackToHome();
  }, [onBackToHome]);

  // Batch submit progress + stats once when the game ends.
  // We deliberately leave the mutation hooks out of the deps to avoid
  // accidental double-submits when the hook identity changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    if (gameState !== "gameOver" || score <= 0) return;
    if (statsSubmitted.current) return;
    statsSubmitted.current = true;

    updateGlobalStatistics.mutate({
      jumps: jumpCountRef.current,
      games: 1,
      height: score,
    });

    if (mode === "authenticated" && !progressSubmitted.current) {
      progressSubmitted.current = true;
      submitProgress.mutate({ height: score });
    }
  }, [gameState, mode, score]);

  // Boost meter color
  const boostColor =
    hud.boost?.type === "rocket"
      ? "from-red-400 to-orange-400"
      : hud.boost?.type === "jetpack"
        ? "from-sky-400 to-blue-500"
        : "from-amber-300 to-amber-500";

  const boostLabel =
    hud.boost?.type === "rocket"
      ? "Rocket"
      : hud.boost?.type === "jetpack"
        ? "Jetpack"
        : hud.boost?.type === "propeller"
          ? "Propeller"
          : "";

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-sky-200 to-sky-100">
      {/* Top bar */}
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
            <h1 className="text-xl md:text-2xl font-bold text-sky-900">
              Cloud Jump
            </h1>
          </div>
          <div className="flex gap-3 md:gap-4 items-center">
            <div className="text-right">
              <div className="text-xs text-sky-700">Height</div>
              <div className="text-lg md:text-xl font-bold text-sky-900 tabular-nums">
                {score}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-sky-700">Best</div>
              <div className="text-lg md:text-xl font-bold text-amber-600 tabular-nums">
                {highScore}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud currency - only for authenticated users */}
      {mode === "authenticated" && (
        <div className="absolute top-16 md:top-20 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border-2 border-amber-300">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex-shrink-0">
              <CloudCoinIcon size={32} className="drop-shadow-md" />
            </div>
            <span className="text-lg md:text-xl font-bold text-amber-600 drop-shadow-sm tabular-nums">
              {currentClouds}
            </span>
          </div>
        </div>
      )}

      {/* Prestige badge - only for level 100+ */}
      {isPrestigeActive && (
        <div className="absolute top-32 md:top-36 left-4 z-20 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border-2 border-purple-400">
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs text-purple-200 font-medium uppercase tracking-wide">
                Prestige
              </span>
              <span className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 drop-shadow-sm">
                {prestigeLevel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Combo indicator - center top, only when active */}
      {hud.combo > 1 && gameState === "playing" && (
        <div className="absolute left-1/2 -translate-x-1/2 top-16 md:top-20 z-20 pointer-events-none">
          <div
            key={hud.combo}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 shadow-[0_0_18px_rgba(244,114,182,0.6)] border-2 border-white/40 animate-combo-pop"
          >
            <span className="text-white font-black text-sm md:text-base tracking-wide drop-shadow-sm">
              x{hud.combo} COMBO
            </span>
          </div>
        </div>
      )}

      {/* Boost timer bar - bottom of screen, only when active */}
      {hud.boost && gameState === "playing" && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-56 md:w-72">
          <div className="text-center text-xs font-bold text-white drop-shadow-md tracking-wider uppercase mb-1">
            {boostLabel}
          </div>
          <div className="h-2 rounded-full bg-black/40 backdrop-blur-sm overflow-hidden border border-white/30 shadow-lg">
            <div
              className={`h-full bg-gradient-to-r ${boostColor} transition-[width] duration-150 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
              style={{ width: `${Math.max(0, Math.min(1, hud.boost.remaining)) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="w-full h-full">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="w-full h-full focus:outline-none block"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            if (gameState !== "playing") return;
            // Don't fire from synthetic clicks on the pause button - those
            // bubble up but won't have a real pointerId from the canvas itself
            // (the button stops propagation via React's own handler).
            e.preventDefault();
            shoot();
          }}
        />

        {/* Mobile tilt hint */}
        {showTiltHint && gameState === "playing" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="bg-sky-900/90 text-white rounded-2xl p-6 md:p-8 mx-4 max-w-sm shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-3">
                <Smartphone className="h-8 w-8 flex-shrink-0" />
                <h3 className="text-xl md:text-2xl font-bold">How to play</h3>
              </div>
              <p className="text-base md:text-lg leading-relaxed">
                <span className="font-bold">Tilt</span> your phone to move.<br />
                <span className="font-bold">Tap</span> the screen to shoot!
              </p>
            </div>
          </div>
        )}

        {/* Paused overlay */}
        {gameState === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
            <div className="bg-white rounded-2xl p-6 md:p-8 text-center space-y-4 shadow-2xl mx-4 border-4 border-sky-300">
              <h2 className="text-2xl md:text-3xl font-bold text-sky-900">
                Paused
              </h2>
              <div className="flex gap-3 md:gap-4">
                <Button
                  onClick={handleResume}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg"
                >
                  <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  Resume
                </Button>
                <Button
                  onClick={handleBackToMenu}
                  size="lg"
                  variant="outline"
                  className="font-bold border-2"
                >
                  Menu
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Game over */}
        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
            <div className="bg-white rounded-2xl p-6 md:p-8 text-center space-y-4 md:space-y-6 shadow-2xl mx-4 border-4 border-red-300 max-w-sm w-full animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-3xl md:text-4xl font-bold text-red-600">
                Game Over!
              </h2>
              <div className="space-y-2">
                <p className="text-xl md:text-2xl text-sky-900">
                  Height: <span className="font-bold tabular-nums">{score}</span>
                </p>
                {mode === "authenticated" && (
                  <>
                    <p className="text-sm text-sky-700">
                      XP Earned:{" "}
                      <span className="font-bold text-emerald-600">+{score}</span>
                    </p>
                    <p className="text-sm text-amber-700">
                      Clouds Earned:{" "}
                      <span className="font-bold text-amber-600">
                        +{Math.floor(score / 2500)}
                      </span>
                    </p>
                  </>
                )}
                {score >= highScore && score > 0 && (
                  <p className="text-base md:text-lg text-amber-600 font-bold animate-bounce">
                    🎉 New Record! 🎉
                  </p>
                )}
                {mode === "authenticated" && submitProgress.isPending && (
                  <p className="text-sm text-sky-600">Saving progress...</p>
                )}
                {mode === "authenticated" && submitProgress.isSuccess && (
                  <p className="text-sm text-emerald-600">✓ Progress saved!</p>
                )}
                {mode === "authenticated" && submitProgress.isError && (
                  <p className="text-sm text-red-600">
                    ⚠ Failed to save progress
                  </p>
                )}
              </div>
              <div className="flex gap-3 md:gap-4 justify-center">
                <Button
                  onClick={handleRestart}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg"
                >
                  <RotateCcw className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  New Game
                </Button>
                <Button
                  onClick={handleBackToMenu}
                  size="lg"
                  variant="outline"
                  className="font-bold border-2"
                >
                  Menu
                </Button>
              </div>
            </div>
          </div>
        )}

        {gameState === "playing" && (
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
