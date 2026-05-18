import type {
  Bullet,
  Enemy,
  Particle,
  Platform,
  Player,
  PowerUp,
} from "./types";

// -----------------------------------------------------------------------------
// Player sprite loading
// -----------------------------------------------------------------------------
let playerImage: HTMLImageElement | null = null;
let imageLoaded = false;

function loadPlayerImage() {
  if (!playerImage) {
    playerImage = new Image();
    playerImage.decoding = "async";
    playerImage.src = "/assets/player.png";
    playerImage.onload = () => {
      imageLoaded = true;
    };
  }
}
loadPlayerImage();

// Visual scale of the player sprite (hitbox stays at PLAYER_WIDTH/HEIGHT)
const PLAYER_VISUAL_SCALE = 1.55;

// -----------------------------------------------------------------------------
// Parallax background clouds
// -----------------------------------------------------------------------------
interface BgCloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
}

let bgClouds: BgCloud[] = [];
let bgInitialized = false;
let bgInitWidth = 0;
let bgInitHeight = 0;

function initBgClouds(width: number, height: number) {
  bgClouds = [];

  // Far layer
  for (let i = 0; i < 7; i++) {
    bgClouds.push({
      x: Math.random() * width,
      y: Math.random() * height,
      width: 80 + Math.random() * 60,
      height: 40 + Math.random() * 30,
      speed: 0.15,
      opacity: 0.3,
    });
  }
  // Mid layer
  for (let i = 0; i < 5; i++) {
    bgClouds.push({
      x: Math.random() * width,
      y: Math.random() * height,
      width: 100 + Math.random() * 80,
      height: 50 + Math.random() * 40,
      speed: 0.3,
      opacity: 0.5,
    });
  }
  // Near layer
  for (let i = 0; i < 4; i++) {
    bgClouds.push({
      x: Math.random() * width,
      y: Math.random() * height,
      width: 120 + Math.random() * 100,
      height: 60 + Math.random() * 50,
      speed: 0.5,
      opacity: 0.7,
    });
  }
  bgInitialized = true;
  bgInitWidth = width;
  bgInitHeight = height;
}

/**
 * Reset background clouds. Call when canvas size changes substantially
 * (rotation / new game). Without this, clouds would be wrongly positioned.
 */
export function resetBackgroundClouds() {
  bgInitialized = false;
}

// -----------------------------------------------------------------------------
// Height-based sky colors. As the player climbs higher, the sky transitions
// from a sunny day, through sunset, into the stratosphere and finally space.
// "altitude" comes from worldOffsetRef in the game loop (pixels climbed).
// -----------------------------------------------------------------------------
interface SkyStop {
  altitude: number;
  top: string;
  mid: string;
  bottom: string;
}

const SKY_STOPS: SkyStop[] = [
  // Ground / starting sky
  { altitude: 0, top: "#7ec8ff", mid: "#b8e3ff", bottom: "#e8f6ff" },
  // Higher day sky
  { altitude: 3000, top: "#5aa9e6", mid: "#8fc4ec", bottom: "#cfe6f7" },
  // Sunset
  { altitude: 7000, top: "#5a4a8a", mid: "#e58b6b", bottom: "#ffc78a" },
  // Twilight
  { altitude: 12000, top: "#1a2050", mid: "#3a3a7a", bottom: "#7a5aa0" },
  // Space
  { altitude: 18000, top: "#04061f", mid: "#0a0d2e", bottom: "#1a1b3a" },
];

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function skyColorsAtAltitude(altitude: number): {
  top: string;
  mid: string;
  bottom: string;
} {
  if (altitude <= SKY_STOPS[0].altitude) return SKY_STOPS[0];
  if (altitude >= SKY_STOPS[SKY_STOPS.length - 1].altitude)
    return SKY_STOPS[SKY_STOPS.length - 1];
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const a = SKY_STOPS[i];
    const b = SKY_STOPS[i + 1];
    if (altitude >= a.altitude && altitude < b.altitude) {
      const t = (altitude - a.altitude) / (b.altitude - a.altitude);
      return {
        top: lerpColor(a.top, b.top, t),
        mid: lerpColor(a.mid, b.mid, t),
        bottom: lerpColor(a.bottom, b.bottom, t),
      };
    }
  }
  return SKY_STOPS[0];
}

// -----------------------------------------------------------------------------
// Star field (only drawn at higher altitudes). Stars are seeded so they look
// stable across frames rather than flickering randomly.
// -----------------------------------------------------------------------------
interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
}
let stars: Star[] = [];
let starsInitialized = false;

function initStars(width: number, height: number) {
  stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.4 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
    });
  }
  starsInitialized = true;
}

// -----------------------------------------------------------------------------
// Public draw entry point
// -----------------------------------------------------------------------------
export interface DrawContext {
  canvas: HTMLCanvasElement;
  player: Player;
  platforms: Platform[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  bullets: Bullet[];
  particles: Particle[];
  altitude: number; // worldOffsetRef
  gameTime: number; // ms
}

export function drawGame(ctx2d: CanvasRenderingContext2D, dc: DrawContext) {
  const { canvas, player, platforms, enemies, powerUps, bullets, particles } =
    dc;

  // CSS pixel size (canvas.width/height may have been scaled for DPR).
  const cssWidth = canvas.clientWidth || canvas.width;
  const cssHeight = canvas.clientHeight || canvas.height;

  if (
    !bgInitialized ||
    Math.abs(bgInitWidth - cssWidth) > 1 ||
    Math.abs(bgInitHeight - cssHeight) > 1
  ) {
    initBgClouds(cssWidth, cssHeight);
  }
  if (!starsInitialized) initStars(cssWidth, cssHeight);

  // Sky + parallax
  drawSky(ctx2d, cssWidth, cssHeight, dc.altitude, dc.gameTime);
  drawStars(ctx2d, cssWidth, cssHeight, dc.altitude, dc.gameTime);
  drawSunOrMoon(ctx2d, cssWidth, cssHeight, dc.altitude);
  drawParallaxClouds(ctx2d, cssWidth, cssHeight, dc.altitude);

  // Cull entities outside the visible vertical range.
  const visibleTop = -50;
  const visibleBottom = cssHeight + 50;

  // Platforms first (under everything)
  for (const p of platforms) {
    if (p.broken) continue;
    if (p.y < visibleTop || p.y > visibleBottom) continue;
    drawCloudPlatform(ctx2d, p, dc.gameTime);
  }

  // Power-ups
  for (const pu of powerUps) {
    if (pu.used) continue;
    if (pu.y < visibleTop || pu.y > visibleBottom) continue;
    drawPowerUp(ctx2d, pu, dc.gameTime);
  }

  // Enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    if (e.y < visibleTop || e.y > visibleBottom) continue;
    drawEnemy(ctx2d, e, dc.gameTime);
  }

