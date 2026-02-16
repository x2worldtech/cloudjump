import { Player, Platform, Enemy, PowerUp } from './types';

// Load player image
let playerImage: HTMLImageElement | null = null;
let imageLoaded = false;

function loadPlayerImage() {
  if (!playerImage) {
    playerImage = new Image();
    playerImage.src = '/assets/AECB502E-B024-4E55-9562-6EB302661805-1.png';
    playerImage.onload = () => {
      imageLoaded = true;
    };
  }
}

// Initialize image loading
loadPlayerImage();

// Visual scale factor for player character rendering
// This increases the rendered size while keeping physics/hitbox unchanged
const PLAYER_VISUAL_SCALE = 1.35;

// Background cloud layers for parallax effect
interface BackgroundCloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number; // Parallax speed multiplier
  opacity: number;
}

// Initialize background clouds (distant clouds for parallax)
let backgroundClouds: BackgroundCloud[] = [];
let backgroundInitialized = false;

function initializeBackgroundClouds(canvasWidth: number, canvasHeight: number) {
  if (backgroundInitialized) return;
  
  backgroundClouds = [];
  
  // Create multiple layers of clouds at different depths
  // Layer 1: Far distant clouds (slowest parallax)
  for (let i = 0; i < 8; i++) {
    backgroundClouds.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      width: 80 + Math.random() * 60,
      height: 40 + Math.random() * 30,
      speed: 0.15,
      opacity: 0.3,
    });
  }
  
  // Layer 2: Mid-distance clouds (medium parallax)
  for (let i = 0; i < 6; i++) {
    backgroundClouds.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      width: 100 + Math.random() * 80,
      height: 50 + Math.random() * 40,
      speed: 0.3,
      opacity: 0.5,
    });
  }
  
  // Layer 3: Closer clouds (faster parallax)
  for (let i = 0; i < 4; i++) {
    backgroundClouds.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      width: 120 + Math.random() * 100,
      height: 60 + Math.random() * 50,
      speed: 0.5,
      opacity: 0.7,
    });
  }
  
  backgroundInitialized = true;
}

