import {
  AIM_IDLE_ANGLE,
  AIM_LERP_SPEED,
  AIM_SHOOT_MAX_ANGLE,
  BULLET_SPEED,
  ENEMY_KILLED_BY_BOOST,
  ENEMY_KILLED_BY_BULLET,
  GRAVITY,
  JETPACK_BOOST,
  JETPACK_DURATION,
  JUMP_VELOCITY,
  MAX_PARTICLES,
  MOVE_SPEED,
  PLATFORM_HEIGHT,
  PLATFORM_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PROPELLER_BOOST,
  PROPELLER_DURATION,
  ROCKET_BOOST,
  ROCKET_DURATION,
  SHOOT_POSE_MS,
  SPRING_BOOST,
  STOMP_BASE_SCORE,
  STOMP_BOUNCE_FACTOR,
  STOMP_COMBO_MULTIPLIER,
  STOMP_COMBO_WINDOW_MS,
} from "@/lib/constants";
import { drawGame, resetBackgroundClouds } from "@/lib/gameRenderer";
import type {
  Bullet,
  Enemy,
  EnemyType,
  GameState,
  Particle,
  Platform,
  Player,
  PowerUp,
  PowerUpType,
} from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { isMobileDevice, useDeviceOrientation } from "./useDeviceOrientation";

// -----------------------------------------------------------------------------
// Audio - lazy AudioContext + tiny synth-style SFX
// -----------------------------------------------------------------------------
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    try {
      audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    } catch {
      return null;
    }
  }
  return audioContext;
};

function playJumpSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    /* ignore */
  }
}

function playJetpackSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  } catch {
    /* ignore */
  }
}

function playRocketSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + 0.5);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.5);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  } catch {
    /* ignore */
  }
}

function playStompSound(combo: number) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    // higher pitch for higher combo
    const base = 350 + Math.min(combo, 6) * 80;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.8, now + 0.12);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.18);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    /* ignore */
  }
}

function playPickupSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1300, now + 0.12);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    /* ignore */
  }
}

function playShootSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.12);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.13);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  } catch {
    /* ignore */
  }
}

function playGameOverSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.5);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  } catch {
    /* ignore */
  }
}

// CSS pixel canvas size helpers - pure module-level functions so they're
// stable references and never need to live in useCallback dependency arrays.
function cssWidthOf(canvas: HTMLCanvasElement | null): number {
  return canvas ? canvas.clientWidth || window.innerWidth : window.innerWidth;
}
function cssHeightOf(canvas: HTMLCanvasElement | null): number {
  return canvas ? canvas.clientHeight || window.innerHeight : window.innerHeight;
}

// Particle helpers - operate on a ref, no closures over state.
function pushParticle(particles: Particle[], p: Particle) {
  if (particles.length >= MAX_PARTICLES) particles.shift();
  particles.push(p);
}

function spawnJumpDust(particles: Particle[], x: number, y: number) {
  for (let i = 0; i < 6; i++) {
    const ang = Math.PI + (Math.random() - 0.5) * Math.PI * 0.6;
    const sp = 1 + Math.random() * 1.5;
    pushParticle(particles, {
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: -Math.abs(Math.sin(ang)) * sp * 0.4 + 0.3,
      life: 24,
      maxLife: 24,
      size: 2 + Math.random() * 2,
      color: "rgba(255,255,255,0.85)",
      gravity: 0.08,
      fade: true,
    });
  }
}

function spawnPickupBurst(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
) {
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const sp = 1.2 + Math.random() * 1.5;
    pushParticle(particles, {
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life: 28,
      maxLife: 28,
      size: 2 + Math.random() * 2,
      color,
      gravity: 0.05,
      fade: true,
    });
  }
}

function spawnEnemyPop(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
) {
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const sp = 1.5 + Math.random() * 2;
    pushParticle(particles, {
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life: 32,
      maxLife: 32,
      size: 2 + Math.random() * 3,
      color,
      gravity: 0.1,
      fade: true,
    });
  }
}

