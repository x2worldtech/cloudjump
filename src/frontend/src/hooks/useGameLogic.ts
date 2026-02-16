import { useEffect, useRef, useCallback, useState } from 'react';
import { GameState, Player, Platform, Enemy, PowerUp } from '@/lib/types';
import { drawGame } from '@/lib/gameRenderer';
import {
  GRAVITY,
  JUMP_VELOCITY,
  MOVE_SPEED,
  PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  SPRING_BOOST,
  PROPELLER_BOOST,
  PROPELLER_DURATION,
  JETPACK_BOOST,
  JETPACK_DURATION,
  ROCKET_BOOST,
  ROCKET_DURATION,
  WORLD_SCALE,
} from '@/lib/constants';
import { useDeviceOrientation, isMobileDevice } from './useDeviceOrientation';

// Audio context for sound effects
let audioContext: AudioContext | null = null;

// Initialize audio context (lazy initialization to avoid autoplay restrictions)
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Generate and play a satisfying jump sound effect
const playJumpSound = () => {
  try {
    const ctx = getAudioContext();
    
    // Resume context if suspended (required for some browsers)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Create oscillator for the bounce sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Configure bounce sound: quick frequency sweep from high to low
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    
    // Volume envelope: quick attack and decay for punchy sound
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15); // Smooth decay
    
    // Play the sound
    oscillator.start(now);
    oscillator.stop(now + 0.15);
    
    // Clean up after sound finishes
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  } catch (error) {
    // Silently fail if audio is not supported or blocked
    console.warn('Jump sound playback failed:', error);
  }
};

// Generate and play jetpack activation sound effect
const playJetpackSound = () => {
  try {
    const ctx = getAudioContext();
    
    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Create oscillator for rocket ignition whoosh sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Add filter for more realistic rocket sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
    
    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Configure jetpack sound: low rumble with rising pitch
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(80, now);
    oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.3);
    
    // Volume envelope: quick attack, sustained, then decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05); // Quick attack
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.2); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); // Decay
    
    // Play the sound
    oscillator.start(now);
    oscillator.stop(now + 0.4);
    
    // Clean up after sound finishes
    oscillator.onended = () => {
      oscillator.disconnect();
      filter.disconnect();
      gainNode.disconnect();
    };
  } catch (error) {
    // Silently fail if audio is not supported or blocked
    console.warn('Jetpack sound playback failed:', error);
  }
};

// Generate and play rocket launch sound effect
const playRocketSound = () => {
  try {
    const ctx = getAudioContext();
    
    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Create oscillator for powerful rocket engine sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Add filter for deep rocket rumble
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + 0.5);
    
    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Configure rocket sound: deep rumble with powerful rising pitch
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(60, now);
    oscillator.frequency.exponentialRampToValueAtTime(180, now + 0.5);
    
    // Volume envelope: powerful attack, sustained, then decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.08); // Powerful attack
    gainNode.gain.linearRampToValueAtTime(0.22, now + 0.3); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6); // Decay
    
    // Play the sound
    oscillator.start(now);
    oscillator.stop(now + 0.6);
    
    // Clean up after sound finishes
    oscillator.onended = () => {
      oscillator.disconnect();
      filter.disconnect();
      gainNode.disconnect();
    };
  } catch (error) {
    // Silently fail if audio is not supported or blocked
    console.warn('Rocket sound playback failed:', error);
  }
};

// Generate and play falling/game-over sound effect
const playGameOverSound = () => {
  try {
    const ctx = getAudioContext();
    
    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Create oscillator for falling sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Add filter for more dramatic falling effect
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);
    
    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Configure falling sound: descending pitch sweep for dramatic effect
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.5);
    
    // Volume envelope: quick attack, sustained, then fade out
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.05); // Quick attack
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.2); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5); // Fade out
    
    // Play the sound
    oscillator.start(now);
    oscillator.stop(now + 0.5);
    
    // Clean up after sound finishes
    oscillator.onended = () => {
      oscillator.disconnect();
      filter.disconnect();
      gainNode.disconnect();
    };
  } catch (error) {
    // Silently fail if audio is not supported or blocked
    console.warn('Game over sound playback failed:', error);
  }
};