export function drawGame(
  canvas: HTMLCanvasElement,
  player: Player,
  platforms: Platform[],
  enemies: Enemy[],
  powerUps: PowerUp[],
  bullets: Array<{ x: number; y: number; vy: number }>,
  cameraOffset: number,
  canvasHeight?: number,
  gameTime?: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Initialize background clouds if needed
  if (!backgroundInitialized) {
    initializeBackgroundClouds(canvas.width, canvas.height);
  }

  // Draw cartoon-style cloud paradise background with parallax
  drawCloudParadiseBackground(ctx, canvas.width, canvas.height, cameraOffset);

  // OPTIMIZATION: Define visible area for culling off-screen entities
  // Only render entities that are within or near the visible screen area
  const visibleTop = -50; // Small buffer above screen
  const visibleBottom = (canvasHeight || canvas.height) + 50; // Small buffer below screen

  // Draw platforms with culling
  let platformsRendered = 0;
  let platformsCulled = 0;
  
  for (const platform of platforms) {
    // Skip rendering platforms that are completely off-screen
    if (platform.y < visibleTop || platform.y > visibleBottom) {
      platformsCulled++;
      continue;
    }
    
    if (!platform.broken) {
      drawCloudPlatform(ctx, platform, gameTime);
      platformsRendered++;
    }
  }

  // Draw power-ups with culling
  let powerUpsRendered = 0;
  let powerUpsCulled = 0;
  
  for (const powerUp of powerUps) {
    // Skip rendering power-ups that are off-screen
    if (powerUp.y < visibleTop || powerUp.y > visibleBottom) {
      powerUpsCulled++;
      continue;
    }
    
    if (!powerUp.used) {
      drawPowerUp(ctx, powerUp, gameTime);
      powerUpsRendered++;
    }
  }

  // Draw enemies with animation and culling
  const currentTime = gameTime || Date.now();
  let enemiesRendered = 0;
  let enemiesCulled = 0;
  
  for (const enemy of enemies) {
    // Skip rendering enemies that are off-screen
    if (enemy.y < visibleTop || enemy.y > visibleBottom) {
      enemiesCulled++;
      continue;
    }
    
    if (enemy.alive) {
      drawEnemy(ctx, enemy, currentTime);
      enemiesRendered++;
    }
  }

  // Draw bullets (bullets are typically fast-moving, so less aggressive culling)
  for (const bullet of bullets) {
    if (bullet.y >= visibleTop && bullet.y <= visibleBottom) {
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw player (always visible)
  drawPlayer(ctx, player, gameTime);

  // Optional: Log rendering stats for performance monitoring (can be removed in production)
  // Uncomment for debugging performance issues
  // if (Math.random() < 0.01) { // Log occasionally to avoid console spam
  //   console.log(`Rendered: ${platformsRendered} platforms, ${enemiesRendered} enemies, ${powerUpsRendered} power-ups | Culled: ${platformsCulled + enemiesCulled + powerUpsCulled}`);
  // }
}

function drawCloudParadiseBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraOffset: number
) {
  // Sky gradient - bright blue with lighter top
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#87CEEB'); // Sky blue at top
  skyGradient.addColorStop(0.5, '#B0E0E6'); // Powder blue in middle
  skyGradient.addColorStop(1, '#E0F6FF'); // Very light blue at bottom
  
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  // Draw distant background clouds with parallax scrolling
  for (const cloud of backgroundClouds) {
    // Apply parallax effect based on camera offset and cloud speed
    const parallaxY = cloud.y + (cameraOffset * cloud.speed);
    
    // Wrap clouds vertically for infinite scrolling
    let wrappedY = parallaxY % (height + cloud.height * 2);
    if (wrappedY < -cloud.height) {
      wrappedY += height + cloud.height * 2;
    }
    
    // Draw the background cloud
    drawBackgroundCloud(ctx, cloud.x, wrappedY, cloud.width, cloud.height, cloud.opacity);
    
    // Draw a second instance for seamless wrapping
    if (wrappedY > height - cloud.height) {
      drawBackgroundCloud(
        ctx,
        cloud.x,
        wrappedY - (height + cloud.height * 2),
        cloud.width,
        cloud.height,
        cloud.opacity
      );
    }
  }
}

function drawBackgroundCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // Soft white cloud with subtle shading
  const gradient = ctx.createRadialGradient(
    x + width / 2,
    y + height / 2,
    0,
    x + width / 2,
    y + height / 2,
    width / 2
  );
  gradient.addColorStop(0, '#FFFFFF');
  gradient.addColorStop(0.7, '#F5F5F5');
  gradient.addColorStop(1, '#E8E8E8');
  
  ctx.fillStyle = gradient;
  
  // Draw fluffy cloud shape with overlapping circles
  ctx.beginPath();
  
  // Bottom base
  ctx.ellipse(
    x + width / 2,
    y + height * 0.65,
    width / 2,
    height * 0.35,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  
  // Left puff
  ctx.beginPath();
  ctx.ellipse(
    x + width * 0.3,
    y + height * 0.45,
    width * 0.25,
    height * 0.45,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  
  // Center puff (largest)
  ctx.beginPath();
  ctx.ellipse(
    x + width * 0.5,
    y + height * 0.35,
    width * 0.3,
    height * 0.55,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  
  // Right puff
  ctx.beginPath();
  ctx.ellipse(
    x + width * 0.7,
    y + height * 0.45,
    width * 0.25,
    height * 0.45,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  
  ctx.restore();
}

function drawCloudPlatform(ctx: CanvasRenderingContext2D, platform: Platform, gameTime?: number) {
  const { x, y, width, height, type } = platform;
  
  // Use consistent size for all cloud platforms - no random variation
  // This ensures all clouds are the same size and eliminates jitter
  const cloudWidth = width;
  const cloudHeight = height;
  
  if (type === 'normal') {
    drawNormalCloud(ctx, x, y, cloudWidth, cloudHeight);
  } else if (type === 'breaking') {
    drawBreakingCloud(ctx, x, y, cloudWidth, cloudHeight);
  }
}

function drawNormalCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.save();
  
  // Main cloud body - white with subtle blue tint
  const gradient = ctx.createRadialGradient(
    x + width / 2,
    y + height / 2,
    0,
    x + width / 2,
    y + height / 2,
    width / 2
  );
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.6, '#f0f8ff');
  gradient.addColorStop(1, '#e6f2ff');
  
  ctx.fillStyle = gradient;
  ctx.strokeStyle = '#b0c4de';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  
  // Draw fluffy cloud shape with multiple overlapping circles
  // All dimensions are now fixed relative to width/height - no variation
  ctx.beginPath();
  
  // Bottom base of cloud (flatter)
  ctx.ellipse(
    x + width / 2,
    y + height * 0.7,
    width / 2,
    height * 0.4,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
  
  // Left puff
  ctx.beginPath();
  ctx.ellipse(
    x + width * 0.25,
    y + height * 0.45,
    width * 0.28,
    height * 0.5,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
  
  // Center puff (largest)
  ctx.beginPath();
  ctx.ellipse(
    x + width * 0.5,
    y + height * 0.35,
    width * 0.32,
    height * 0.6,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
  
  // Right puff
  ctx.beginPath();
  ctx.ellipse(
    x + width * 0.75,
    y + height * 0.45,
    width * 0.28,
    height * 0.5,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
  
  // Add subtle shading at the bottom for depth
  const shadowGradient = ctx.createLinearGradient(
    x + width / 2,
    y + height * 0.5,
    x + width / 2,
    y + height
  );
  shadowGradient.addColorStop(0, 'rgba(176, 196, 222, 0)');
  shadowGradient.addColorStop(1, 'rgba(176, 196, 222, 0.3)');
  
  ctx.fillStyle = shadowGradient;
  ctx.beginPath();
  ctx.ellipse(
    x + width / 2,
    y + height * 0.75,
    width * 0.45,
    height * 0.35,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  
  // Highlight on top for fluffy effect
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.ellipse(
    x + width * 0.4,
    y + height * 0.25,
    width * 0.15,
    height * 0.25,
    -0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();
  
  ctx.restore();
}

function drawBreakingCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.save();
  
  // Breaking cloud - darker gray with cracks
  const gradient = ctx.createRadialGradient(
    x + width / 2,
    y + height / 2,
    0,
    x + width / 2,
    y + height / 2,
    width / 2
  );
  gradient.addColorStop(0, '#d3d3d3');
  gradient.addColorStop(0.6, '#c0c0c0');
  gradient.addColorStop(1, '#a9a9a9');
  
  ctx.fillStyle = gradient;
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  
  // Draw fluffy cloud shape with multiple overlapping circles
  // All dimensions are now fixed relative to width/height - no variation
  ctx.beginPath();
  
  // Bottom base of cloud (flatter)
  ctx.ellipse(
    x + width / 2,
    y + height * 0.7,
    width / 2,
    height * 0.4,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
  
  // Left puff
  ctx.beginPath();
  ctx.ellipse(
    x + width * 0.25,
    y + height * 0.45,
    width * 0.28,
    height * 0.5,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
  
  // Center puff (largest)
  ctx.beginPath();
  ctx.ellipse(
    x + width * 0.5,
    y + height * 0.35,
    width * 0.32,
    height * 0.6,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
  
  // Right puff
  ctx.beginPath();
  ctx.ellipse(
    x + width * 0.75,
    y + height * 0.45,
    width * 0.28,
    height * 0.5,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
  
  // Add darker shading at the bottom
  const shadowGradient = ctx.createLinearGradient(
    x + width / 2,
    y + height * 0.5,
    x + width / 2,
    y + height
  );
  shadowGradient.addColorStop(0, 'rgba(128, 128, 128, 0)');
  shadowGradient.addColorStop(1, 'rgba(128, 128, 128, 0.4)');
  
  ctx.fillStyle = shadowGradient;
  ctx.beginPath();
  ctx.ellipse(
    x + width / 2,
    y + height * 0.75,
    width * 0.45,
    height * 0.35,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  
  // Draw crack lines to indicate breaking
  ctx.strokeStyle = '#696969';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  
  // Vertical crack
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y + height * 0.2);
  ctx.lineTo(x + width / 2 - width * 0.05, y + height * 0.5);
  ctx.lineTo(x + width / 2 + width * 0.03, y + height * 0.8);
  ctx.stroke();
  
  // Diagonal crack left
  ctx.beginPath();
  ctx.moveTo(x + width * 0.35, y + height * 0.4);
  ctx.lineTo(x + width * 0.25, y + height * 0.7);
  ctx.stroke();
  
  // Diagonal crack right
  ctx.beginPath();
  ctx.moveTo(x + width * 0.65, y + height * 0.4);
  ctx.lineTo(x + width * 0.75, y + height * 0.7);
  ctx.stroke();
  
  ctx.restore();
}

function drawPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUp, gameTime?: number) {
  const { x, y, type } = powerUp;

  if (type === 'spring') {
    // Spring on platform
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    // Spring coils
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const yPos = y + 16 - i * 3.5;
      ctx.moveTo(x + 8, yPos);
      ctx.lineTo(x + 16, yPos);
    }
    ctx.stroke();

    // Spring base
    ctx.fillStyle = '#0d47a1';
    ctx.fillRect(x + 6, y + 18, 12, 2.5);
  } else if (type === 'propeller') {
    // Propeller hat
    ctx.fillStyle = '#f44336';
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 2;

    // Hat base
    ctx.beginPath();
    ctx.arc(x + 12, y + 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Propeller blades
    ctx.fillStyle = '#ffeb3b';
    ctx.strokeStyle = '#f57f17';
    ctx.save();
    ctx.translate(x + 12, y + 6);
    ctx.rotate((Date.now() / 50) % (Math.PI * 2));
    ctx.fillRect(-12, -1.5, 24, 3);
    ctx.strokeRect(-12, -1.5, 24, 3);
    ctx.restore();
  } else if (type === 'jetpack') {
    // Jetpack power-up with sleek futuristic design
    drawJetpack(ctx, x, y, gameTime);
  } else if (type === 'rocket') {
    // Rocket power-up with cartoon-style space rocket design
    drawRocket(ctx, x, y, gameTime);
  }
}

function drawJetpack(ctx: CanvasRenderingContext2D, x: number, y: number, gameTime?: number) {
  ctx.save();
  
  // Center the jetpack
  const centerX = x + 12;
  const centerY = y + 12;
  
  // Main jetpack body - sleek metallic silver with gradient
  const bodyGradient = ctx.createLinearGradient(centerX - 8, centerY - 10, centerX + 8, centerY + 10);
  bodyGradient.addColorStop(0, '#e0e0e0');
  bodyGradient.addColorStop(0.5, '#b0b0b0');
  bodyGradient.addColorStop(1, '#808080');
  
  ctx.fillStyle = bodyGradient;
  ctx.strokeStyle = '#404040';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  
  // Jetpack body - rounded rectangle
  ctx.beginPath();
  ctx.roundRect(centerX - 8, centerY - 10, 16, 20, 3);
  ctx.fill();
  ctx.stroke();
  
  // Metallic highlights
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.roundRect(centerX - 6, centerY - 8, 4, 16, 1);
  ctx.fill();
  
  // Fuel tanks on sides
  const tankGradient = ctx.createRadialGradient(centerX - 6, centerY, 0, centerX - 6, centerY, 4);
  tankGradient.addColorStop(0, '#4a90e2');
  tankGradient.addColorStop(1, '#2563eb');
  
  ctx.fillStyle = tankGradient;
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 1.5;
  
  // Left tank
  ctx.beginPath();
  ctx.ellipse(centerX - 6, centerY, 3, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Right tank
  ctx.beginPath();
  ctx.ellipse(centerX + 6, centerY, 3, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Animated flame effects at the bottom
  const time = (gameTime || Date.now()) / 100;
  const flameIntensity = 0.5 + Math.sin(time * 2) * 0.3;
  
  // Left flame
  drawJetpackFlame(ctx, centerX - 6, centerY + 8, flameIntensity);
  
  // Right flame
  drawJetpackFlame(ctx, centerX + 6, centerY + 8, flameIntensity);
  
  // Control panel detail
  ctx.fillStyle = '#1e40af';
  ctx.beginPath();
  ctx.arc(centerX, centerY - 4, 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Glow effect around jetpack
  ctx.shadowColor = 'rgba(74, 144, 226, 0.6)';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = 'rgba(74, 144, 226, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(centerX - 9, centerY - 11, 18, 22, 4);
  ctx.stroke();
  
  ctx.restore();
}

function drawJetpackFlame(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number) {
  ctx.save();
  
  // Flame gradient - orange to yellow with motion blur effect
  const flameHeight = 6 + intensity * 4;
  const flameGradient = ctx.createLinearGradient(x, y, x, y + flameHeight);
  flameGradient.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
  flameGradient.addColorStop(0.5, 'rgba(255, 120, 30, 0.7)');
  flameGradient.addColorStop(1, 'rgba(255, 60, 0, 0)');
  
  ctx.fillStyle = flameGradient;
  
  // Flame shape with motion blur
  ctx.beginPath();
  ctx.moveTo(x - 2, y);
  ctx.quadraticCurveTo(x - 3, y + flameHeight * 0.5, x, y + flameHeight);
  ctx.quadraticCurveTo(x + 3, y + flameHeight * 0.5, x + 2, y);
  ctx.closePath();
  ctx.fill();
  
  // Inner bright core
  const coreGradient = ctx.createRadialGradient(x, y + 2, 0, x, y + 2, 3);
  coreGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
  coreGradient.addColorStop(1, 'rgba(255, 200, 50, 0)');
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(x, y + 2, 2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawRocket(ctx: CanvasRenderingContext2D, x: number, y: number, gameTime?: number) {
  ctx.save();
  
  // Center the rocket
  const centerX = x + 12;
  const centerY = y + 12;
  
  // Rocket body - sleek white with red accents
  const bodyGradient = ctx.createLinearGradient(centerX - 10, centerY - 12, centerX + 10, centerY + 12);
  bodyGradient.addColorStop(0, '#ffffff');
  bodyGradient.addColorStop(0.5, '#f5f5f5');
  bodyGradient.addColorStop(1, '#e0e0e0');
  
  ctx.fillStyle = bodyGradient;
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  
  // Main rocket body
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 12); // Nose tip
  ctx.lineTo(centerX + 6, centerY - 6); // Right shoulder
  ctx.lineTo(centerX + 6, centerY + 8); // Right side
  ctx.lineTo(centerX - 6, centerY + 8); // Left side
  ctx.lineTo(centerX - 6, centerY - 6); // Left shoulder
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Red accent stripe
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(centerX - 6, centerY - 2, 12, 4);
  
  // Transparent window showing character head placeholder
  const windowGradient = ctx.createRadialGradient(centerX, centerY - 4, 0, centerX, centerY - 4, 4);
  windowGradient.addColorStop(0, 'rgba(135, 206, 250, 0.6)');
  windowGradient.addColorStop(1, 'rgba(100, 149, 237, 0.8)');
  
  ctx.fillStyle = windowGradient;
  ctx.strokeStyle = '#4682b4';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Window highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(centerX - 1.5, centerY - 5.5, 1.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Rocket fins
  ctx.fillStyle = '#ff6666';
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 1.5;
  
  // Left fin
  ctx.beginPath();
  ctx.moveTo(centerX - 6, centerY + 4);
  ctx.lineTo(centerX - 10, centerY + 10);
  ctx.lineTo(centerX - 6, centerY + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Right fin
  ctx.beginPath();
  ctx.moveTo(centerX + 6, centerY + 4);
  ctx.lineTo(centerX + 10, centerY + 10);
  ctx.lineTo(centerX + 6, centerY + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Animated flame effects at the bottom
  const time = (gameTime || Date.now()) / 80;
  const flameIntensity = 0.7 + Math.sin(time * 3) * 0.3;
  
  // Main flame
  drawRocketFlame(ctx, centerX, centerY + 8, flameIntensity, 1.2);
  
  // Side flames from fins
  drawRocketFlame(ctx, centerX - 6, centerY + 8, flameIntensity * 0.7, 0.8);
  drawRocketFlame(ctx, centerX + 6, centerY + 8, flameIntensity * 0.7, 0.8);
  
  // Glow effect around rocket
  ctx.shadowColor = 'rgba(255, 100, 100, 0.6)';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 13);
  ctx.lineTo(centerX + 7, centerY - 6);
  ctx.lineTo(centerX + 7, centerY + 9);
  ctx.lineTo(centerX - 7, centerY + 9);
  ctx.lineTo(centerX - 7, centerY - 6);
  ctx.closePath();
  ctx.stroke();
  
  ctx.restore();
}

function drawRocketFlame(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number, scale: number) {
  ctx.save();
  
  // Powerful flame gradient - bright orange to yellow
  const flameHeight = (12 + intensity * 8) * scale;
  const flameGradient = ctx.createLinearGradient(x, y, x, y + flameHeight);
  flameGradient.addColorStop(0, 'rgba(255, 240, 100, 1)');
  flameGradient.addColorStop(0.3, 'rgba(255, 160, 50, 0.9)');
  flameGradient.addColorStop(0.7, 'rgba(255, 80, 20, 0.6)');
  flameGradient.addColorStop(1, 'rgba(255, 40, 0, 0)');
  
  ctx.fillStyle = flameGradient;
  
  // Flame shape
  const flameWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(x - flameWidth, y);
  ctx.quadraticCurveTo(x - flameWidth * 1.5, y + flameHeight * 0.4, x, y + flameHeight);
  ctx.quadraticCurveTo(x + flameWidth * 1.5, y + flameHeight * 0.4, x + flameWidth, y);
  ctx.closePath();
  ctx.fill();
  
  // Bright core
  const coreGradient = ctx.createRadialGradient(x, y + 4 * scale, 0, x, y + 4 * scale, 5 * scale);
  coreGradient.addColorStop(0, 'rgba(255, 255, 240, 1)');
  coreGradient.addColorStop(1, 'rgba(255, 240, 100, 0)');
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(x, y + 4 * scale, 3 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, currentTime: number) {
  const { x, y, width, height, wobbleOffset, wobbleSpeed } = enemy;

  // Calculate wobble animation
  // Sine-based subtle translational wobble with low amplitude
  const wobbleX = Math.sin((currentTime / 1000) * wobbleSpeed + wobbleOffset) * 1.5;
  const wobbleY = Math.cos((currentTime / 800) * wobbleSpeed + wobbleOffset * 1.3) * 1.2;
  
  // Subtle rotation wobble
  const wobbleRotation = Math.sin((currentTime / 900) * wobbleSpeed + wobbleOffset * 0.7) * 0.08;

  // Apply transformations
  ctx.save();
  ctx.translate(x + width / 2 + wobbleX, y + height / 2 + wobbleY);
  ctx.rotate(wobbleRotation);

  // Draw enemy with improved design
  // Main body - vibrant orange-red with gradient effect
  const gradient = ctx.createRadialGradient(0, -height * 0.15, 0, 0, 0, width / 2);
  gradient.addColorStop(0, '#ff6b35');
  gradient.addColorStop(0.7, '#ff4500');
  gradient.addColorStop(1, '#d63000');
  
  ctx.fillStyle = gradient;
  ctx.strokeStyle = '#8b2500';
  ctx.lineWidth = 2.8;

  // Body - rounded shape
  ctx.beginPath();
  ctx.arc(0, 0, width / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner highlight for depth
  ctx.fillStyle = 'rgba(255, 140, 80, 0.4)';
  ctx.beginPath();
  ctx.arc(-width * 0.15, -height * 0.15, width * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Eyes - larger and more expressive
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.8;
  
  // Left eye white
  ctx.beginPath();
  ctx.arc(-width * 0.22, -height * 0.1, width * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Right eye white
  ctx.beginPath();
  ctx.arc(width * 0.22, -height * 0.1, width * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pupils - with slight offset for menacing look
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(-width * 0.2, -height * 0.08, width * 0.1, 0, Math.PI * 2);
  ctx.arc(width * 0.24, -height * 0.08, width * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine for liveliness
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-width * 0.18, -height * 0.12, width * 0.04, 0, Math.PI * 2);
  ctx.arc(width * 0.26, -height * 0.12, width * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // Angry eyebrows
  ctx.strokeStyle = '#5a1a00';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(-width * 0.35, -height * 0.25);
  ctx.lineTo(-width * 0.1, -height * 0.3);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(width * 0.35, -height * 0.25);
  ctx.lineTo(width * 0.1, -height * 0.3);
  ctx.stroke();

  // Mouth - menacing grin
  ctx.strokeStyle = '#5a1a00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, height * 0.05, width * 0.25, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Teeth
  ctx.fillStyle = '#ffffff';
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(i * width * 0.12 - width * 0.04, height * 0.15, width * 0.08, height * 0.12);
  }

  // Weapon/gun barrel - more prominent
  ctx.fillStyle = '#2c1810';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  
  ctx.fillRect(width * 0.35, -height * 0.08, width * 0.25, height * 0.16);
  ctx.strokeRect(width * 0.35, -height * 0.08, width * 0.25, height * 0.16);
  
  // Gun tip
  ctx.fillStyle = '#1a0f08';
  ctx.fillRect(width * 0.58, -height * 0.05, width * 0.08, height * 0.1);

  // Spiky details on top for character
  ctx.fillStyle = '#d63000';
  ctx.strokeStyle = '#8b2500';
  ctx.lineWidth = 1.5;
  
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * width * 0.2, -height * 0.45);
    ctx.lineTo(i * width * 0.25 - width * 0.05, -height * 0.5);
    ctx.lineTo(i * width * 0.25 + width * 0.05, -height * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Tentacle-like legs with wobble
  ctx.strokeStyle = '#d63000';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  
  for (let i = 0; i < 4; i++) {
    const legAngle = (i - 1.5) * 0.4;
    const legWobble = Math.sin((currentTime / 600) * wobbleSpeed + wobbleOffset + i) * 0.15;
    
    ctx.beginPath();
    ctx.moveTo(0, height * 0.35);
    
    const legX = Math.sin(legAngle + legWobble) * width * 0.4;
    const legY = height * 0.55;
    
    ctx.quadraticCurveTo(
      legX * 0.5,
      height * 0.4,
      legX,
      legY
    );
    ctx.stroke();
    
    // Leg tips
    ctx.fillStyle = '#d63000';
    ctx.beginPath();
    ctx.arc(legX, legY, width * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, gameTime?: number) {
  const { x, y, width, height, hasPropeller, hasJetpack, hasRocket } = player;

  // Draw rocket FIRST if active (character visible through window)
  if (hasRocket) {
    drawPlayerRocket(ctx, x + width / 2, y + height / 2, gameTime);
  }
  // Draw jetpack if active and rocket is not (behind the player)
  else if (hasJetpack) {
    drawPlayerJetpack(ctx, x + width / 2 + 3, y + height * 0.45, gameTime);
  }

  // Draw the PNG image if loaded, otherwise fallback to simple shape
  if (imageLoaded && playerImage) {
    // Calculate scaling to fit the player dimensions with visual scale factor
    // The image should be anchored at the feet (bottom center)
    const imageAspectRatio = playerImage.width / playerImage.height;
    
    // Apply visual scale factor to increase rendered size
    const visualWidth = width * PLAYER_VISUAL_SCALE;
    const visualHeight = visualWidth / imageAspectRatio;
    
    // Draw image anchored at bottom center (feet position)
    // Center horizontally around the physics hitbox center
    const drawX = x + width / 2 - visualWidth / 2;
    const drawY = y + height - visualHeight;
    
    ctx.drawImage(
      playerImage,
      drawX,
      drawY,
      visualWidth,
      visualHeight
    );
  } else {
    // Fallback rendering while image loads
    ctx.fillStyle = '#2196f3';
    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 2.5;

    // Head
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 3, width / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + width / 2 - 4, y + height / 3 - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(x + width / 2 + 4, y + height / 3 - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#2196f3';
    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 2.5;
    ctx.fillRect(x + width / 4, y + height / 2, width / 2, height / 3);
    ctx.strokeRect(x + width / 4, y + height / 2, width / 2, height / 3);

    // Legs
    ctx.beginPath();
    ctx.moveTo(x + width / 3, y + height);
    ctx.lineTo(x + width / 3, y + height + 8);
    ctx.moveTo(x + (2 * width) / 3, y + height);
    ctx.lineTo(x + (2 * width) / 3, y + height + 8);
    ctx.stroke();
  }

  // Propeller if active (only shown if jetpack and rocket are not active)
  // Propeller is drawn AFTER player so it appears on top (on head)
  if (hasPropeller && !hasJetpack && !hasRocket) {
    ctx.fillStyle = '#f44336';
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(x + width / 2, y - 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffeb3b';
    ctx.strokeStyle = '#f57f17';
    ctx.save();
    ctx.translate(x + width / 2, y - 10);
    ctx.rotate((Date.now() / 30) % (Math.PI * 2));
    ctx.fillRect(-10, -1.5, 20, 3);
    ctx.strokeRect(-10, -1.5, 20, 3);
    ctx.restore();
  }
}

function drawPlayerJetpack(ctx: CanvasRenderingContext2D, x: number, y: number, gameTime?: number) {
  ctx.save();
  
  // Jetpack body positioned on the back, shifted to the right side for better visibility
  // The jetpack appears on the right side of the character while still being behind them
  const bodyGradient = ctx.createLinearGradient(x - 6, y - 8, x + 6, y + 8);
  bodyGradient.addColorStop(0, '#e0e0e0');
  bodyGradient.addColorStop(0.5, '#b0b0b0');
  bodyGradient.addColorStop(1, '#808080');
  
  ctx.fillStyle = bodyGradient;
  ctx.strokeStyle = '#404040';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  
  // Jetpack body - positioned on the back, right side
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 8, 12, 16, 2);
  ctx.fill();
  ctx.stroke();
  
  // Fuel tanks - adjusted for right-side positioning
  const tankGradient = ctx.createRadialGradient(x - 4, y, 0, x - 4, y, 3);
  tankGradient.addColorStop(0, '#4a90e2');
  tankGradient.addColorStop(1, '#2563eb');
  
  ctx.fillStyle = tankGradient;
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 1;
  
  // Left tank
  ctx.beginPath();
  ctx.ellipse(x - 4, y, 2, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Right tank
  ctx.beginPath();
  ctx.ellipse(x + 4, y, 2, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Animated flames - originating from the bottom of the jetpack, aligned with right-side position
  const time = (gameTime || Date.now()) / 80;
  const flameIntensity = 0.6 + Math.sin(time * 3) * 0.4;
  
  // Left flame - adjusted for right-side jetpack position
  drawPlayerJetpackFlame(ctx, x - 4, y + 8, flameIntensity);
  
  // Right flame - adjusted for right-side jetpack position
  drawPlayerJetpackFlame(ctx, x + 4, y + 8, flameIntensity);
  
  // Glow effect
  ctx.shadowColor = 'rgba(74, 144, 226, 0.5)';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = 'rgba(74, 144, 226, 0.3)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.roundRect(x - 7, y - 9, 14, 18, 3);
  ctx.stroke();
  
  ctx.restore();
}

function drawPlayerJetpackFlame(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number) {
  ctx.save();
  
  // Larger, more intense flames for active jetpack
  const flameHeight = 10 + intensity * 6;
  const flameGradient = ctx.createLinearGradient(x, y, x, y + flameHeight);
  flameGradient.addColorStop(0, 'rgba(255, 220, 80, 1)');
  flameGradient.addColorStop(0.4, 'rgba(255, 140, 40, 0.8)');
  flameGradient.addColorStop(1, 'rgba(255, 80, 0, 0)');
  
  ctx.fillStyle = flameGradient;
  
  // Flame shape
  ctx.beginPath();
  ctx.moveTo(x - 2.5, y);
  ctx.quadraticCurveTo(x - 3.5, y + flameHeight * 0.4, x, y + flameHeight);
  ctx.quadraticCurveTo(x + 3.5, y + flameHeight * 0.4, x + 2.5, y);
  ctx.closePath();
  ctx.fill();
  
  // Bright core
  const coreGradient = ctx.createRadialGradient(x, y + 3, 0, x, y + 3, 4);
  coreGradient.addColorStop(0, 'rgba(255, 255, 220, 1)');
  coreGradient.addColorStop(1, 'rgba(255, 220, 80, 0)');
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(x, y + 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawPlayerRocket(ctx: CanvasRenderingContext2D, x: number, y: number, gameTime?: number) {
  ctx.save();
  
  // Scale up the rocket for player
  const scale = 2.5;
  
  // Rocket body - sleek white with red accents
  const bodyGradient = ctx.createLinearGradient(x - 12 * scale, y - 15 * scale, x + 12 * scale, y + 15 * scale);
  bodyGradient.addColorStop(0, '#ffffff');
  bodyGradient.addColorStop(0.5, '#f5f5f5');
  bodyGradient.addColorStop(1, '#e0e0e0');
  
  ctx.fillStyle = bodyGradient;
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  
  // Main rocket body
  ctx.beginPath();
  ctx.moveTo(x, y - 15 * scale); // Nose tip
  ctx.lineTo(x + 8 * scale, y - 8 * scale); // Right shoulder
  ctx.lineTo(x + 8 * scale, y + 10 * scale); // Right side
  ctx.lineTo(x - 8 * scale, y + 10 * scale); // Left side
  ctx.lineTo(x - 8 * scale, y - 8 * scale); // Left shoulder
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Red accent stripes
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(x - 8 * scale, y - 3 * scale, 16 * scale, 5 * scale);
  ctx.fillRect(x - 8 * scale, y + 4 * scale, 16 * scale, 3 * scale);
  
  // Transparent window showing character head
  const windowGradient = ctx.createRadialGradient(x, y - 6 * scale, 0, x, y - 6 * scale, 6 * scale);
  windowGradient.addColorStop(0, 'rgba(135, 206, 250, 0.4)');
  windowGradient.addColorStop(1, 'rgba(100, 149, 237, 0.7)');
  
  ctx.fillStyle = windowGradient;
  ctx.strokeStyle = '#4682b4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 6 * scale, 6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Window frame detail
  ctx.strokeStyle = '#87CEEB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y - 6 * scale, 5 * scale, 0, Math.PI * 2);
  ctx.stroke();
  
  // Window highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(x - 2 * scale, y - 8 * scale, 2 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Rocket fins
  ctx.fillStyle = '#ff6666';
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 2;
  
  // Left fin
  ctx.beginPath();
  ctx.moveTo(x - 8 * scale, y + 5 * scale);
  ctx.lineTo(x - 14 * scale, y + 13 * scale);
  ctx.lineTo(x - 8 * scale, y + 10 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Right fin
  ctx.beginPath();
  ctx.moveTo(x + 8 * scale, y + 5 * scale);
  ctx.lineTo(x + 14 * scale, y + 13 * scale);
  ctx.lineTo(x + 8 * scale, y + 10 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Animated flame effects at the bottom
  const time = (gameTime || Date.now()) / 60;
  const flameIntensity = 0.8 + Math.sin(time * 4) * 0.2;
  
  // Main flame
  drawPlayerRocketFlame(ctx, x, y + 10 * scale, flameIntensity, 1.5 * scale);
  
  // Side flames from fins
  drawPlayerRocketFlame(ctx, x - 8 * scale, y + 10 * scale, flameIntensity * 0.8, 1.0 * scale);
  drawPlayerRocketFlame(ctx, x + 8 * scale, y + 10 * scale, flameIntensity * 0.8, 1.0 * scale);
  
  // Glow effect around rocket
  ctx.shadowColor = 'rgba(255, 100, 100, 0.7)';
  ctx.shadowBlur = 15;
  ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 16 * scale);
  ctx.lineTo(x + 9 * scale, y - 8 * scale);
  ctx.lineTo(x + 9 * scale, y + 11 * scale);
  ctx.lineTo(x - 9 * scale, y + 11 * scale);
  ctx.lineTo(x - 9 * scale, y - 8 * scale);
  ctx.closePath();
  ctx.stroke();
  
  ctx.restore();
}

function drawPlayerRocketFlame(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number, scale: number) {
  ctx.save();
  
  // Powerful flame gradient - bright orange to yellow
  const flameHeight = (18 + intensity * 12) * scale;
  const flameGradient = ctx.createLinearGradient(x, y, x, y + flameHeight);
  flameGradient.addColorStop(0, 'rgba(255, 250, 150, 1)');
  flameGradient.addColorStop(0.2, 'rgba(255, 200, 80, 1)');
  flameGradient.addColorStop(0.5, 'rgba(255, 120, 40, 0.9)');
  flameGradient.addColorStop(0.8, 'rgba(255, 60, 20, 0.5)');
  flameGradient.addColorStop(1, 'rgba(255, 30, 0, 0)');
  
  ctx.fillStyle = flameGradient;
  
  // Flame shape
  const flameWidth = 4 * scale;
  ctx.beginPath();
  ctx.moveTo(x - flameWidth, y);
  ctx.quadraticCurveTo(x - flameWidth * 1.8, y + flameHeight * 0.3, x, y + flameHeight);
  ctx.quadraticCurveTo(x + flameWidth * 1.8, y + flameHeight * 0.3, x + flameWidth, y);
  ctx.closePath();
  ctx.fill();
  
  // Bright core
  const coreGradient = ctx.createRadialGradient(x, y + 6 * scale, 0, x, y + 6 * scale, 8 * scale);
  coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  coreGradient.addColorStop(0.5, 'rgba(255, 250, 200, 0.8)');
  coreGradient.addColorStop(1, 'rgba(255, 200, 80, 0)');
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(x, y + 6 * scale, 4 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}