  // Bullets - energy spheres with cyan-gold glow
  if (bullets.length > 0) {
    for (const b of bullets) {
      if (b.y < visibleTop || b.y > visibleBottom) continue;
      // Outer halo
      const halo = ctx2d.createRadialGradient(b.x, b.y, 0, b.x, b.y, 10);
      halo.addColorStop(0, "rgba(255,230,140,0.85)");
      halo.addColorStop(0.4, "rgba(255,180,80,0.45)");
      halo.addColorStop(1, "rgba(255,180,80,0)");
      ctx2d.fillStyle = halo;
      ctx2d.beginPath();
      ctx2d.arc(b.x, b.y, 10, 0, Math.PI * 2);
      ctx2d.fill();
      // Core
      const core = ctx2d.createRadialGradient(b.x - 1, b.y - 1, 0, b.x, b.y, 4.5);
      core.addColorStop(0, "rgba(255,255,255,1)");
      core.addColorStop(0.5, "rgba(255,235,160,1)");
      core.addColorStop(1, "rgba(220,130,30,1)");
      ctx2d.fillStyle = core;
      ctx2d.strokeStyle = "rgba(120,60,10,0.8)";
      ctx2d.lineWidth = 0.8;
      ctx2d.beginPath();
      ctx2d.arc(b.x, b.y, 4.5, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.stroke();
      // Tiny trail dot above (because bullets move up)
      ctx2d.fillStyle = "rgba(255,210,120,0.6)";
      ctx2d.beginPath();
      ctx2d.arc(b.x, b.y + 5, 2, 0, Math.PI * 2);
      ctx2d.fill();
    }
  }

  // Particles (above platforms, below player - small enough not to cover the player)
  if (particles.length > 0) {
    for (const p of particles) {
      if (p.y < visibleTop || p.y > visibleBottom) continue;
      const a = p.fade ? Math.max(0, p.life / p.maxLife) : 1;
      ctx2d.save();
      ctx2d.globalAlpha = a;
      ctx2d.fillStyle = p.color;
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.restore();
    }
  }

  // Player (always)
  drawPlayer(ctx2d, player, dc.gameTime);
}

// -----------------------------------------------------------------------------
// Sky / sun-moon / stars / parallax
// -----------------------------------------------------------------------------
function drawSky(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  altitude: number,
  _gameTime: number,
) {
  const colors = skyColorsAtAltitude(altitude);
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, colors.top);
  g.addColorStop(0.55, colors.mid);
  g.addColorStop(1, colors.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  _width: number,
  _height: number,
  altitude: number,
  gameTime: number,
) {
  // Stars fade in after altitude > 9000 and reach full alpha by 14000.
  let alpha = 0;
  if (altitude > 9000) alpha = Math.min(1, (altitude - 9000) / 5000);
  if (alpha <= 0) return;

  ctx.save();
  for (const s of stars) {
    const tw = 0.6 + 0.4 * Math.sin(gameTime / 400 + s.phase);
    ctx.globalAlpha = alpha * tw;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSunOrMoon(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  altitude: number,
) {
  // Sun visible from ground to twilight, moon at higher altitudes.
  const sunAlpha = Math.max(0, 1 - altitude / 9000);
  const moonAlpha = Math.max(0, Math.min(1, (altitude - 9000) / 5000));

  const cx = width * 0.78;
  const cy = height * 0.18;
  const r = Math.min(width, height) * 0.07;

  if (sunAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = sunAlpha;
    // Halo
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
    halo.addColorStop(0, "rgba(255,235,160,0.6)");
    halo.addColorStop(1, "rgba(255,235,160,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 3, 0, Math.PI * 2);
    ctx.fill();
    // Sun body
    const sun = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
    sun.addColorStop(0, "#fff7c2");
    sun.addColorStop(1, "#ffd24a");
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (moonAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = moonAlpha;
    // Halo
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4);
    halo.addColorStop(0, "rgba(220,220,255,0.35)");
    halo.addColorStop(1, "rgba(220,220,255,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    // Moon body
    const moon = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
    moon.addColorStop(0, "#fafaff");
    moon.addColorStop(1, "#cfd0e6");
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // Tiny craters
    ctx.fillStyle = "rgba(120,120,160,0.35)";
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.1, r * 0.13, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.15, cy + r * 0.3, r * 0.1, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.4, cy - r * 0.2, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawParallaxClouds(
  ctx: CanvasRenderingContext2D,
  _width: number,
  height: number,
  altitude: number,
) {
  // Background clouds dim out as we go to space (altitude > 12000).
  const skyAlpha = Math.max(0, 1 - Math.max(0, altitude - 12000) / 6000);
  if (skyAlpha <= 0.02) return;

  for (const c of bgClouds) {
    const py = c.y + altitude * c.speed;
    let wy = py % (height + c.height * 2);
    if (wy < -c.height) wy += height + c.height * 2;

    drawBgCloud(ctx, c.x, wy, c.width, c.height, c.opacity * skyAlpha);
    if (wy > height - c.height) {
      drawBgCloud(
        ctx,
        c.x,
        wy - (height + c.height * 2),
        c.width,
        c.height,
        c.opacity * skyAlpha,
      );
    }
  }
}

function drawBgCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opacity: number,
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.65, w / 2, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x + w * 0.3, y + h * 0.45, w * 0.25, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.35, w * 0.3, h * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x + w * 0.7, y + h * 0.45, w * 0.25, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// -----------------------------------------------------------------------------
// Platforms
// -----------------------------------------------------------------------------
function drawCloudPlatform(
  ctx: CanvasRenderingContext2D,
  platform: Platform,
  gameTime: number,
) {
  const { x, y, width, height, type } = platform;
  if (type === "normal") {
    drawNormalCloud(ctx, x, y, width, height, gameTime, !!platform.isMoving);
  } else {
    drawBreakingCloud(ctx, x, y, width, height, gameTime);
  }
}

function drawNormalCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  gameTime: number,
  isMoving: boolean,
) {
  ctx.save();

  // Gentle idle breathing: very subtle vertical "puff" so the cloud feels alive.
  // Seeded by x so neighboring clouds don't pulse in sync.
  const breath = Math.sin(gameTime / 700 + x * 0.013) * 0.04;
  const yBreathe = y - h * breath;
  const hBreathe = h * (1 + breath * 0.6);

  const cx = x + w / 2;
  const cy = yBreathe + hBreathe / 2;

  // Underglow halo - soft pickup of sky-light, hints that the cloud floats.
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.95);
  halo.addColorStop(0, "rgba(180,220,255,0.35)");
  halo.addColorStop(0.4, "rgba(180,220,255,0.18)");
  halo.addColorStop(1, "rgba(180,220,255,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.15, w * 0.85, h * 1.0, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- BODY - puffy with 6 bumps, drawn as a single filled silhouette ----
  // Step 1: draw the silhouette (outline + fill) by stroking once with a fat
  // pale-blue line, then filling on top with the white gradient so the outline
  // sits cleanly behind every bump.
  ctx.lineJoin = "round";

  const body = ctx.createRadialGradient(
    cx,
    yBreathe + hBreathe * 0.35,
    0,
    cx,
    cy,
    w * 0.55,
  );
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.55, "#f4faff");
  body.addColorStop(1, "#d8e7f5");

  const drawBumps = () => {
    // Big main base
    ctx.beginPath();
    ctx.ellipse(cx, yBreathe + hBreathe * 0.72, w * 0.5, hBreathe * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    // Left side puff
    ctx.beginPath();
    ctx.ellipse(x + w * 0.18, yBreathe + hBreathe * 0.48, w * 0.22, hBreathe * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Center-left puff (high)
    ctx.beginPath();
    ctx.ellipse(x + w * 0.38, yBreathe + hBreathe * 0.3, w * 0.22, hBreathe * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    // Center-right puff (highest)
    ctx.beginPath();
    ctx.ellipse(x + w * 0.6, yBreathe + hBreathe * 0.24, w * 0.24, hBreathe * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Right puff
    ctx.beginPath();
    ctx.ellipse(x + w * 0.82, yBreathe + hBreathe * 0.42, w * 0.22, hBreathe * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    // Right edge wisp
    ctx.beginPath();
    ctx.ellipse(x + w * 0.95, yBreathe + hBreathe * 0.58, w * 0.1, hBreathe * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // Outline pass using shadow for a clean soft halo around all bumps.
  ctx.save();
  ctx.shadowColor = "rgba(120,150,190,0.7)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = body;
  drawBumps();
  ctx.restore();

  // Body fill on top (no shadow) to keep edges crisp where bumps overlap
  ctx.fillStyle = body;
  drawBumps();

  // ---- Bottom dome shadow (gives weight to the underside) ----
  const ground = ctx.createLinearGradient(0, yBreathe + hBreathe * 0.55, 0, yBreathe + hBreathe);
  ground.addColorStop(0, "rgba(120,150,190,0)");
  ground.addColorStop(1, "rgba(120,150,190,0.28)");
  ctx.fillStyle = ground;
  ctx.beginPath();
  ctx.ellipse(cx, yBreathe + hBreathe * 0.8, w * 0.42, hBreathe * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- Top highlights ----
  // Big soft top sheen
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.ellipse(
    x + w * 0.42,
    yBreathe + hBreathe * 0.22,
    w * 0.18,
    hBreathe * 0.22,
    -0.25,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Small specular glint
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(
    x + w * 0.55,
    yBreathe + hBreathe * 0.15,
    w * 0.07,
    hBreathe * 0.08,
    -0.2,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // ---- Edge wisp tendrils (the "softness" of the cloud edges) ----
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  const wisp = (px: number, py: number, rx: number, ry: number) => {
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  wisp(x + w * 0.06, yBreathe + hBreathe * 0.6, w * 0.05, hBreathe * 0.12);
  wisp(x + w * 0.96, yBreathe + hBreathe * 0.68, w * 0.05, hBreathe * 0.1);

  // ---- Twinkling sparkles ----
  // 4 sparkles seeded by position so neighboring platforms differ
  for (let i = 0; i < 4; i++) {
    const seed = x * 0.07 + y * 0.11 + i * 1.7;
    const phase = (gameTime / 600 + seed) % (Math.PI * 2);
    const tw = Math.max(0, Math.sin(phase));
    if (tw < 0.05) continue;
    const sx = x + w * (0.2 + ((i * 0.23) % 0.65));
    const sy = yBreathe + hBreathe * (0.18 + ((i * 0.31) % 0.4));
    const sr = (0.6 + tw * 1.2) * (w / 60); // scale with platform width
    // Center dot
    ctx.fillStyle = `rgba(255,255,255,${0.45 + tw * 0.55})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr * 0.9, 0, Math.PI * 2);
    ctx.fill();
    // 4-point cross
    ctx.strokeStyle = `rgba(220,240,255,${0.4 + tw * 0.5})`;
    ctx.lineWidth = 0.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx - sr * 2.2, sy);
    ctx.lineTo(sx + sr * 2.2, sy);
    ctx.moveTo(sx, sy - sr * 2.2);
    ctx.lineTo(sx, sy + sr * 2.2);
    ctx.stroke();
  }

  // ---- Moving cloud: wind streaks behind it ----
  if (isMoving) {
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    const streakOff = (Math.sin(gameTime / 300) + 1) * 0.5; // 0..1
    for (let i = 0; i < 3; i++) {
      const sy = yBreathe + hBreathe * (0.35 + i * 0.18);
      const len = w * 0.18;
      const sx = x - len * 0.4 + streakOff * 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + len, sy);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawBreakingCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  gameTime: number,
) {
  ctx.save();

  // Tiny shake so it visually "rattles"
  const shakeX = Math.sin(gameTime / 80 + x * 0.1) * 0.6;
  const shakeY = Math.cos(gameTime / 90 + x * 0.13) * 0.4;
  ctx.translate(shakeX, shakeY);

  const cx = x + w / 2;
  const cy = y + h / 2;

  // Storm-cloud body
  const body = ctx.createRadialGradient(cx, y + h * 0.3, 0, cx, cy, w * 0.55);
  body.addColorStop(0, "#8a8f99");
  body.addColorStop(0.5, "#6e747f");
  body.addColorStop(1, "#4d525c");

  ctx.lineJoin = "round";

  const drawBumps = () => {
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.72, w * 0.5, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.2, y + h * 0.48, w * 0.22, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.4, y + h * 0.3, w * 0.22, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.6, y + h * 0.26, w * 0.24, h * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.82, y + h * 0.44, w * 0.22, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // Outline pass via shadow
  ctx.save();
  ctx.shadowColor = "rgba(20,25,35,0.8)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 1.4;
  ctx.fillStyle = body;
  drawBumps();
  ctx.restore();

  // Body
  ctx.fillStyle = body;
  drawBumps();

  // ---- Lightning flicker (every ~1.5 s briefly, seeded by position) ----
  const flickerSeed = x * 0.1 + y * 0.07;
  const flickerPhase = (gameTime / 900 + flickerSeed) % 1;
  const flickerOn = flickerPhase < 0.08; // ~8% of the cycle

  if (flickerOn) {
    const fIntensity = Math.sin((flickerPhase / 0.08) * Math.PI);
    // Inner glow
    ctx.fillStyle = `rgba(255,255,200,${0.35 * fIntensity})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.45, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tiny zigzag bolt
    ctx.strokeStyle = `rgba(255,255,210,${0.85 * fIntensity})`;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "miter";
    const bx = x + w * 0.5;
    const by = y + h * 0.25;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - w * 0.04, by + h * 0.18);
    ctx.lineTo(bx + w * 0.03, by + h * 0.32);
    ctx.lineTo(bx - w * 0.02, by + h * 0.5);
    ctx.lineTo(bx + w * 0.05, by + h * 0.7);
    ctx.stroke();
    // Bolt afterglow
    ctx.strokeStyle = `rgba(180,210,255,${0.4 * fIntensity})`;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // ---- Stress cracks - thicker and with subtle inner glow ----
  ctx.strokeStyle = "#1b1e24";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";

  // Crack 1
  ctx.beginPath();
  ctx.moveTo(cx, y + h * 0.18);
  ctx.lineTo(cx - w * 0.06, y + h * 0.45);
  ctx.lineTo(cx + w * 0.04, y + h * 0.72);
  ctx.stroke();

  // Crack 2
  ctx.beginPath();
  ctx.moveTo(x + w * 0.32, y + h * 0.38);
  ctx.lineTo(x + w * 0.22, y + h * 0.62);
  ctx.lineTo(x + w * 0.18, y + h * 0.78);
  ctx.stroke();

  // Crack 3
  ctx.beginPath();
  ctx.moveTo(x + w * 0.68, y + h * 0.38);
  ctx.lineTo(x + w * 0.78, y + h * 0.62);
  ctx.lineTo(x + w * 0.82, y + h * 0.78);
  ctx.stroke();

  // Crack inner glow (thin hot line inside)
  ctx.strokeStyle = "rgba(255,200,80,0.45)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx, y + h * 0.18);
  ctx.lineTo(cx - w * 0.06, y + h * 0.45);
  ctx.lineTo(cx + w * 0.04, y + h * 0.72);
  ctx.stroke();

  // ---- Underside dark shadow ----
  const sh = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
  sh.addColorStop(0, "rgba(20,25,35,0)");
  sh.addColorStop(1, "rgba(20,25,35,0.4)");
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.8, w * 0.42, h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// -----------------------------------------------------------------------------
// Power-ups (with glow + idle float)
// -----------------------------------------------------------------------------
function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  powerUp: PowerUp,
  gameTime: number,
) {
  const { x, y, type } = powerUp;
  const bob = Math.sin(gameTime / 350 + x * 0.05) * 2;

  ctx.save();
  ctx.translate(0, bob);

  if (type === "spring") drawSpring(ctx, x, y, gameTime);
  else if (type === "propeller") drawPropellerItem(ctx, x, y, gameTime);
  else if (type === "jetpack") drawJetpackItem(ctx, x, y, gameTime);
  else if (type === "rocket") drawRocketItem(ctx, x, y, gameTime);

  ctx.restore();
}

function drawSpring(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gameTime: number,
) {
  ctx.save();

  const cx = x + 12;
  const baseY = y + 21;

  // Glow aura (pulses)
  const pulse = 0.55 + 0.25 * Math.sin(gameTime / 280 + x * 0.07);
  const halo = ctx.createRadialGradient(cx, y + 12, 0, cx, y + 12, 22);
  halo.addColorStop(0, `rgba(80,170,255,${0.35 * pulse})`);
  halo.addColorStop(0.5, `rgba(80,170,255,${0.15 * pulse})`);
  halo.addColorStop(1, "rgba(80,170,255,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, y + 12, 22, 0, Math.PI * 2);
  ctx.fill();

  // Base plate (metallic, slight 3D trapezoid)
  const baseGrad = ctx.createLinearGradient(cx, baseY, cx, baseY + 5);
  baseGrad.addColorStop(0, "#3a5fbb");
  baseGrad.addColorStop(0.5, "#1e3a8a");
  baseGrad.addColorStop(1, "#0a1f5c");
  ctx.fillStyle = baseGrad;
  ctx.strokeStyle = "#04102f";
  ctx.lineWidth = 1.2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 10, baseY);
  ctx.lineTo(cx + 10, baseY);
  ctx.lineTo(cx + 9, baseY + 4);
  ctx.lineTo(cx - 9, baseY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Base highlight
  ctx.fillStyle = "rgba(180,210,255,0.55)";
  ctx.fillRect(cx - 9, baseY + 0.5, 18, 0.8);

  // Rivets/bolts at base corners
  ctx.fillStyle = "#0a1f5c";
  ctx.beginPath();
  ctx.arc(cx - 7, baseY + 2, 1, 0, Math.PI * 2);
  ctx.arc(cx + 7, baseY + 2, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(220,235,255,0.8)";
  ctx.beginPath();
  ctx.arc(cx - 7.2, baseY + 1.7, 0.4, 0, Math.PI * 2);
  ctx.arc(cx + 6.8, baseY + 1.7, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Spring coils (metallic with specular)
  const coilCount = 4;
  const coilSpacing = 4;
  for (let i = 0; i < coilCount; i++) {
    const yPos = baseY - 1 - i * coilSpacing;
    const w = 18 - i * 0.4;
    const half = w / 2;
    // Shadow band underneath
    ctx.strokeStyle = "rgba(8,32,90,0.5)";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - half, yPos + 1);
    ctx.bezierCurveTo(
      cx - half * 0.4, yPos + 2.4,
      cx + half * 0.4, yPos + 2.4,
      cx + half, yPos + 1,
    );
    ctx.stroke();
    // Body gradient
    const body = ctx.createLinearGradient(cx, yPos - 1.4, cx, yPos + 1.4);
    body.addColorStop(0, "#a9c8ff");
    body.addColorStop(0.5, "#5b8de0");
    body.addColorStop(1, "#1e3a8a");
    ctx.strokeStyle = body;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - half, yPos);
    ctx.bezierCurveTo(
      cx - half * 0.4, yPos + 1.6,
      cx + half * 0.4, yPos + 1.6,
      cx + half, yPos,
    );
    ctx.stroke();
    // Specular top
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - half * 0.8, yPos - 0.6);
    ctx.bezierCurveTo(
      cx - half * 0.3, yPos + 0.3,
      cx + half * 0.3, yPos + 0.3,
      cx + half * 0.8, yPos - 0.6,
    );
    ctx.stroke();
  }

  // Top plate (chrome)
  const topY = baseY - 1 - coilCount * coilSpacing - 1;
  const topGrad = ctx.createLinearGradient(cx, topY, cx, topY + 3);
  topGrad.addColorStop(0, "#e8f0ff");
  topGrad.addColorStop(0.5, "#9ab4e8");
  topGrad.addColorStop(1, "#4a6cb8");
  ctx.fillStyle = topGrad;
  ctx.strokeStyle = "#1e3a8a";
  ctx.lineWidth = 1;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 9, topY + 3);
  ctx.lineTo(cx - 8, topY);
  ctx.lineTo(cx + 8, topY);
  ctx.lineTo(cx + 9, topY + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Chrome highlight
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillRect(cx - 7, topY + 0.4, 14, 0.6);

  // Sparkles
  for (let i = 0; i < 3; i++) {
    const seed = x * 0.13 + i * 1.9;
    const phase = (gameTime / 400 + seed) % (Math.PI * 2);
    const tw = Math.max(0, Math.sin(phase));
    if (tw < 0.1) continue;
    const sxPos = cx + Math.cos(seed * 1.7) * 14;
    const syPos = y + 10 + Math.sin(seed * 2.1) * 6;
    const sr = 0.4 + tw * 1.0;
    ctx.fillStyle = `rgba(180,220,255,${0.6 + tw * 0.4})`;
    ctx.beginPath();
    ctx.arc(sxPos, syPos, sr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(220,240,255,${0.4 + tw * 0.5})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sxPos - sr * 2.4, syPos);
    ctx.lineTo(sxPos + sr * 2.4, syPos);
    ctx.moveTo(sxPos, syPos - sr * 2.4);
    ctx.lineTo(sxPos, syPos + sr * 2.4);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPropellerItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gameTime: number,
) {
  ctx.save();

  const cx = x + 12;

  // ---- Warm glow halo ----
  const pulse = 0.55 + 0.25 * Math.sin(gameTime / 280 + x * 0.07);
  const halo = ctx.createRadialGradient(cx, y + 12, 0, cx, y + 12, 22);
  halo.addColorStop(0, `rgba(255,200,90,${0.35 * pulse})`);
  halo.addColorStop(0.5, `rgba(255,200,90,${0.15 * pulse})`);
  halo.addColorStop(1, "rgba(255,200,90,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, y + 12, 22, 0, Math.PI * 2);
  ctx.fill();

  // ---- Motion blur ring for propeller (when spinning at game speed it should blur) ----
  const ringGrad = ctx.createRadialGradient(cx, y + 6, 6, cx, y + 6, 13);
  ringGrad.addColorStop(0, "rgba(255,213,79,0)");
  ringGrad.addColorStop(0.5, "rgba(255,213,79,0.35)");
  ringGrad.addColorStop(1, "rgba(255,213,79,0)");
  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.ellipse(cx, y + 6, 13, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- Hat dome (3D, with side highlight) ----
  const domeGrad = ctx.createRadialGradient(cx - 3, y + 11, 1, cx, y + 14, 11);
  domeGrad.addColorStop(0, "#ff7676");
  domeGrad.addColorStop(0.55, "#e53935");
  domeGrad.addColorStop(1, "#7e1414");
  ctx.fillStyle = domeGrad;
  ctx.strokeStyle = "#4a0a0a";
  ctx.lineWidth = 1.6;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.arc(cx, y + 14, 10, Math.PI, Math.PI * 2);
  ctx.lineTo(cx + 10, y + 16);
  ctx.lineTo(cx - 10, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Specular dome highlight
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(cx - 3, y + 10, 3, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Mini white stripe (hat band)
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(cx - 9, y + 13.5, 18, 0.8);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(cx - 9, y + 14.3, 18, 0.4);

  // ---- Brim (with 3D depth) ----
  const brimGrad = ctx.createLinearGradient(cx, y + 15, cx, y + 19);
  brimGrad.addColorStop(0, "#c0282b");
  brimGrad.addColorStop(0.5, "#8a1818");
  brimGrad.addColorStop(1, "#5c0a0a");
  ctx.fillStyle = brimGrad;
  ctx.strokeStyle = "#4a0a0a";
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 12, y + 16);
  ctx.lineTo(cx + 12, y + 16);
  ctx.lineTo(cx + 11, y + 19);
  ctx.lineTo(cx - 11, y + 19);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Brim highlight
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(cx - 11, y + 16.2, 22, 0.6);

  // ---- Center stem (where propeller attaches) ----
  const stemGrad = ctx.createLinearGradient(cx - 1.5, y + 4, cx + 1.5, y + 10);
  stemGrad.addColorStop(0, "#ffd54f");
  stemGrad.addColorStop(0.5, "#b88a00");
  stemGrad.addColorStop(1, "#7a5800");
  ctx.fillStyle = stemGrad;
  ctx.beginPath();
  ctx.roundRect(cx - 1.4, y + 4, 2.8, 5, 0.6);
  ctx.fill();

  // ---- Spinning propeller (4 blades, motion blur lower opacity copy) ----
  const angle = (gameTime / 35) % (Math.PI * 2);
  // Motion blur trail
  ctx.save();
  ctx.translate(cx, y + 5.5);
  ctx.globalAlpha = 0.35;
  for (let k = 1; k <= 3; k++) {
    ctx.rotate(-0.15);
    drawPropBlade(ctx, 1);
  }
  ctx.restore();

  // Main propeller
  ctx.save();
  ctx.translate(cx, y + 5.5);
  ctx.rotate(angle);
  drawPropBlade(ctx, 1);
  ctx.rotate(Math.PI / 2);
  drawPropBlade(ctx, 1);
  // Center hub
  const hubGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 2.5);
  hubGrad.addColorStop(0, "#ffea90");
  hubGrad.addColorStop(0.6, "#d9a000");
  hubGrad.addColorStop(1, "#6a4d00");
  ctx.fillStyle = hubGrad;
  ctx.strokeStyle = "#3d2c00";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Hub highlight
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.arc(-0.7, -0.7, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawPropBlade(ctx: CanvasRenderingContext2D, _scale: number) {
  // Tapered blade, like an aircraft prop - widest mid-span, tapered tips
  const bodyGrad = ctx.createLinearGradient(0, -1.6, 0, 1.6);
  bodyGrad.addColorStop(0, "#fff0a8");
  bodyGrad.addColorStop(0.5, "#ffd54f");
  bodyGrad.addColorStop(1, "#a87600");
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = "#5a3d00";
  ctx.lineWidth = 0.7;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-12, -0.8);
  ctx.quadraticCurveTo(-8, -2, -2, -1.4);
  ctx.lineTo(2, -1.4);
  ctx.quadraticCurveTo(8, -2, 12, -0.8);
  ctx.lineTo(12, 0.8);
  ctx.quadraticCurveTo(8, 2, 2, 1.4);
  ctx.lineTo(-2, 1.4);
  ctx.quadraticCurveTo(-8, 2, -12, 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Specular line along the top of the blade
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-10, -0.7);
  ctx.quadraticCurveTo(0, -1.3, 10, -0.7);
  ctx.stroke();
}

function drawJetpackItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gameTime: number,
) {
  ctx.save();

  const cx = x + 12;
  const cy = y + 12;

  // ---- Blue glow halo (pulses) ----
  const pulse = 0.55 + 0.25 * Math.sin(gameTime / 280 + x * 0.07);
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
  halo.addColorStop(0, `rgba(80,170,255,${0.4 * pulse})`);
  halo.addColorStop(0.5, `rgba(80,170,255,${0.15 * pulse})`);
  halo.addColorStop(1, "rgba(80,170,255,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();

  // ---- Back-plate body (chrome metal) ----
  const body = ctx.createLinearGradient(cx - 8, cy - 11, cx + 8, cy + 11);
  body.addColorStop(0, "#fafbfd");
  body.addColorStop(0.3, "#d3d8e0");
  body.addColorStop(0.7, "#7d8593");
  body.addColorStop(1, "#3e434c");
  ctx.fillStyle = body;
  ctx.strokeStyle = "#1f2329";
  ctx.lineWidth = 1.6;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.roundRect(cx - 8, cy - 10, 16, 20, 3);
  ctx.fill();
  ctx.stroke();

  // Vertical highlight strip (specular)
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.roundRect(cx - 6, cy - 8, 2, 16, 1);
  ctx.fill();

  // Bottom darker shadow band
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(cx - 7, cy + 7, 14, 2);

  // ---- Side straps (subtle) ----
  ctx.strokeStyle = "rgba(20,30,50,0.55)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy - 6);
  ctx.lineTo(cx - 9, cy + 6);
  ctx.moveTo(cx + 9, cy - 6);
  ctx.lineTo(cx + 9, cy + 6);
  ctx.stroke();

  // ---- Fuel tanks (chrome with blue tint) ----
  const drawTank = (tx: number) => {
    const grad = ctx.createLinearGradient(tx - 3, cy, tx + 3, cy);
    grad.addColorStop(0, "#a6cdff");
    grad.addColorStop(0.5, "#3b82f6");
    grad.addColorStop(1, "#0f2c6e");
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#0a1a4a";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(tx, cy, 3.2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Top cap (chrome)
    ctx.fillStyle = "#dfe7f5";
    ctx.strokeStyle = "#0a1a4a";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(tx, cy - 7.5, 2.4, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Specular highlight
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(tx - 1.4, cy, 0.6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  drawTank(cx - 6);
  drawTank(cx + 6);

  // ---- LED indicator (pulses) ----
  const ledPulse = 0.6 + 0.4 * Math.sin(gameTime / 180);
  const led = ctx.createRadialGradient(cx, cy - 4, 0, cx, cy - 4, 3);
  led.addColorStop(0, `rgba(180,220,255,${ledPulse})`);
  led.addColorStop(0.4, `rgba(56,189,248,${ledPulse * 0.9})`);
  led.addColorStop(1, "rgba(8,80,160,0)");
  ctx.fillStyle = led;
  ctx.beginPath();
  ctx.arc(cx, cy - 4, 3, 0, Math.PI * 2);
  ctx.fill();
  // LED core
  ctx.fillStyle = `rgba(255,255,255,${0.85 * ledPulse})`;
  ctx.beginPath();
  ctx.arc(cx, cy - 4, 1, 0, Math.PI * 2);
  ctx.fill();

  // ---- Vent grille below LED ----
  ctx.strokeStyle = "rgba(15,25,40,0.7)";
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 3; i++) {
    const ly = cy - 0.5 + i * 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 3, ly);
    ctx.lineTo(cx + 3, ly);
    ctx.stroke();
  }

  // ---- Plasma flames (blue-core hot) ----
  const intensity = 0.55 + 0.35 * Math.sin(gameTime / 70);
  drawPlasmaFlame(ctx, cx - 6, cy + 8, intensity);
  drawPlasmaFlame(ctx, cx + 6, cy + 8, intensity);

  ctx.restore();
}

function drawPlasmaFlame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number,
) {
  ctx.save();
  const h = 8 + intensity * 6;
  // Outer cyan-orange flame
  const outer = ctx.createLinearGradient(x, y, x, y + h);
  outer.addColorStop(0, "rgba(255,210,90,0.95)");
  outer.addColorStop(0.35, "rgba(255,140,40,0.8)");
  outer.addColorStop(0.7, "rgba(255,60,30,0.45)");
  outer.addColorStop(1, "rgba(255,40,0,0)");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.moveTo(x - 2.4, y);
  ctx.quadraticCurveTo(x - 3.4, y + h * 0.5, x, y + h);
  ctx.quadraticCurveTo(x + 3.4, y + h * 0.5, x + 2.4, y);
  ctx.closePath();
  ctx.fill();
  // Inner blue-white core (the "plasma" look)
  const core = ctx.createLinearGradient(x, y, x, y + h * 0.7);
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(0.4, "rgba(180,230,255,0.85)");
  core.addColorStop(1, "rgba(140,200,255,0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(x - 1.2, y);
  ctx.quadraticCurveTo(x - 1.7, y + h * 0.35, x, y + h * 0.7);
  ctx.quadraticCurveTo(x + 1.7, y + h * 0.35, x + 1.2, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRocketItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gameTime: number,
) {
  ctx.save();

  const cx = x + 12;
  const cy = y + 12;

  // ---- Red-orange glow halo ----
  const pulse = 0.6 + 0.3 * Math.sin(gameTime / 240 + x * 0.05);
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
  halo.addColorStop(0, `rgba(255,140,80,${0.45 * pulse})`);
  halo.addColorStop(0.5, `rgba(255,140,80,${0.18 * pulse})`);
  halo.addColorStop(1, "rgba(255,140,80,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();

  // ---- Nose cone (red, glossy) ----
  const noseGrad = ctx.createLinearGradient(cx - 6, cy - 12, cx + 6, cy - 6);
  noseGrad.addColorStop(0, "#ff8a8a");
  noseGrad.addColorStop(0.5, "#ef4444");
  noseGrad.addColorStop(1, "#7a1313");
  ctx.fillStyle = noseGrad;
  ctx.strokeStyle = "#3d0808";
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 12);
  ctx.lineTo(cx + 6, cy - 6);
  ctx.lineTo(cx - 6, cy - 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Nose highlight
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx - 1.4, cy - 11);
  ctx.lineTo(cx - 3.5, cy - 7);
  ctx.stroke();

  // ---- Main body (chrome with red stripes) ----
  const body = ctx.createLinearGradient(cx - 6, cy, cx + 6, cy);
  body.addColorStop(0, "#fafbfd");
  body.addColorStop(0.3, "#dde2e8");
  body.addColorStop(0.65, "#aab0bd");
  body.addColorStop(1, "#5d6470");
  ctx.fillStyle = body;
  ctx.strokeStyle = "#262a32";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 6);
  ctx.lineTo(cx + 6, cy - 6);
  ctx.lineTo(cx + 6, cy + 8);
  ctx.lineTo(cx - 6, cy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Specular highlight strip
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillRect(cx - 5, cy - 5, 1.4, 12);

  // Top red ring
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(cx - 6, cy - 5.5, 12, 1.2);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(cx - 6, cy - 4.3, 12, 0.3);

  // Mid red stripe (around window area, drawn behind)
  // Will be drawn under window so it's only visible on the sides

  // Bottom red ring
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(cx - 6, cy + 5.5, 12, 1.5);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(cx - 6, cy + 7, 12, 0.4);

  // Rivets
  ctx.fillStyle = "#2a2f38";
  for (let i = 0; i < 3; i++) {
    const ry = cy - 2 + i * 3;
    ctx.beginPath();
    ctx.arc(cx - 5, ry, 0.5, 0, Math.PI * 2);
    ctx.arc(cx + 5, ry, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Glass cockpit window ----
  const winGrad = ctx.createRadialGradient(cx - 1, cy - 5, 0, cx, cy - 3, 4.2);
  winGrad.addColorStop(0, "rgba(220,240,255,0.95)");
  winGrad.addColorStop(0.4, "rgba(110,180,255,0.85)");
  winGrad.addColorStop(0.8, "rgba(40,90,180,0.85)");
  winGrad.addColorStop(1, "rgba(15,40,100,0.95)");
  ctx.fillStyle = winGrad;
  ctx.strokeStyle = "#0a1c4a";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Inner glass rim
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 3.0, 0, Math.PI * 2);
  ctx.stroke();
  // Big glint
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(cx - 1.4, cy - 4.6, 1.4, 0.8, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Small glint
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.beginPath();
  ctx.arc(cx + 1.5, cy - 1.5, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // ---- Fins (3 fins: left, right, back-center) ----
  const finGrad = (gx0: number, gy0: number, gx1: number, gy1: number) => {
    const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
    g.addColorStop(0, "#ff8585");
    g.addColorStop(0.5, "#ef4444");
    g.addColorStop(1, "#7a1313");
    return g;
  };
  ctx.strokeStyle = "#3d0808";
  ctx.lineWidth = 1.2;

  // Left fin
  ctx.fillStyle = finGrad(cx - 10, cy + 6, cx - 6, cy + 10);
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy + 3);
  ctx.lineTo(cx - 11, cy + 11);
  ctx.lineTo(cx - 6, cy + 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right fin
  ctx.fillStyle = finGrad(cx + 6, cy + 6, cx + 10, cy + 10);
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy + 3);
  ctx.lineTo(cx + 11, cy + 11);
  ctx.lineTo(cx + 6, cy + 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center fin (drawn smaller, behind body to suggest depth)
  ctx.fillStyle = "#a01010";
  ctx.beginPath();
  ctx.moveTo(cx - 1.5, cy + 8);
  ctx.lineTo(cx, cy + 11);
  ctx.lineTo(cx + 1.5, cy + 8);
  ctx.closePath();
  ctx.fill();

  // Engine nozzle (dark circle below)
  const nozzGrad = ctx.createRadialGradient(cx, cy + 9, 0, cx, cy + 9, 4);
  nozzGrad.addColorStop(0, "#3a3a40");
  nozzGrad.addColorStop(1, "#0a0a10");
  ctx.fillStyle = nozzGrad;
  ctx.strokeStyle = "#0a0a10";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 9, 4, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ---- Flames (triple, with hot core + sparks) ----
  const intensity = 0.75 + 0.25 * Math.sin(gameTime / 55);
  drawRocketFlame(ctx, cx, cy + 9, intensity, 1.25);
  drawRocketFlame(ctx, cx - 5, cy + 9, intensity * 0.7, 0.7);
  drawRocketFlame(ctx, cx + 5, cy + 9, intensity * 0.7, 0.7);

  // ---- Spark particles around the flame ----
  for (let i = 0; i < 4; i++) {
    const seed = x * 0.11 + i * 1.7;
    const phase = (gameTime / 100 + seed) % 1;
    const px = cx + (Math.cos(seed * 3.1) * 7) + Math.sin(phase * Math.PI * 2 + seed) * 0.4;
    const py = cy + 12 + phase * 6;
    const a = Math.max(0, 1 - phase);
    ctx.fillStyle = `rgba(255,210,90,${a * 0.9})`;
    ctx.beginPath();
    ctx.arc(px, py, 0.6 + a * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawRocketFlame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number,
  scale: number,
) {
  ctx.save();
  const h = (12 + intensity * 8) * scale;
  // Outer flame
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "rgba(255,240,100,1)");
  g.addColorStop(0.3, "rgba(255,160,50,0.9)");
  g.addColorStop(0.7, "rgba(255,80,20,0.55)");
  g.addColorStop(1, "rgba(255,40,0,0)");
  ctx.fillStyle = g;
  const fw = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(x - fw, y);
  ctx.quadraticCurveTo(x - fw * 1.5, y + h * 0.4, x, y + h);
  ctx.quadraticCurveTo(x + fw * 1.5, y + h * 0.4, x + fw, y);
  ctx.closePath();
  ctx.fill();

  // Hot white-blue core
  const core = ctx.createLinearGradient(x, y, x, y + h * 0.7);
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(0.4, "rgba(220,240,255,0.9)");
  core.addColorStop(1, "rgba(255,220,150,0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(x - fw * 0.4, y);
  ctx.quadraticCurveTo(x - fw * 0.7, y + h * 0.35, x, y + h * 0.7);
  ctx.quadraticCurveTo(x + fw * 0.7, y + h * 0.35, x + fw * 0.4, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// -----------------------------------------------------------------------------
// Enemies - 3 variants
// -----------------------------------------------------------------------------
function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  gameTime: number,
) {
  switch (enemy.type) {
    case "blob":
      drawBlob(ctx, enemy, gameTime);
      break;
    case "bat":
      drawBat(ctx, enemy, gameTime);
      break;
    case "spiky":
      drawSpiky(ctx, enemy, gameTime);
      break;
  }
}

// Blob: rounded purple cloud-spirit with eyes and a small grin.
// Stompable. Replaces the previous gun-wielding monster (kid-friendly, on-theme).
function drawBlob(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  gameTime: number,
) {
  const { x, y, width, height, wobbleOffset, wobbleSpeed } = e;
  const wx = Math.sin(gameTime / 1000 * wobbleSpeed + wobbleOffset) * 1.4;
  const wy = Math.cos(gameTime / 800 * wobbleSpeed + wobbleOffset * 1.3) * 1.0;

  ctx.save();
  ctx.translate(x + width / 2 + wx, y + height / 2 + wy);

  // Body
  const grad = ctx.createRadialGradient(0, -height * 0.15, 0, 0, 0, width / 2);
  grad.addColorStop(0, "#a78bfa");
  grad.addColorStop(0.7, "#8b5cf6");
  grad.addColorStop(1, "#6d28d9");
  ctx.fillStyle = grad;
  ctx.strokeStyle = "#3b0764";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(0, 0, width / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(-width * 0.18, -height * 0.18, width * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#1e1b4b";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(-width * 0.18, -height * 0.05, width * 0.16, 0, Math.PI * 2);
  ctx.arc(width * 0.18, -height * 0.05, width * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pupils
  ctx.fillStyle = "#0f0820";
  ctx.beginPath();
  ctx.arc(-width * 0.16, -height * 0.03, width * 0.08, 0, Math.PI * 2);
  ctx.arc(width * 0.2, -height * 0.03, width * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-width * 0.14, -height * 0.07, width * 0.035, 0, Math.PI * 2);
  ctx.arc(width * 0.22, -height * 0.07, width * 0.035, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.strokeStyle = "#1e1b4b";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, height * 0.12, width * 0.18, 0.15, Math.PI - 0.15);
  ctx.stroke();

  // Small fang
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-width * 0.06, height * 0.16);
  ctx.lineTo(-width * 0.02, height * 0.26);
  ctx.lineTo(width * 0.02, height * 0.16);
  ctx.closePath();
  ctx.fill();

  // Wisp tail at the bottom - looks like it's floating
  ctx.fillStyle = grad;
  ctx.strokeStyle = "#3b0764";
  ctx.lineWidth = 2;
  const tailWobble =
    Math.sin(gameTime / 500 * wobbleSpeed + wobbleOffset) * width * 0.06;
  ctx.beginPath();
  ctx.moveTo(-width * 0.32, height * 0.3);
  ctx.quadraticCurveTo(
    -width * 0.2 + tailWobble,
    height * 0.55,
    -width * 0.05,
    height * 0.42,
  );
  ctx.quadraticCurveTo(
    0,
    height * 0.55,
    width * 0.1,
    height * 0.42,
  );
  ctx.quadraticCurveTo(
    width * 0.25 - tailWobble,
    height * 0.55,
    width * 0.32,
    height * 0.3,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// Bat: a flying single-eye creature that drifts horizontally.
// Stompable (it's flying, but you can land on top of it).
function drawBat(ctx: CanvasRenderingContext2D, e: Enemy, gameTime: number) {
  const { x, y, width, height, wobbleSpeed } = e;
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Wing flap
  const flap = Math.sin(gameTime / 100 * wobbleSpeed) * 0.5;

  ctx.save();
  ctx.translate(cx, cy);

  // Wings
  ctx.fillStyle = "#1e3a8a";
  ctx.strokeStyle = "#0b1e57";
  ctx.lineWidth = 2;
  // Left wing
  ctx.beginPath();
  ctx.moveTo(-width * 0.05, -height * 0.05);
  ctx.quadraticCurveTo(
    -width * 0.7,
    -height * 0.5 - flap * 12,
    -width * 0.55,
    -height * 0.15 - flap * 8,
  );
  ctx.quadraticCurveTo(
    -width * 0.4,
    height * 0.1 - flap * 4,
    -width * 0.05,
    height * 0.05,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Right wing
  ctx.beginPath();
  ctx.moveTo(width * 0.05, -height * 0.05);
  ctx.quadraticCurveTo(
    width * 0.7,
    -height * 0.5 - flap * 12,
    width * 0.55,
    -height * 0.15 - flap * 8,
  );
  ctx.quadraticCurveTo(
    width * 0.4,
    height * 0.1 - flap * 4,
    width * 0.05,
    height * 0.05,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Body
  const body = ctx.createRadialGradient(0, -height * 0.1, 0, 0, 0, width * 0.35);
  body.addColorStop(0, "#3b82f6");
  body.addColorStop(1, "#1e40af");
  ctx.fillStyle = body;
  ctx.strokeStyle = "#0b1e57";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.32, height * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Big single eye
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#0b1e57";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, -height * 0.05, width * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1e1b4b";
  ctx.beginPath();
  ctx.arc(0, -height * 0.03, width * 0.09, 0, Math.PI * 2);
  ctx.fill();
  // Pupil shine
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(width * 0.035, -height * 0.06, width * 0.03, 0, Math.PI * 2);
  ctx.fill();

  // Tiny ears
  ctx.fillStyle = "#1e40af";
  ctx.strokeStyle = "#0b1e57";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-width * 0.18, -height * 0.28);
  ctx.lineTo(-width * 0.1, -height * 0.45);
  ctx.lineTo(-width * 0.05, -height * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(width * 0.18, -height * 0.28);
  ctx.lineTo(width * 0.1, -height * 0.45);
  ctx.lineTo(width * 0.05, -height * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// Spiky ball: stationary purple spike-ball. CANNOT be stomped (instant game over
// on contact); only killed by bullet or rocket/jetpack invulnerability.
function drawSpiky(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  gameTime: number,
) {
  const { x, y, width, height, wobbleOffset, wobbleSpeed } = e;
  const rot = (gameTime / 1500) * wobbleSpeed + wobbleOffset;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const r = Math.min(width, height) * 0.42;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  // Spikes
  ctx.fillStyle = "#475569";
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  const spikes = 10;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const tipX = Math.cos(a) * r * 1.55;
    const tipY = Math.sin(a) * r * 1.55;
    const baseAx = Math.cos(a - 0.18) * r;
    const baseAy = Math.sin(a - 0.18) * r;
    const baseBx = Math.cos(a + 0.18) * r;
    const baseBy = Math.sin(a + 0.18) * r;
    ctx.beginPath();
    ctx.moveTo(baseAx, baseAy);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(baseBx, baseBy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Core
  const core = ctx.createRadialGradient(0, -r * 0.3, 0, 0, 0, r);
  core.addColorStop(0, "#fbbf24");
  core.addColorStop(0.6, "#f97316");
  core.addColorStop(1, "#b91c1c");
  ctx.fillStyle = core;
  ctx.strokeStyle = "#7c2d12";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pulsing center
  const pulse = 0.6 + 0.4 * Math.sin(gameTime / 200);
  ctx.fillStyle = `rgba(255,240,150,${0.4 * pulse})`;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// -----------------------------------------------------------------------------
// Player
// -----------------------------------------------------------------------------
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  gameTime: number,
) {
  const { x, y, width, height, hasPropeller, hasJetpack, hasRocket } = player;

  // Rocket drawn first (player visible through window).
  if (hasRocket) {
    drawPlayerRocket(ctx, x + width / 2, y + height / 2, gameTime);
  } else if (hasJetpack) {
    drawPlayerJetpack(ctx, x + width / 2 + 3, y + height * 0.45, gameTime);
  }

  // Squash and stretch
  const squash = Math.max(0, Math.min(1, player.squash));
  let sx = 1 - squash * 0.18;
  let sy = 1 + squash * 0.12;
  if (player.vy < -5 && !hasRocket && !hasJetpack) {
    const k = Math.min(1, (-player.vy - 5) / 10);
    sx = 1 - k * 0.1;
    sy = 1 + k * 0.18;
  }

  // ---- 1. Body sprite (no head) ----
  if (imageLoaded && playerImage) {
    const ar = playerImage.width / playerImage.height;
    const visualW = width * PLAYER_VISUAL_SCALE;
    const visualH = visualW / ar;
    ctx.save();
    ctx.translate(x + width / 2, y + height);
    ctx.scale(sx, sy);
    ctx.drawImage(playerImage, -visualW / 2, -visualH, visualW, visualH);
    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = "#1a2538";
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height * 0.75, width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ---- 2. Head + Trunk as ONE connected shape (the secret to Doodle-Jump feel) ----
  if (!hasRocket) {
    drawHeadAndTrunk(ctx, player, sx, sy);
  }

  // ---- 3. Propeller power-up (on top of head, only without jetpack/rocket) ----
  if (hasPropeller && !hasJetpack && !hasRocket) {
    const px = x + width / 2;
    const py = y + height * 0.05;
    ctx.fillStyle = "#ef4444";
    ctx.strokeStyle = "#7a1212";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py - 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffd54f";
    ctx.strokeStyle = "#b88a00";
    ctx.save();
    ctx.translate(px, py - 12);
    ctx.rotate((gameTime / 30) % (Math.PI * 2));
    ctx.fillRect(-10, -1.5, 20, 3);
    ctx.strokeRect(-10, -1.5, 20, 3);
    ctx.restore();
  }
}

/**
 * Draws the head + trunk as a SINGLE seamless shape.
 *
 * Doodle-Jump feel comes from never showing a seam where the snout joins
 * the head. We achieve this by:
 *   1. Drawing the OUTLINE for both head + trunk first (dark color),
 *      using shapes that overlap. The trunk's outline visually merges into
 *      the head's outline.
 *   2. Drawing the FILL for both with the same color/gradient, so they
 *      read as one creature, not two stuck-together parts.
 *   3. Drawing the details (eyes, goggles, highlights) only after.
 *
 * The trunk pivots from a point INSIDE the head so its base is hidden
 * behind the head's silhouette - looks like it grows out of the face.
 */
function drawHeadAndTrunk(
  ctx: CanvasRenderingContext2D,
  player: Player,
  sx: number,
  sy: number,
) {
  // Squash transform anchored at the body so the head moves with stretch.
  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height);
  ctx.scale(sx, sy);

  // Local head dimensions. Sprite hitbox = PLAYER_WIDTH/HEIGHT (40px).
  // Head sits on top of the body. With PLAYER_VISUAL_SCALE=1.55 the body
  // sprite is roughly 62px wide; head should be smaller so the body shows.
  const headCX = 0;
  const headCY = -player.height * 1.05; // well above the body sprite
  const headR = player.width * 0.36;    // ~14.5px radius = ~29px diameter

  // Trunk geometry - SLIM and proportionate.
  const trunkBaseR = 3.5;
  const trunkTipR = 4.5;
  const trunkLen = 17;     // overall length from base out

  // Trunk pivot is INSIDE the head (so its base is hidden behind the head
  // outline = no visible seam).
  const pivotX = headCX;
  const pivotY = headCY + headR * 0.1;

  // Direction unit vector: aimAngle=0 → up (-Y), positive → right (+X).
  const dx = Math.sin(player.aimAngle);
  const dy = -Math.cos(player.aimAngle);
  const px_ = -dy;
  const py_ = dx;

  // Trunk endpoints. baseStartFromPivot < headR so the base sits inside the
  // head silhouette - the visible trunk emerges through the head's edge.
  const baseStartFromPivot = headR * 0.45;
  const baseX = pivotX + dx * baseStartFromPivot;
  const baseY = pivotY + dy * baseStartFromPivot;
  const tipX = pivotX + dx * (baseStartFromPivot + trunkLen);
  const tipY = pivotY + dy * (baseStartFromPivot + trunkLen);

  // ---- OUTLINE PASS ----
  // 1a. Head outline (big dark circle)
  ctx.fillStyle = "#0a1018";
  ctx.beginPath();
  ctx.arc(headCX, headCY, headR + 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 1b. Trunk outline (trapezoid + muzzle circle). Drawn AFTER head outline
  // so the part inside the head is covered by head's outline = invisible seam.
  ctx.beginPath();
  ctx.moveTo(baseX + px_ * (trunkBaseR + 1.8), baseY + py_ * (trunkBaseR + 1.8));
  ctx.lineTo(tipX + px_ * (trunkTipR + 1.8), tipY + py_ * (trunkTipR + 1.8));
  ctx.lineTo(tipX - px_ * (trunkTipR + 1.8), tipY - py_ * (trunkTipR + 1.8));
  ctx.lineTo(baseX - px_ * (trunkBaseR + 1.8), baseY - py_ * (trunkBaseR + 1.8));
  ctx.closePath();
  ctx.fill();
  // Muzzle outline
  ctx.beginPath();
  ctx.arc(tipX, tipY, trunkTipR + 1.8, 0, Math.PI * 2);
  ctx.fill();

  // ---- FILL PASS ----
  // 2a. Head fill (gradient)
  const headGrad = ctx.createLinearGradient(0, headCY - headR, 0, headCY + headR);
  headGrad.addColorStop(0, "#a9def9");
  headGrad.addColorStop(0.5, "#5ab2f0");
  headGrad.addColorStop(1, "#1e6dad");
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
  ctx.fill();

  // 2b. Trunk fill - same colors as head, sampled along trunk's perpendicular
  // so the gradient direction is "around" the trunk not along it.
  // We approximate by orienting a linearGradient perpendicular to the trunk.
  const gradEndX1 = baseX + px_ * trunkBaseR;
  const gradEndY1 = baseY + py_ * trunkBaseR;
  const gradEndX2 = baseX - px_ * trunkBaseR;
  const gradEndY2 = baseY - py_ * trunkBaseR;
  const trunkGrad = ctx.createLinearGradient(gradEndX1, gradEndY1, gradEndX2, gradEndY2);
  trunkGrad.addColorStop(0, "#a9def9");
  trunkGrad.addColorStop(0.5, "#5ab2f0");
  trunkGrad.addColorStop(1, "#1e6dad");
  ctx.fillStyle = trunkGrad;
  ctx.beginPath();
  ctx.moveTo(baseX + px_ * trunkBaseR, baseY + py_ * trunkBaseR);
  ctx.lineTo(tipX + px_ * trunkTipR, tipY + py_ * trunkTipR);
  ctx.lineTo(tipX - px_ * trunkTipR, tipY - py_ * trunkTipR);
  ctx.lineTo(baseX - px_ * trunkBaseR, baseY - py_ * trunkBaseR);
  ctx.closePath();
  ctx.fill();

  // Muzzle disc (open end). Slightly darker for depth.
  const muzzleGrad = ctx.createRadialGradient(tipX, tipY, 0.3, tipX, tipY, trunkTipR);
  muzzleGrad.addColorStop(0, "#7fc7f3");
  muzzleGrad.addColorStop(0.7, "#2a86c4");
  muzzleGrad.addColorStop(1, "#0e4d80");
  ctx.fillStyle = muzzleGrad;
  ctx.beginPath();
  ctx.arc(tipX, tipY, trunkTipR, 0, Math.PI * 2);
  ctx.fill();

  // Inner dark mouth hole
  ctx.fillStyle = "#0a1018";
  ctx.beginPath();
  ctx.arc(tipX + dx * 0.3, tipY + dy * 0.3, trunkTipR * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // ---- DETAILS PASS (eyes, goggles, highlights) ----
  // Bottom-of-head shadow for volume
  ctx.save();
  ctx.beginPath();
  ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(headCX, headCY + headR * 0.55, headR * 0.85, headR * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Top specular highlight on head
  ctx.save();
  ctx.beginPath();
  ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.ellipse(headCX - headR * 0.25, headCY - headR * 0.55, headR * 0.35, headR * 0.2, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Eyes / Goggles. We draw two simple dark eyes (more Doodle-Jump-y than
  // big goggles, which fight with the trunk for attention).
  const eyeOffset = headR * 0.32;
  const eyeY = headCY - headR * 0.05;
  const eyeR = headR * 0.16;
  // Eye whites
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#0a1018";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(headCX - eyeOffset, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(headCX + eyeOffset, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Pupils
  ctx.fillStyle = "#0a1018";
  const pupilR = eyeR * 0.55;
  ctx.beginPath();
  ctx.arc(headCX - eyeOffset, eyeY + eyeR * 0.1, pupilR, 0, Math.PI * 2);
  ctx.arc(headCX + eyeOffset, eyeY + eyeR * 0.1, pupilR, 0, Math.PI * 2);
  ctx.fill();
  // Pupil shines
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(headCX - eyeOffset + pupilR * 0.4, eyeY - pupilR * 0.2, pupilR * 0.3, 0, Math.PI * 2);
  ctx.arc(headCX + eyeOffset + pupilR * 0.4, eyeY - pupilR * 0.2, pupilR * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPlayerJetpack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gameTime: number,
) {
  ctx.save();

  // Chrome back-plate body
  const body = ctx.createLinearGradient(x - 6, y - 8, x + 6, y + 8);
  body.addColorStop(0, "#fafbfd");
  body.addColorStop(0.3, "#d3d8e0");
  body.addColorStop(0.7, "#7d8593");
  body.addColorStop(1, "#3e434c");
  ctx.fillStyle = body;
  ctx.strokeStyle = "#1f2329";
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 8, 12, 16, 2.5);
  ctx.fill();
  ctx.stroke();

  // Vertical highlight (specular)
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 6, 1.4, 12, 0.7);
  ctx.fill();

  // Bottom dark band
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(x - 5, y + 5, 10, 1.6);

  // Twin fuel tanks (chrome with blue)
  const drawTank = (tx: number) => {
    const g = ctx.createLinearGradient(tx - 2.2, y, tx + 2.2, y);
    g.addColorStop(0, "#a6cdff");
    g.addColorStop(0.5, "#3b82f6");
    g.addColorStop(1, "#0f2c6e");
    ctx.fillStyle = g;
    ctx.strokeStyle = "#0a1a4a";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(tx, y, 2.2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Specular
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(tx - 1, y, 0.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Top cap
    ctx.fillStyle = "#dfe7f5";
    ctx.strokeStyle = "#0a1a4a";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(tx, y - 5.8, 1.7, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  drawTank(x - 4);
  drawTank(x + 4);

  // Pulsing LED
  const ledPulse = 0.6 + 0.4 * Math.sin(gameTime / 180);
  const led = ctx.createRadialGradient(x, y - 4, 0, x, y - 4, 2.2);
  led.addColorStop(0, `rgba(180,220,255,${ledPulse})`);
  led.addColorStop(0.4, `rgba(56,189,248,${ledPulse * 0.9})`);
  led.addColorStop(1, "rgba(8,80,160,0)");
  ctx.fillStyle = led;
  ctx.beginPath();
  ctx.arc(x, y - 4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${0.85 * ledPulse})`;
  ctx.beginPath();
  ctx.arc(x, y - 4, 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Plasma flames
  const intensity = 0.6 + 0.35 * Math.sin(gameTime / 70);
  drawPlasmaFlame(ctx, x - 4, y + 8, intensity);
  drawPlasmaFlame(ctx, x + 4, y + 8, intensity);

  ctx.restore();
}

function drawPlayerRocket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gameTime: number,
) {
  ctx.save();
  const s = 2.5;

  // Body
  const body = ctx.createLinearGradient(
    x - 12 * s,
    y - 15 * s,
    x + 12 * s,
    y + 15 * s,
  );
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.5, "#f5f5f5");
  body.addColorStop(1, "#e0e0e0");
  ctx.fillStyle = body;
  ctx.strokeStyle = "#a8acb4";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(x, y - 15 * s);
  ctx.lineTo(x + 8 * s, y - 8 * s);
  ctx.lineTo(x + 8 * s, y + 10 * s);
  ctx.lineTo(x - 8 * s, y + 10 * s);
  ctx.lineTo(x - 8 * s, y - 8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Stripes
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(x - 8 * s, y - 3 * s, 16 * s, 5 * s);
  ctx.fillRect(x - 8 * s, y + 4 * s, 16 * s, 3 * s);

  // Window
  const win = ctx.createRadialGradient(x, y - 6 * s, 0, x, y - 6 * s, 6 * s);
  win.addColorStop(0, "rgba(160,220,255,0.5)");
  win.addColorStop(1, "rgba(80,140,220,0.75)");
  ctx.fillStyle = win;
  ctx.strokeStyle = "#3b7ec0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 6 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Window glint
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.arc(x - 2 * s, y - 8 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();

  // Fins
  ctx.fillStyle = "#ff7676";
  ctx.strokeStyle = "#a01010";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 8 * s, y + 5 * s);
  ctx.lineTo(x - 14 * s, y + 13 * s);
  ctx.lineTo(x - 8 * s, y + 10 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 8 * s, y + 5 * s);
  ctx.lineTo(x + 14 * s, y + 13 * s);
  ctx.lineTo(x + 8 * s, y + 10 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Flames
  const intensity = 0.8 + Math.sin(gameTime / 60) * 0.2;
  drawPlayerRocketFlame(ctx, x, y + 10 * s, intensity, 1.5 * s);
  drawPlayerRocketFlame(ctx, x - 8 * s, y + 10 * s, intensity * 0.8, 1.0 * s);
  drawPlayerRocketFlame(ctx, x + 8 * s, y + 10 * s, intensity * 0.8, 1.0 * s);

  ctx.restore();
}

function drawPlayerRocketFlame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number,
  scale: number,
) {
  ctx.save();
  const h = (18 + intensity * 12) * scale;
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "rgba(255,250,150,1)");
  g.addColorStop(0.2, "rgba(255,200,80,1)");
  g.addColorStop(0.5, "rgba(255,120,40,0.9)");
  g.addColorStop(0.8, "rgba(255,60,20,0.5)");
  g.addColorStop(1, "rgba(255,30,0,0)");
  ctx.fillStyle = g;
  const fw = 4 * scale;
  ctx.beginPath();
  ctx.moveTo(x - fw, y);
  ctx.quadraticCurveTo(x - fw * 1.8, y + h * 0.3, x, y + h);
  ctx.quadraticCurveTo(x + fw * 1.8, y + h * 0.3, x + fw, y);
  ctx.closePath();
  ctx.fill();

  const core = ctx.createRadialGradient(
    x,
    y + 6 * scale,
    0,
    x,
    y + 6 * scale,
    8 * scale,
  );
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(0.5, "rgba(255,250,200,0.8)");
  core.addColorStop(1, "rgba(255,200,80,0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y + 6 * scale, 4 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}