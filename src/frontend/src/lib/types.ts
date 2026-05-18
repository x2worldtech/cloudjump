export type GameState = "menu" | "playing" | "paused" | "gameOver";

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  // Power-up state
  hasPropeller: boolean;
  propellerTime: number;
  hasJetpack: boolean;
  jetpackTime: number;
  hasRocket: boolean;
  rocketTime: number;
  // Visual feedback
  facing: 1 | -1; // last move direction for sprite mirroring
  squash: number; // 0..1 squash-and-stretch amount on landing
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "normal" | "breaking";
  broken: boolean;
  isMoving?: boolean;
  movingBaseX?: number;
  movingSpeed?: number;
  movingRange?: number;
}

// Three enemy variants:
// - "blob": original ground-style monster (cannot fly)
// - "bat": flying eye, drifts horizontally
// - "spiky": stationary spike ball - cannot be stomped (only killed by boost / bullet)
export type EnemyType = "blob" | "bat" | "spiky";

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  type: EnemyType;
  wobbleOffset: number;
  wobbleSpeed: number;
  // For "bat" type: horizontal drift
  driftBaseX?: number;
  driftSpeed?: number;
  driftRange?: number;
}

export type PowerUpType = "spring" | "propeller" | "jetpack" | "rocket";

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  used: boolean;
}

export interface Bullet {
  x: number;
  y: number;
  vy: number;
}

// Lightweight particle for jump dust, pickups, enemy pops, rocket trails.
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // remaining lifetime (frames)
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  fade: boolean;
}