function spawnRocketTrail(particles: Particle[], x: number, y: number) {
  pushParticle(particles, {
    x: x + (Math.random() - 0.5) * 6,
    y,
    vx: (Math.random() - 0.5) * 0.5,
    vy: 1 + Math.random() * 1.5,
    life: 18,
    maxLife: 18,
    size: 2 + Math.random() * 2,
    color: "rgba(255,170,60,0.85)",
    gravity: 0,
    fade: true,
  });
}

function spawnBreakingCloudDust(
  particles: Particle[],
  px: number,
  py: number,
  pw: number,
  ph: number,
) {
  for (let i = 0; i < 8; i++) {
    pushParticle(particles, {
      x: px + Math.random() * pw,
      y: py + Math.random() * ph,
      vx: (Math.random() - 0.5) * 2,
      vy: 0.5 + Math.random() * 1.5,
      life: 36,
      maxLife: 36,
      size: 2 + Math.random() * 2,
      color: "rgba(190,195,205,0.9)",
      gravity: 0.08,
      fade: true,
    });
  }
}

// -----------------------------------------------------------------------------
// HUD info exported to React (combo + active boost)
// -----------------------------------------------------------------------------
export interface GameHud {
  combo: number;
  boost: null | {
    type: "propeller" | "jetpack" | "rocket";
    remaining: number; // 0..1
  };
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------
export function useGameLogic(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  gameState: GameState,
  setGameState: (state: GameState) => void,
  onJump?: () => void,
) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [hud, setHud] = useState<GameHud>({ combo: 0, boost: null });

  // Refs - never trigger renders
  const playerRef = useRef<Player | null>(null);
  const platformsRef = useRef<Platform[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ [k: string]: boolean }>({});
  const animationFrameRef = useRef<number | null>(null);

  const worldOffsetRef = useRef(0);
  const maxHeightRef = useRef(0);
  const highestPlatformYRef = useRef(0);
  const gameTimeRef = useRef(0); // ms
  const lastFrameTimeRef = useRef(0);
  const gameOverSoundPlayedRef = useRef(false);

  // Combo system
  const lastStompTimeRef = useRef(0);
  const comboRef = useRef(0);

  // Shoot cooldown - prevents spam-tapping from spawning 60 bullets/sec
  const lastShotTimeRef = useRef(0);

  // Pause carry-over (do not freeze game time when paused)
  const isPausedRef = useRef(false);

