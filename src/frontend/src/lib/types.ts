export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hasPropeller: boolean;
  propellerTime: number;
  hasJetpack: boolean;
  jetpackTime: number;
  hasRocket: boolean;
  rocketTime: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'breaking';
  broken: boolean;
  isMoving?: boolean;
  movingBaseX?: number;
  movingSpeed?: number;
  movingRange?: number;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  wobbleOffset: number;
  wobbleSpeed: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: 'spring' | 'propeller' | 'jetpack' | 'rocket';
  used: boolean;
}