export function useGameLogic(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  gameState: GameState,
  setGameState: (state: GameState) => void,
  onJump?: () => void // Callback for when player jumps - now only increments local counter
) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const playerRef = useRef<Player | null>(null);
  const platformsRef = useRef<Platform[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const bulletsRef = useRef<Array<{ x: number; y: number; vy: number }>>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const animationFrameRef = useRef<number | null>(null);
  const worldOffsetRef = useRef(0); // Tracks how much the world has scrolled
  const maxHeightRef = useRef(0);
  const highestPlatformYRef = useRef(0);
  const gameTimeRef = useRef(0); // Track game time for smooth animations
  const gameOverSoundPlayedRef = useRef(false); // Track if game over sound has been played

  // Device orientation for mobile tilt controls
  const isMobile = isMobileDevice();
  const deviceOrientation = useDeviceOrientation(isMobile && gameState === 'playing');

  const createPlatform = useCallback((x: number, y: number, canvasWidth: number): Platform => {
    // 15-20% of platforms should be moving
    const isMoving = Math.random() < 0.175; // 17.5% moving platforms
    
    const platform: Platform = {
      x,
      y,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      type: Math.random() < 0.75 ? 'normal' : 'breaking',
      broken: false,
    };

    if (isMoving) {
      // Configure moving platform properties
      platform.isMoving = true;
      platform.movingBaseX = x; // Store the center position
      platform.movingSpeed = 0.8 + Math.random() * 0.6; // Speed variation (0.8-1.4)
      platform.movingRange = 40 + Math.random() * 40; // Range variation (40-80 pixels)
    }

    return platform;
  }, []);

  const updateMovingPlatforms = useCallback((deltaTime: number, canvasWidth: number) => {
    // Update all moving platforms based on time
    for (const platform of platformsRef.current) {
      if (platform.isMoving && platform.movingBaseX !== undefined && 
          platform.movingSpeed !== undefined && platform.movingRange !== undefined) {
        
        // Calculate smooth sinusoidal horizontal movement
        const time = gameTimeRef.current * 0.001; // Convert to seconds
        const offset = Math.sin(time * platform.movingSpeed) * platform.movingRange;
        
        // Update platform x position
        platform.x = platform.movingBaseX + offset;
        
        // Ensure platform stays within canvas bounds
        if (platform.x < 0) {
          platform.movingBaseX += Math.abs(platform.x);
          platform.x = 0;
        } else if (platform.x + platform.width > canvasWidth) {
          platform.movingBaseX -= (platform.x + platform.width - canvasWidth);
          platform.x = canvasWidth - platform.width;
        }
      }
    }
  }, []);

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Position player at a fixed position (slightly below center for better view upward)
    const playerFixedY = canvas.height * 0.6;
    const startX = canvas.width / 2 - PLAYER_WIDTH / 2;

    const player: Player = {
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
    };

    playerRef.current = player;
    platformsRef.current = [];
    enemiesRef.current = [];
    powerUpsRef.current = [];
    bulletsRef.current = [];
    worldOffsetRef.current = 0;
    maxHeightRef.current = 0;
    gameTimeRef.current = 0;
    gameOverSoundPlayedRef.current = false; // Reset game over sound flag
    setScore(0);

    // Create stable starting platform directly under the player (never moving)
    const startPlatform: Platform = {
      x: startX + PLAYER_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: playerFixedY + PLAYER_HEIGHT + 25,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'normal',
      broken: false,
      isMoving: false,
    };
    platformsRef.current.push(startPlatform);
    highestPlatformYRef.current = startPlatform.y;

    // Generate initial platforms extending well above the player
    // This ensures there's always a path upward from the start
    let currentY = startPlatform.y - (60 + Math.random() * 25);
    const targetY = -canvas.height * 2; // Generate 2 screen heights above initially
    
    while (currentY > targetY) {
      const platformX = Math.random() * (canvas.width - PLATFORM_WIDTH);
      const platform = createPlatform(platformX, currentY, canvas.width);
      platformsRef.current.push(platform);

      // Track highest platform
      if (currentY < highestPlatformYRef.current) {
        highestPlatformYRef.current = currentY;
      }

      // Add power-ups randomly (including jetpack and rocket from the start)
      if (Math.random() < 0.12) {
        const rand = Math.random();
        let powerUpType: 'spring' | 'propeller' | 'jetpack' | 'rocket';
        
        // Rocket can now spawn at any height with low probability
        if (rand > 0.95) {
          powerUpType = 'rocket';
        } else if (rand < 0.4) {
          powerUpType = 'spring';
        } else if (rand < 0.7) {
          powerUpType = 'propeller';
        } else {
          powerUpType = 'jetpack';
        }
        
        powerUpsRef.current.push({
          x: platform.x + PLATFORM_WIDTH / 2 - 12,
          y: platform.y - 18,
          type: powerUpType,
          used: false,
        });
      }

      // Add enemies randomly with wobble animation properties
      if (Math.random() < 0.08) {
        enemiesRef.current.push({
          x: Math.random() * (canvas.width - 35),
          y: currentY - 50,
          width: 35,
          height: 35,
          alive: true,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.8 + Math.random() * 0.6,
        });
      }

      // Consistent platform spacing
      currentY -= 60 + Math.random() * 25;
    }
  }, [canvasRef, createPlatform]);

  const generatePlatformsAbove = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Generate platforms 2-3 screen heights above the highest existing platform
    // This ensures continuous upward gameplay
    const generationThreshold = highestPlatformYRef.current - canvas.height * 2.5;

    // Keep generating platforms until we have sufficient coverage above
    while (highestPlatformYRef.current > generationThreshold) {
      // Calculate difficulty based on total height climbed (world offset)
      const heightClimbed = worldOffsetRef.current;
      const difficulty = Math.min(heightClimbed / 3000, 0.7);
      
      // Platform spacing: varies with difficulty
      // Base spacing ensures all platforms are reachable
      const minSpacing = 55;
      const maxSpacing = 80 + difficulty * 20; // Gradually increases spacing
      const spacing = minSpacing + Math.random() * (maxSpacing - minSpacing);
      
      const newY = highestPlatformYRef.current - spacing;

      // Increase breaking platform chance gradually with height
      const breakingChance = 0.12 + difficulty * 0.25;

      const platformX = Math.random() * (canvas.width - PLATFORM_WIDTH);
      const platform = createPlatform(platformX, newY, canvas.width);
      
      // Override type based on difficulty
      if (Math.random() < breakingChance) {
        platform.type = 'breaking';
      }
      
      platformsRef.current.push(platform);
      
      // Update highest platform Y reference
      highestPlatformYRef.current = newY;

      // Add power-ups with frequency based on difficulty
      // Rocket can now spawn at any height with balanced frequency
      const powerUpChance = 0.10 + difficulty * 0.06;
      if (Math.random() < powerUpChance) {
        const rand = Math.random();
        let powerUpType: 'spring' | 'propeller' | 'jetpack' | 'rocket';
        
        // Rocket spawns randomly throughout the game with low probability
        if (rand > 0.95) {
          powerUpType = 'rocket';
        } else if (rand < 0.4) {
          powerUpType = 'spring';
        } else if (rand < 0.7) {
          powerUpType = 'propeller';
        } else {
          powerUpType = 'jetpack';
        }
        
        powerUpsRef.current.push({
          x: platform.x + PLATFORM_WIDTH / 2 - 12,
          y: platform.y - 18,
          type: powerUpType,
          used: false,
        });
      }

      // Add enemies with increasing frequency as player climbs
      const enemyChance = 0.05 + difficulty * 0.12;
      if (Math.random() < enemyChance) {
        enemiesRef.current.push({
          x: Math.random() * (canvas.width - 35),
          y: newY - 50,
          width: 35,
          height: 35,
          alive: true,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.8 + Math.random() * 0.6,
        });
      }
    }
  }, [canvasRef, createPlatform]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const player = playerRef.current;
    if (!canvas || !player || gameState !== 'playing') return;

    // Update game time for smooth animations (milliseconds)
    gameTimeRef.current += 16; // Approximate 60 FPS

    // Update moving platforms
    updateMovingPlatforms(16, canvas.width);

    // CRITICAL: Check for game over - if player falls below screen
    if (player.y > canvas.height + 100) {
      // Play game over sound effect once at the moment of fall detection
      if (!gameOverSoundPlayedRef.current) {
        playGameOverSound();
        gameOverSoundPlayedRef.current = true;
      }
      
      setGameState('gameOver');
      return;
    }

    // Handle input - keyboard, touch, or tilt
    let moveDirection = 0;

    // Keyboard input
    if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) {
      moveDirection = -1;
    } else if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) {
      moveDirection = 1;
    }

    // Device tilt input (overrides keyboard on mobile)
    if (isMobile && deviceOrientation.permissionGranted && Math.abs(deviceOrientation.tiltX) > 0.05) {
      moveDirection = deviceOrientation.tiltX;
    }

    // Apply movement with analog control support
    player.vx = moveDirection * MOVE_SPEED;

    // Update player position
    player.x += player.vx;

    // Screen wrap-around
    if (player.x < -player.width) {
      player.x = canvas.width;
    } else if (player.x > canvas.width) {
      player.x = -player.width;
    }

    // Apply gravity, rocket, jetpack, or propeller
    if (player.hasRocket && player.rocketTime > 0) {
      // Rocket provides the most powerful upward boost
      player.vy = -ROCKET_BOOST;
      player.rocketTime--;
      if (player.rocketTime <= 0) {
        player.hasRocket = false;
      }
    } else if (player.hasJetpack && player.jetpackTime > 0) {
      // Jetpack provides significantly faster upward boost
      player.vy = -JETPACK_BOOST;
      player.jetpackTime--;
      if (player.jetpackTime <= 0) {
        player.hasJetpack = false;
      }
    } else if (player.hasPropeller && player.propellerTime > 0) {
      player.vy = -PROPELLER_BOOST;
      player.propellerTime--;
      if (player.propellerTime <= 0) {
        player.hasPropeller = false;
      }
    } else {
      player.vy += GRAVITY;
    }

    player.y += player.vy;

    // Platform collision (only when falling)
    if (player.vy > 0) {
      for (const platform of platformsRef.current) {
        if (
          !platform.broken &&
          player.x + player.width > platform.x &&
          player.x < platform.x + platform.width &&
          player.y + player.height > platform.y &&
          player.y + player.height < platform.y + platform.height + 10 &&
          player.vy > 0
        ) {
          // JUMP LOGIC: Play sound effect when jump begins
          playJumpSound();
          
          // Trigger jump callback to increment LOCAL counter (no backend call)
          if (onJump) {
            onJump();
          }
          
          player.vy = JUMP_VELOCITY;
          if (platform.type === 'breaking') {
            platform.broken = true;
          }
        }
      }
    }

    // Check if any item effect is currently active
    const hasActiveItemEffect = (player.hasRocket && player.rocketTime > 0) ||
                                 (player.hasJetpack && player.jetpackTime > 0) || 
                                 (player.hasPropeller && player.propellerTime > 0);

    // Power-up collision - BLOCKED DURING ACTIVE EFFECTS
    // While an item effect is active, all power-up collection is temporarily disabled
    if (!hasActiveItemEffect) {
      for (const powerUp of powerUpsRef.current) {
        if (
          !powerUp.used &&
          player.x + player.width > powerUp.x &&
          player.x < powerUp.x + 24 &&
          player.y + player.height > powerUp.y &&
          player.y < powerUp.y + 24
        ) {
          powerUp.used = true;
          if (powerUp.type === 'spring') {
            // SPRING BOOST: Play sound effect for spring jump
            playJumpSound();
            
            // Trigger jump callback for spring boost (LOCAL counter only)
            if (onJump) {
              onJump();
            }
            
            player.vy = SPRING_BOOST;
          } else if (powerUp.type === 'propeller') {
            player.hasPropeller = true;
            player.propellerTime = PROPELLER_DURATION;
          } else if (powerUp.type === 'jetpack') {
            // JETPACK ACTIVATION: Play distinctive jetpack sound
            playJetpackSound();
            
            // Activate jetpack with higher boost and shorter duration
            player.hasJetpack = true;
            player.jetpackTime = JETPACK_DURATION;
            
            // Deactivate propeller if active (jetpack takes priority)
            player.hasPropeller = false;
            player.propellerTime = 0;
          } else if (powerUp.type === 'rocket') {
            // ROCKET ACTIVATION: Play powerful rocket launch sound
            playRocketSound();
            
            // Activate rocket with maximum boost and extended duration
            player.hasRocket = true;
            player.rocketTime = ROCKET_DURATION;
            
            // Deactivate other power-ups (rocket takes priority)
            player.hasJetpack = false;
            player.jetpackTime = 0;
            player.hasPropeller = false;
            player.propellerTime = 0;
          }
        }
      }
    }

    // Enemy collision - ROCKET AND JETPACK IMMUNITY, ENEMY DESTRUCTION, AND STOMP MECHANICS
    for (const enemy of enemiesRef.current) {
      if (
        enemy.alive &&
        player.x + player.width > enemy.x &&
        player.x < enemy.x + enemy.width &&
        player.y + player.height > enemy.y &&
        player.y < enemy.y + enemy.height
      ) {
        // Check if player has active rocket or jetpack
        if ((player.hasRocket && player.rocketTime > 0) || (player.hasJetpack && player.jetpackTime > 0)) {
          // INVULNERABILITY: Player is immune to enemy damage
          // ENEMY DESTRUCTION: Destroy enemy on contact
          enemy.alive = false;
          // Award bonus points for destroying enemy with rocket or jetpack
          setScore((prev) => prev + 100);
        } else {
          // ENEMY STOMP MECHANICS: Check if player is landing on enemy from above
          // Conditions for stomp:
          // 1. Player must be falling (positive downward velocity)
          // 2. Player's bottom must be near the top of the enemy (landing from above)
          const playerBottom = player.y + player.height;
          const enemyTop = enemy.y;
          const enemyMiddle = enemy.y + enemy.height / 2;
          
          // Check if player is falling and landing on top half of enemy
          const isStompingFromAbove = player.vy > 0 && playerBottom < enemyMiddle;
          
          if (isStompingFromAbove) {
            // STOMP SUCCESS: Destroy enemy and give player a small bounce
            enemy.alive = false;
            
            // Small bounce effect for smooth gameplay (about 60% of normal jump)
            player.vy = JUMP_VELOCITY * 0.6;
            
            // Play jump sound for satisfying feedback
            playJumpSound();
            
            // Award bonus points for stomping enemy
            setScore((prev) => prev + 75);
          } else {
            // SIDE/BELOW COLLISION: Normal behavior - game over
            // Play game over sound effect once at the moment of collision
            if (!gameOverSoundPlayedRef.current) {
              playGameOverSound();
              gameOverSoundPlayedRef.current = true;
            }
            
            setGameState('gameOver');
            return;
          }
        }
      }
    }

    // Update bullets
    bulletsRef.current = bulletsRef.current.filter((bullet) => {
      bullet.y += bullet.vy;
      
      // Check bullet-enemy collision
      for (const enemy of enemiesRef.current) {
        if (
          enemy.alive &&
          bullet.x > enemy.x &&
          bullet.x < enemy.x + enemy.width &&
          bullet.y > enemy.y &&
          bullet.y < enemy.y + enemy.height
        ) {
          enemy.alive = false;
          setScore((prev) => prev + 50);
          return false;
        }
      }
      
      return bullet.y > -50;
    });

    // ENDLESS LEVEL LOGIC: Scroll the world down when player climbs above threshold
    // Player stays at a relatively fixed vertical position while world scrolls
    const scrollThreshold = canvas.height * 0.4; // Player should stay around 40% from top
    
    if (player.y < scrollThreshold) {
      // Calculate how much to scroll
      const scrollAmount = scrollThreshold - player.y;
      
      // Move player back to threshold position
      player.y = scrollThreshold;
      
      // Scroll the entire world down by moving all entities
      platformsRef.current.forEach((p) => {
        p.y += scrollAmount;
        // Update moving platform base Y as well
        if (p.isMoving && p.movingBaseX !== undefined) {
          // movingBaseX stays the same, only y changes
        }
      });
      enemiesRef.current.forEach((e) => (e.y += scrollAmount));
      powerUpsRef.current.forEach((p) => (p.y += scrollAmount));
      bulletsRef.current.forEach((b) => (b.y += scrollAmount));
      
      // Update world offset to track total height climbed
      worldOffsetRef.current += scrollAmount;
      
      // Update highest platform Y reference when world scrolls
      highestPlatformYRef.current += scrollAmount;
    }

    // Update score based on height climbed (world offset)
    const currentHeight = Math.floor(worldOffsetRef.current / 10);
    if (currentHeight > maxHeightRef.current) {
      maxHeightRef.current = currentHeight;
      setScore(currentHeight);
      if (currentHeight > highScore) {
        setHighScore(currentHeight);
      }
    }

    // CONTINUOUS PLATFORM GENERATION: Generate new platforms as player climbs
    generatePlatformsAbove();

    // OPTIMIZED AUTOMATIC CLEANUP: Aggressively remove entities below visible screen
    // This is critical for maintaining constant performance in endless gameplay
    // Remove platforms immediately when they go below the screen (no buffer needed)
    const removalThreshold = canvas.height;
    
    // Use efficient in-place filtering to minimize memory allocations
    // Only keep entities that are still visible or slightly above screen
    const platformCount = platformsRef.current.length;
    platformsRef.current = platformsRef.current.filter((p) => p.y < removalThreshold);
    
    // Track removed platforms for debugging/optimization metrics
    const platformsRemoved = platformCount - platformsRef.current.length;
    
    // Clean up enemies, power-ups, and bullets with same aggressive threshold
    enemiesRef.current = enemiesRef.current.filter((e) => e.y < removalThreshold);
    powerUpsRef.current = powerUpsRef.current.filter((p) => p.y < removalThreshold);
    bulletsRef.current = bulletsRef.current.filter((b) => b.y < removalThreshold + 50);

    // Draw with optimized renderer that culls off-screen entities
    drawGame(
      canvas,
      player,
      platformsRef.current,
      enemiesRef.current,
      powerUpsRef.current,
      bulletsRef.current,
      0, // No camera offset needed since world scrolls instead
      canvas.height, // Pass canvas height for renderer optimization
      gameTimeRef.current // Pass game time for animations
    );

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, setGameState, generatePlatformsAbove, highScore, isMobile, deviceOrientation, onJump, updateMovingPlatforms]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key] = true;
    
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      const player = playerRef.current;
      const canvas = canvasRef.current;
      if (player && canvas && gameState === 'playing') {
        bulletsRef.current.push({
          x: player.x + player.width / 2,
          y: player.y,
          vy: -10,
        });
      }
    }
  }, [gameState]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key] = false;
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    } else {
      // Clean up animation frame when not playing
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [gameState, gameLoop, handleKeyDown, handleKeyUp]);

  const startGame = useCallback(() => {
    initGame();
    setIsPaused(false);
  }, [initGame]);

  const pauseGame = useCallback(() => {
    setIsPaused(true);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const resumeGame = useCallback(() => {
    setIsPaused(false);
  }, []);

  const resetGame = useCallback(() => {
    initGame();
    setIsPaused(false);
  }, [initGame]);

  return {
    score,
    highScore,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    isPaused,
    isMobile,
  };
}