  // Cached high score from localStorage
  useEffect(() => {
    try {
      const v = localStorage.getItem("cloudJumpHighScore");
      if (v) {
        const n = parseInt(v, 10);
        if (Number.isFinite(n)) setHighScore(n);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist high score whenever it grows
  useEffect(() => {
    if (highScore <= 0) return;
    try {
      localStorage.setItem("cloudJumpHighScore", String(highScore));
    } catch {
      /* ignore */
    }
  }, [highScore]);

  // Device orientation - tilt controls on mobile
  const isMobile = isMobileDevice();
  const deviceOrientation = useDeviceOrientation(
    isMobile && gameState === "playing",
  );

  // ---------------------------------------------------------------------------
  // DPR-aware canvas resize. Crisp on retina/phone displays.
  // ---------------------------------------------------------------------------
  const setupCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resetBackgroundClouds();
  }, [canvasRef]);

  useEffect(() => {
    setupCanvasSize();
    const onResize = () => setupCanvasSize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [setupCanvasSize]);

  // ---------------------------------------------------------------------------
  // Platform / enemy / power-up factories
  // ---------------------------------------------------------------------------
  const createPlatform = useCallback((x: number, y: number): Platform => {
    const isMoving = Math.random() < 0.175;
    const p: Platform = {
      x,
      y,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      type: Math.random() < 0.75 ? "normal" : "breaking",
      broken: false,
    };
    if (isMoving) {
      p.isMoving = true;
      p.movingBaseX = x;
      p.movingSpeed = 0.8 + Math.random() * 0.6;
      p.movingRange = 40 + Math.random() * 40;
    }
    return p;
  }, []);

  const createEnemy = useCallback(
    (canvasW: number, y: number, difficulty: number): Enemy => {
      // Spawn weights vary with difficulty.
      // Blobs always available. Bats appear after low difficulty,
      // spikies appear once climb is meaningful.
      const r = Math.random();
      let type: EnemyType = "blob";
      if (difficulty > 0.15 && r > 0.65 && r <= 0.9) {
        type = "bat";
      } else if (difficulty > 0.3 && r > 0.9) {
        type = "spiky";
      }

      const baseW = type === "spiky" ? 38 : type === "bat" ? 40 : 35;
      const baseH = type === "spiky" ? 38 : type === "bat" ? 32 : 35;

      const e: Enemy = {
        x: Math.random() * (canvasW - baseW),
        y,
        width: baseW,
        height: baseH,
        alive: true,
        type,
        wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.8 + Math.random() * 0.6,
      };

      if (type === "bat") {
        e.driftBaseX = e.x;
        e.driftSpeed = 0.6 + Math.random() * 0.5;
        e.driftRange = 60 + Math.random() * 60;
      }

      return e;
    },
    [],
  );

  const pickPowerUpType = useCallback((): PowerUpType => {
    const r = Math.random();
    if (r > 0.95) return "rocket";
    if (r < 0.4) return "spring";
    if (r < 0.7) return "propeller";
    return "jetpack";
  }, []);

  const updateMovingPlatforms = useCallback((canvasWidth: number) => {
    for (const p of platformsRef.current) {
      if (
        p.isMoving &&
        p.movingBaseX !== undefined &&
        p.movingSpeed !== undefined &&
        p.movingRange !== undefined
      ) {
        const t = gameTimeRef.current * 0.001;
        const off = Math.sin(t * p.movingSpeed) * p.movingRange;
        p.x = p.movingBaseX + off;
        if (p.x < 0) {
          p.movingBaseX += Math.abs(p.x);
          p.x = 0;
        } else if (p.x + p.width > canvasWidth) {
          p.movingBaseX -= p.x + p.width - canvasWidth;
          p.x = canvasWidth - p.width;
        }
      }
    }
  }, []);

  const updateEnemies = useCallback((canvasWidth: number) => {
    for (const e of enemiesRef.current) {
      if (!e.alive) continue;
      if (
        e.type === "bat" &&
        e.driftBaseX !== undefined &&
        e.driftSpeed !== undefined &&
        e.driftRange !== undefined
      ) {
        const t = gameTimeRef.current * 0.001;
        e.x = e.driftBaseX + Math.sin(t * e.driftSpeed) * e.driftRange;
        if (e.x < 0) {
          e.driftBaseX += -e.x;
          e.x = 0;
        } else if (e.x + e.width > canvasWidth) {
          e.driftBaseX -= e.x + e.width - canvasWidth;
          e.x = canvasWidth - e.width;
        }
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Game init
  // ---------------------------------------------------------------------------
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = cssWidthOf(canvas);
    const ch = cssHeightOf(canvas);

    const playerFixedY = ch * 0.6;
    const startX = cw / 2 - PLAYER_WIDTH / 2;

    playerRef.current = {
      x: startX,
      y: playerFixedY,
      vx: 0,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      hasPropeller: false,
      propellerTime: 0,
      hasJetpack: false,
      jetpackTime: 0,
      hasRocket: false,
      rocketTime: 0,
      facing: 1,
      squash: 0,
      // Aim angle: starts pointing to the right side (+PI/2 = right horizontal)
      aimAngle: Math.PI / 2,
    };

    platformsRef.current = [];
    enemiesRef.current = [];
    powerUpsRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    worldOffsetRef.current = 0;
    maxHeightRef.current = 0;
    gameTimeRef.current = 0;
    lastFrameTimeRef.current = 0;
    gameOverSoundPlayedRef.current = false;
    comboRef.current = 0;
    lastStompTimeRef.current = 0;
    setScore(0);
    setHud({ combo: 0, boost: null });

    // Starting platform directly under the player (never moving, never breaking)
    const startPlatform: Platform = {
      x: startX + PLAYER_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: playerFixedY + PLAYER_HEIGHT + 25,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      type: "normal",
      broken: false,
      isMoving: false,
    };
    platformsRef.current.push(startPlatform);
    highestPlatformYRef.current = startPlatform.y;

    // Generate initial column of platforms 2 screens above the start.
    let currentY = startPlatform.y - (60 + Math.random() * 25);
    const targetY = -ch * 2;
    while (currentY > targetY) {
      const px = Math.random() * (cw - PLATFORM_WIDTH);
      const p = createPlatform(px, currentY);
      platformsRef.current.push(p);
      if (currentY < highestPlatformYRef.current) {
        highestPlatformYRef.current = currentY;
      }
      // Power-ups
      if (Math.random() < 0.12) {
        powerUpsRef.current.push({
          x: p.x + PLATFORM_WIDTH / 2 - 12,
          y: p.y - 22,
          type: pickPowerUpType(),
          used: false,
        });
      }
      // Enemies
      if (Math.random() < 0.08) {
        enemiesRef.current.push(createEnemy(cw, currentY - 50, 0));
      }
      currentY -= 60 + Math.random() * 25;
    }
  }, [canvasRef, createPlatform, createEnemy, pickPowerUpType]);

  const generatePlatformsAbove = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = cssWidthOf(canvas);
    const ch = cssHeightOf(canvas);

    const generationThreshold = highestPlatformYRef.current - ch * 2.5;
    while (highestPlatformYRef.current > generationThreshold) {
      const heightClimbed = worldOffsetRef.current;
      const difficulty = Math.min(heightClimbed / 3000, 0.7);

      const minSpacing = 55;
      const maxSpacing = 80 + difficulty * 20;
      const spacing = minSpacing + Math.random() * (maxSpacing - minSpacing);
      const newY = highestPlatformYRef.current - spacing;

      const breakingChance = 0.12 + difficulty * 0.25;
      const px = Math.random() * (cw - PLATFORM_WIDTH);
      const p = createPlatform(px, newY);
      if (Math.random() < breakingChance) p.type = "breaking";
      platformsRef.current.push(p);
      highestPlatformYRef.current = newY;

      const powerUpChance = 0.1 + difficulty * 0.06;
      if (Math.random() < powerUpChance) {
        powerUpsRef.current.push({
          x: p.x + PLATFORM_WIDTH / 2 - 12,
          y: p.y - 22,
          type: pickPowerUpType(),
          used: false,
        });
      }

      const enemyChance = 0.05 + difficulty * 0.12;
      if (Math.random() < enemyChance) {
        enemiesRef.current.push(createEnemy(cw, newY - 50, difficulty));
      }
    }
  }, [canvasRef, createPlatform, createEnemy, pickPowerUpType]);

  // ---------------------------------------------------------------------------
  // Game loop
  // ---------------------------------------------------------------------------
  // Read-only refs for state so the loop never rebinds
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const setGameStateRef = useRef(setGameState);
  useEffect(() => {
    setGameStateRef.current = setGameState;
  }, [setGameState]);

  const onJumpRef = useRef(onJump);
  useEffect(() => {
    onJumpRef.current = onJump;
  }, [onJump]);

  const deviceOrientationRef = useRef(deviceOrientation);
  useEffect(() => {
    deviceOrientationRef.current = deviceOrientation;
  }, [deviceOrientation]);

  // Throttle HUD setState to ~6 fps so we don't re-render every frame.
  const lastHudPushRef = useRef(0);

  const gameLoop = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      const player = playerRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !player || !ctx) {
        animationFrameRef.current = null;
        return;
      }
      if (gameStateRef.current !== "playing") {
        animationFrameRef.current = null;
        return;
      }

      // Delta time in ms - clamped so a backgrounded tab doesn't teleport entities.
      let dt = lastFrameTimeRef.current ? now - lastFrameTimeRef.current : 16;
      if (dt > 60) dt = 60;
      lastFrameTimeRef.current = now;
      gameTimeRef.current += dt;

      const cw = cssWidthOf(canvas);
      const ch = cssHeightOf(canvas);

      updateMovingPlatforms(cw);
      updateEnemies(cw);

      // Game over by falling off the screen
      if (player.y > ch + 100) {
        if (!gameOverSoundPlayedRef.current) {
          playGameOverSound();
          gameOverSoundPlayedRef.current = true;
        }
        setGameStateRef.current("gameOver");
        animationFrameRef.current = null;
        return;
      }

      // Input: keyboard, tilt
      let moveDir = 0;
      if (keysRef.current.ArrowLeft || keysRef.current.a || keysRef.current.A) {
        moveDir = -1;
      } else if (
        keysRef.current.ArrowRight ||
        keysRef.current.d ||
        keysRef.current.D
      ) {
        moveDir = 1;
      }
      const orient = deviceOrientationRef.current;
      if (isMobile && orient.permissionGranted && Math.abs(orient.tiltX) > 0.05) {
        moveDir = orient.tiltX;
      }

      if (moveDir !== 0) {
        player.facing = moveDir < 0 ? -1 : 1;
      }
      player.vx = moveDir * MOVE_SPEED;
      player.x += player.vx;

      // ----- Aim angle interpolation -----
      // Default target: idle side-pose, pointing toward `facing` direction.
      // Right side = +AIM_IDLE_ANGLE, left side = -AIM_IDLE_ANGLE.
      // After a shot, hold the upward shoot-pose for SHOOT_POSE_MS, then
      // ease back to idle.
      const sinceShot = gameTimeRef.current - lastShotTimeRef.current;
      let targetAim: number;
      if (sinceShot < SHOOT_POSE_MS) {
        // Hold the shot direction (already clamped to AIM_SHOOT_MAX_ANGLE in tryShoot).
        // We leave aimAngle alone here so the player.aimAngle set by tryShoot
        // stays put; just compute the same value for the lerp.
        targetAim = Math.max(
          -AIM_SHOOT_MAX_ANGLE,
          Math.min(AIM_SHOOT_MAX_ANGLE, player.aimAngle),
        );
      } else {
        targetAim = player.facing < 0 ? -AIM_IDLE_ANGLE : AIM_IDLE_ANGLE;
      }
      // Lerp toward target (shortest angular distance)
      let delta = targetAim - player.aimAngle;
      // Normalize to [-PI, PI]
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      player.aimAngle += delta * AIM_LERP_SPEED;

      // Wrap horizontally
      if (player.x < -player.width) player.x = cw;
      else if (player.x > cw) player.x = -player.width;

      // Boost logic
      let activeBoost: GameHud["boost"] = null;
      if (player.hasRocket && player.rocketTime > 0) {
        player.vy = -ROCKET_BOOST;
        player.rocketTime--;
        if (player.rocketTime <= 0) player.hasRocket = false;
        spawnRocketTrail(
          particlesRef.current,
          player.x + player.width / 2,
          player.y + player.height,
        );
        activeBoost = {
          type: "rocket",
          remaining: player.rocketTime / ROCKET_DURATION,
        };
      } else if (player.hasJetpack && player.jetpackTime > 0) {
        player.vy = -JETPACK_BOOST;
        player.jetpackTime--;
        if (player.jetpackTime <= 0) player.hasJetpack = false;
        if (player.jetpackTime % 2 === 0) {
          spawnRocketTrail(
            particlesRef.current,
            player.x + player.width * 0.55,
            player.y + player.height * 0.5,
          );
        }
        activeBoost = {
          type: "jetpack",
          remaining: player.jetpackTime / JETPACK_DURATION,
        };
      } else if (player.hasPropeller && player.propellerTime > 0) {
        player.vy = -PROPELLER_BOOST;
        player.propellerTime--;
        if (player.propellerTime <= 0) player.hasPropeller = false;
        activeBoost = {
          type: "propeller",
          remaining: player.propellerTime / PROPELLER_DURATION,
        };
      } else {
        player.vy += GRAVITY;
      }
      player.y += player.vy;

      // Squash decays each frame
      if (player.squash > 0) {
        player.squash = Math.max(0, player.squash - 0.06);
      }

      // Platform collision (only when falling)
      if (player.vy > 0) {
        for (const p of platformsRef.current) {
          if (p.broken) continue;
          if (
            player.x + player.width > p.x &&
            player.x < p.x + p.width &&
            player.y + player.height > p.y &&
            player.y + player.height < p.y + p.height + 10
          ) {
            playJumpSound();
            onJumpRef.current?.();
            player.vy = JUMP_VELOCITY;
            player.squash = 1;
            spawnJumpDust(
              particlesRef.current,
              p.x + p.width / 2,
              p.y + p.height,
            );
            if (p.type === "breaking") {
              p.broken = true;
              spawnBreakingCloudDust(
                particlesRef.current,
                p.x,
                p.y,
                p.width,
                p.height,
              );
            }
            // Only register the first colliding platform per frame.
            break;
          }
        }
      }

      // Power-up collision (blocked while a stronger boost is active)
      const hasActiveBoost =
        (player.hasRocket && player.rocketTime > 0) ||
        (player.hasJetpack && player.jetpackTime > 0) ||
        (player.hasPropeller && player.propellerTime > 0);

      if (!hasActiveBoost) {
        for (const pu of powerUpsRef.current) {
          if (pu.used) continue;
          if (
            player.x + player.width > pu.x &&
            player.x < pu.x + 24 &&
            player.y + player.height > pu.y &&
            player.y < pu.y + 24
          ) {
            pu.used = true;
            playPickupSound();
            const pickupColor =
              pu.type === "spring"
                ? "rgba(80,170,255,0.95)"
                : pu.type === "propeller"
                  ? "rgba(255,200,80,0.95)"
                  : pu.type === "jetpack"
                    ? "rgba(120,180,255,0.95)"
                    : "rgba(255,140,140,0.95)";
            spawnPickupBurst(particlesRef.current, pu.x + 12, pu.y + 12, pickupColor);

            if (pu.type === "spring") {
              playJumpSound();
              onJumpRef.current?.();
              player.vy = SPRING_BOOST;
              player.squash = 1;
            } else if (pu.type === "propeller") {
              player.hasPropeller = true;
              player.propellerTime = PROPELLER_DURATION;
            } else if (pu.type === "jetpack") {
              playJetpackSound();
              player.hasJetpack = true;
              player.jetpackTime = JETPACK_DURATION;
              player.hasPropeller = false;
              player.propellerTime = 0;
            } else if (pu.type === "rocket") {
              playRocketSound();
              player.hasRocket = true;
              player.rocketTime = ROCKET_DURATION;
              player.hasJetpack = false;
              player.jetpackTime = 0;
              player.hasPropeller = false;
              player.propellerTime = 0;
            }
            break;
          }
        }
      }

      // Enemy collision
      let bonusFromEnemies = 0;
      for (const e of enemiesRef.current) {
        if (!e.alive) continue;
        if (
          !(
            player.x + player.width > e.x &&
            player.x < e.x + e.width &&
            player.y + player.height > e.y &&
            player.y < e.y + e.height
          )
        ) {
          continue;
        }

        // Boost invulnerability
        if (
          (player.hasRocket && player.rocketTime > 0) ||
          (player.hasJetpack && player.jetpackTime > 0)
        ) {
          e.alive = false;
          spawnEnemyPop(
            particlesRef.current,
            e.x + e.width / 2,
            e.y + e.height / 2,
            e.type === "spiky" ? "rgba(255,120,80,0.95)" : "rgba(180,150,255,0.95)",
          );
          bonusFromEnemies += ENEMY_KILLED_BY_BOOST;
          continue;
        }

        if (e.type === "spiky") {
          // Spiky cannot be stomped - instant game over
          if (!gameOverSoundPlayedRef.current) {
            playGameOverSound();
            gameOverSoundPlayedRef.current = true;
          }
          setGameStateRef.current("gameOver");
          animationFrameRef.current = null;
          return;
        }

        // Stomp logic for blob/bat
        const playerBottom = player.y + player.height;
        const enemyMid = e.y + e.height / 2;
        const isStomp = player.vy > 0 && playerBottom < enemyMid;

        if (isStomp) {
          e.alive = false;
          player.vy = JUMP_VELOCITY * STOMP_BOUNCE_FACTOR;
          player.squash = 1;

          // Update combo
          const nowMs = gameTimeRef.current;
          if (nowMs - lastStompTimeRef.current <= STOMP_COMBO_WINDOW_MS) {
            comboRef.current += 1;
          } else {
            comboRef.current = 1;
          }
          lastStompTimeRef.current = nowMs;

          const comboBonus =
            STOMP_BASE_SCORE *
            (1 + (comboRef.current - 1) * STOMP_COMBO_MULTIPLIER);
          bonusFromEnemies += Math.round(comboBonus);
          playStompSound(comboRef.current);
          spawnEnemyPop(
            particlesRef.current,
            e.x + e.width / 2,
            e.y + e.height / 2,
            e.type === "bat" ? "rgba(120,180,255,0.95)" : "rgba(180,140,255,0.95)",
          );
        } else {
          // Side/below hit - game over
          if (!gameOverSoundPlayedRef.current) {
            playGameOverSound();
            gameOverSoundPlayedRef.current = true;
          }
          setGameStateRef.current("gameOver");
          animationFrameRef.current = null;
          return;
        }
      }

      // Combo decay (no kill within window → reset)
      if (
        comboRef.current > 0 &&
        gameTimeRef.current - lastStompTimeRef.current > STOMP_COMBO_WINDOW_MS
      ) {
        comboRef.current = 0;
      }

      // Bullets
      bulletsRef.current = bulletsRef.current.filter((b) => {
        b.x += b.vx;
        b.y += b.vy;
        for (const e of enemiesRef.current) {
          if (
            e.alive &&
            b.x > e.x &&
            b.x < e.x + e.width &&
            b.y > e.y &&
            b.y < e.y + e.height
          ) {
            e.alive = false;
            bonusFromEnemies += ENEMY_KILLED_BY_BULLET;
            spawnEnemyPop(
              particlesRef.current,
              e.x + e.width / 2,
              e.y + e.height / 2,
              "rgba(120,180,255,0.95)",
            );
            return false;
          }
        }
        return b.y > -50;
      });

      // Particles
      if (particlesRef.current.length > 0) {
        const kept: Particle[] = [];
        for (const p of particlesRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.life -= 1;
          if (p.life > 0 && p.y < ch + 60) kept.push(p);
        }
        particlesRef.current = kept;
      }

      // Endless scroll - keep player around 40% from top
      const scrollThreshold = ch * 0.4;
      if (player.y < scrollThreshold) {
        const scrollAmount = scrollThreshold - player.y;
        player.y = scrollThreshold;
        for (const p of platformsRef.current) p.y += scrollAmount;
        for (const e of enemiesRef.current) e.y += scrollAmount;
        for (const p of powerUpsRef.current) p.y += scrollAmount;
        for (const b of bulletsRef.current) b.y += scrollAmount;
        for (const pa of particlesRef.current) pa.y += scrollAmount;
        worldOffsetRef.current += scrollAmount;
        highestPlatformYRef.current += scrollAmount;
      }

      // Score = height + enemy bonuses
      const heightScore = Math.floor(worldOffsetRef.current / 10);
      if (heightScore > maxHeightRef.current || bonusFromEnemies > 0) {
        const next = Math.max(maxHeightRef.current, heightScore) + (bonusFromEnemies | 0);
        maxHeightRef.current = next;
        setScore(next);
        if (next > highScore) setHighScore(next);
      }

      // Generate new platforms above
      generatePlatformsAbove();

      // Aggressive off-screen cleanup
      const removalThreshold = ch;
      platformsRef.current = platformsRef.current.filter((p) => p.y < removalThreshold);
      enemiesRef.current = enemiesRef.current.filter((e) => e.y < removalThreshold);
      powerUpsRef.current = powerUpsRef.current.filter((p) => p.y < removalThreshold);
      bulletsRef.current = bulletsRef.current.filter(
        (b) => b.y < removalThreshold + 50 && b.x > -50 && b.x < cw + 50,
      );

      // HUD push (throttled)
      if (gameTimeRef.current - lastHudPushRef.current > 150) {
        lastHudPushRef.current = gameTimeRef.current;
        setHud({ combo: comboRef.current, boost: activeBoost });
      }

      // Draw
      drawGame(ctx, {
        canvas,
        player,
        platforms: platformsRef.current,
        enemies: enemiesRef.current,
        powerUps: powerUpsRef.current,
        bullets: bulletsRef.current,
        particles: particlesRef.current,
        altitude: worldOffsetRef.current,
        gameTime: gameTimeRef.current,
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    },
    // We intentionally keep this callback stable - all dynamic deps come via refs
    [
      canvasRef,
      generatePlatformsAbove,
      updateMovingPlatforms,
      updateEnemies,
      highScore,
      isMobile,
    ],
  );

  // Shoot: spawn a bullet from the player's mouth (top of head), with cooldown,
  // a muzzle-flash burst, and a punchy sound. Optionally takes a tap target
  // in canvas-CSS coordinates so the shot leans toward the tapped X within
  // the allowed shoot-cone.
  const SHOOT_COOLDOWN_MS = 250;
  const tryShoot = useCallback((tapX?: number, _tapY?: number) => {
    const player = playerRef.current;
    if (!player) return;
    if (gameStateRef.current !== "playing") return;
    const now = gameTimeRef.current;
    if (now - lastShotTimeRef.current < SHOOT_COOLDOWN_MS) return;
    lastShotTimeRef.current = now;

    // Compute the shot angle. 0 = straight up; positive = rightward tilt.
    let shootAngle = 0;
    if (tapX !== undefined) {
      const playerCx = player.x + player.width / 2;
      const dx = tapX - playerCx;
      // Map horizontal distance to angle, clamped to ±AIM_SHOOT_MAX_ANGLE.
      // 80px sideways = max tilt.
      const k = Math.max(-1, Math.min(1, dx / 80));
      shootAngle = k * AIM_SHOOT_MAX_ANGLE;
    }

    // The trunk pivots from inside the head. Must stay in sync with
    // drawHeadAndTrunk() in gameRenderer.ts.
    //   headCY (local) = -player.height * 1.05
    //   headR          = player.width * 0.36
    //   pivot (local)  = (0, headCY + headR * 0.1)
    // In world coordinates the local origin is at (x + w/2, y + h).
    const headR = player.width * 0.36;
    const pivotX = player.x + player.width / 2;
    const pivotY = player.y + player.height * (1 - 1.05) + headR * 0.1;
    // Bullet spawns at trunk tip: baseStart (headR*0.45) + trunkLen (17).
    const barrelLen = headR * 0.45 + 17;
    // angle=0 → straight up (-Y in screen space); positive → tilted right (+X).
    const dirX = Math.sin(shootAngle);
    const dirY = -Math.cos(shootAngle);
    const tipX = pivotX + dirX * barrelLen;
    const tipY = pivotY + dirY * barrelLen;

    bulletsRef.current.push({
      x: tipX,
      y: tipY,
      vx: dirX * BULLET_SPEED,
      vy: dirY * BULLET_SPEED,
    });

    // Muzzle-flash particles (sprayed in the firing direction)
    for (let i = 0; i < 8; i++) {
      const spread = (Math.random() - 0.5) * 0.6;
      const muzzleAng = Math.atan2(dirY, dirX) + spread;
      const sp = 2 + Math.random() * 2;
      particlesRef.current.push({
        x: tipX + dirX * 2,
        y: tipY + dirY * 2,
        vx: Math.cos(muzzleAng) * sp,
        vy: Math.sin(muzzleAng) * sp,
        life: 16,
        maxLife: 16,
        size: 1.6 + Math.random() * 1.8,
        color: i < 4 ? "rgba(255,230,120,0.95)" : "rgba(255,255,255,0.95)",
        gravity: 0,
        fade: true,
      });
    }

    // Snap aim to the shoot angle so the barrel visually points the right way
    // immediately. The lerp in the game loop will then ease it back toward
    // the idle side-pose once SHOOT_POSE_MS has elapsed.
    player.aimAngle = shootAngle;

    playShootSound();
  }, []);

  // Keyboard
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        tryShoot();
      }
    },
    [tryShoot],
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key] = false;
  }, []);

  // Start / stop loop with game state
  useEffect(() => {
    if (gameState === "playing") {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      lastFrameTimeRef.current = 0;
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [gameState, gameLoop, handleKeyDown, handleKeyUp]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  const startGame = useCallback(() => {
    initGame();
    isPausedRef.current = false;
  }, [initGame]);

  const pauseGame = useCallback(() => {
    isPausedRef.current = true;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const resumeGame = useCallback(() => {
    isPausedRef.current = false;
    lastFrameTimeRef.current = 0;
  }, []);

  const resetGame = useCallback(() => {
    initGame();
    isPausedRef.current = false;
  }, [initGame]);

  return {
    score,
    highScore,
    hud,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    shoot: tryShoot,
    isMobile,
  };
}
