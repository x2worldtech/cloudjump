// Physics constants
// Tuned to feel close to the original Doodle Jump on mobile.
export const GRAVITY = 0.6;
export const JUMP_VELOCITY = -15;
export const MOVE_SPEED = 7;

// Platform geometry (hitbox)
export const PLATFORM_WIDTH = 60;
export const PLATFORM_HEIGHT = 12;

// Player geometry (hitbox; visual sprite is scaled in renderer)
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 40;

// Power-up boosts
export const SPRING_BOOST = -22;

export const PROPELLER_BOOST = 10;
export const PROPELLER_DURATION = 60; // ~1 s at 60 FPS

// Jetpack: stronger than propeller, longer-lasting
export const JETPACK_BOOST = 18;
export const JETPACK_DURATION = 300; // ~5 s

// Rocket: strongest boost, longest duration
export const ROCKET_BOOST = 25;
export const ROCKET_DURATION = 600; // ~10 s

// Stomp / combo system
// When a player stomps an enemy and stomps another within this window,
// the combo counter increments and the score reward is multiplied.
export const STOMP_COMBO_WINDOW_MS = 2000;
export const STOMP_BASE_SCORE = 75;
export const STOMP_COMBO_MULTIPLIER = 0.5; // each combo step adds +50% reward
export const STOMP_BOUNCE_FACTOR = 0.6; // small bounce after stomp

// Enemy reward bonuses
export const ENEMY_KILLED_BY_BULLET = 50;
export const ENEMY_KILLED_BY_BOOST = 100; // jetpack/rocket invulnerability kill

// Particle / FX caps - prevent unbounded growth that would tank performance
export const MAX_PARTICLES = 120;

// Shooter aim
// When shooting, the barrel snaps upward and can tilt up to ±60° from vertical.
export const AIM_SHOOT_MAX_ANGLE = Math.PI / 3;
// Idle aim: barrel points roughly horizontal toward `facing` direction
// (like Doodle Jump's snout). Slight downward tilt for natural feel.
export const AIM_IDLE_ANGLE = Math.PI * 0.55; // ≈ 99° from vertical
// How fast the aim angle interpolates toward its target (per frame at 60fps).
// 0..1 ; higher = snappier.
export const AIM_LERP_SPEED = 0.22;
// Bullet speed (px/frame at ~60fps).
export const BULLET_SPEED = 12;
// Duration the barrel stays in "shooting" pose after firing, before
// returning to idle side-pose.
export const SHOOT_POSE_MS = 280;
