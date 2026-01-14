import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRAVITY, 
  JUMP_FORCE, 
  BASE_SPEED,
  MAX_SPEED,
  PLAYER_SIZE,
  GameState,
  ObstacleType,
  MAX_ENERGY,
  ENERGY_DRAIN,
  ENERGY_RECHARGE,
  SPIKE_IMG_URL,
  SAW_IMG_URL,
  MOVING_OBJ_IMG_URL,
  BoosterType,
  GameMode,
  MISSIONS
} from '../constants';
import { Player, Obstacle, Collectible, Particle } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  gameMode: GameMode;
  levelIndex: number;
  selectedSkinColor: string;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setEnergy: (energy: number) => void;
  setCoins: (updater: (prev: number) => number) => void;
  isTimeFrozen: boolean;
  setIsTimeFrozen: (frozen: boolean) => void;
  triggerJump: number;
  customLevel?: Partial<Obstacle>[];
  activeBoosterEffect: BoosterType | null;
  onBoosterConsumed: () => void;
}

export interface GameCanvasHandle {
  revive: () => void;
}

const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({ 
  gameState, 
  gameMode,
  levelIndex,
  selectedSkinColor,
  setGameState, 
  setScore, 
  setEnergy, 
  setCoins,
  isTimeFrozen, 
  setIsTimeFrozen,
  triggerJump,
  customLevel,
  activeBoosterEffect,
  onBoosterConsumed
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const spikeImgRef = useRef<HTMLImageElement | null>(null);
  const sawImgRef = useRef<HTMLImageElement | null>(null);
  const movingImgRef = useRef<HTMLImageElement | null>(null);
  
  const triggerJumpRef = useRef<number>(0);
  useEffect(() => { triggerJumpRef.current = triggerJump; }, [triggerJump]);

  const playerRef = useRef<Player>({
    x: 100, y: 300, width: PLAYER_SIZE, height: PLAYER_SIZE,
    color: selectedSkinColor, dy: 0, isGrounded: false, isDead: false,
    distanceTraveled: 0, shieldActive: false, magnetActive: false, boosterTimer: 0
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const energyRef = useRef<number>(MAX_ENERGY);
  const cameraXRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const lastJumpTriggerRef = useRef<number>(0);
  const jumpBufferRef = useRef<number>(0);
  const coyoteTimeRef = useRef<number>(0);
  const currentSpeed = useRef(BASE_SPEED);

  useImperativeHandle(ref, () => ({
    revive: () => {
      playerRef.current.isDead = false;
      playerRef.current.shieldActive = true; 
      playerRef.current.boosterTimer = 180;
      playerRef.current.dy = 0;
      playerRef.current.y = CANVAS_HEIGHT / 2;
      setGameState(GameState.PLAYING);
    }
  }));

  useEffect(() => {
    const imgS = new Image(); imgS.src = SPIKE_IMG_URL; imgS.onload = () => { spikeImgRef.current = imgS; };
    const imgSaw = new Image(); imgSaw.src = SAW_IMG_URL; imgSaw.onload = () => { sawImgRef.current = imgSaw; };
    const imgMov = new Image(); imgMov.src = MOVING_OBJ_IMG_URL; imgMov.onload = () => { movingImgRef.current = imgMov; };
  }, []);

  useEffect(() => {
    if (activeBoosterEffect) {
      const p = playerRef.current;
      if (activeBoosterEffect === BoosterType.SHIELD) {
        p.shieldActive = true; p.boosterTimer = 400;
      } else if (activeBoosterEffect === BoosterType.MAGNET) {
        p.magnetActive = true; p.boosterTimer = 300;
      } else if (activeBoosterEffect === BoosterType.energy) {
        energyRef.current = MAX_ENERGY; setEnergy(MAX_ENERGY);
      }
      onBoosterConsumed();
      createParticles(p.distanceTraveled + p.width/2, p.y + p.height/2, '#ffffff', 20);
    }
  }, [activeBoosterEffect, onBoosterConsumed, setEnergy]);

  const spawnChunk = (startX: number) => {
    // Difficulty logic: mission 5 is harder
    const isImpossible = gameMode === GameMode.LEVELS && levelIndex === 5;
    const densityBonus = isImpossible ? 6 : Math.min(4, Math.floor(scoreRef.current / 400));
    const eventCount = 2 + densityBonus;
    const floorY = CANVAS_HEIGHT - 20;

    for (let i = 0; i < eventCount; i++) {
      const spacing = isImpossible ? 180 : Math.max(220, 500 - (scoreRef.current / 12));
      const x = startX + i * spacing + Math.random() * 80;
      const type = Math.floor(Math.random() * 5) as ObstacleType;
      const size = 45;
      
      let y = floorY - size;
      
      // OBSTACLE HEIGHT: Ensure everything is at player level (jumpable or duckable)
      if (type === ObstacleType.ROTATING_SAW || type === ObstacleType.CIRCULAR) {
        const isLow = Math.random() > 0.3;
        // Low (must jump) or Mid (must jump over or run under)
        y = isLow ? floorY - size : floorY - size - 65;
      } else if (type === ObstacleType.FLOATING_PLATFORM) {
        // Platform is low enough to jump onto
        y = floorY - 60 - Math.random() * 20;
      } else if (type === ObstacleType.STATIC_SPIKE) {
        y = floorY - size + 6; // TOUCHING FLOOR: sunk slightly to look grounded
      } else if (type === ObstacleType.MOVING_PISTON) {
        y = floorY - size;
      }

      obstaclesRef.current.push({
        x, y, width: size, height: size, color: '#f43f5e',
        type, passed: false, initialX: x, initialY: y,
        moveSpeed: 2 + (scoreRef.current / 1000) + (isImpossible ? 1.5 : 0), moveRange: type === ObstacleType.CIRCULAR ? 50 : 80, moveDirection: 1, angle: Math.random() * Math.PI * 2
      });

      collectiblesRef.current.push({
        x: x + 120, y: floorY - 60 - Math.random() * 90,
        width: 22, height: 22, color: '#fbbf24', collected: false, value: 1
      });
    }
  };

  const loadLevel = useCallback((index: number) => {
    obstaclesRef.current = []; collectiblesRef.current = [];
    // Just seed initial chunks, infinite logic handles the rest
    for (let i = 0; i < 3; i++) {
      spawnChunk(800 + i * 1000);
    }
  }, []);

  const resetGame = useCallback(() => {
    playerRef.current = {
      x: 100, y: CANVAS_HEIGHT - 100, width: PLAYER_SIZE, height: PLAYER_SIZE,
      color: selectedSkinColor, dy: 0, isGrounded: false, isDead: false,
      distanceTraveled: 0, shieldActive: false, magnetActive: false, boosterTimer: 0
    };
    obstaclesRef.current = []; collectiblesRef.current = []; particlesRef.current = [];
    energyRef.current = MAX_ENERGY; cameraXRef.current = 0; scoreRef.current = 0;
    jumpBufferRef.current = 0; coyoteTimeRef.current = 0;
    currentSpeed.current = BASE_SPEED;
    lastJumpTriggerRef.current = triggerJumpRef.current;
    setScore(0); setEnergy(MAX_ENERGY);

    if (gameMode === GameMode.LEVELS) loadLevel(levelIndex);
    else if (gameMode === GameMode.CUSTOM && customLevel) {
      obstaclesRef.current = customLevel.map(o => ({
        ...o, passed: false, initialX: o.x!, initialY: o.y!, moveSpeed: 2, 
        moveRange: 100, moveDirection: 1, angle: 0, color: '#f43f5e', width: 45, height: 45
      } as Obstacle));
    } else {
      for (let i = 0; i < 3; i++) spawnChunk(i * 1000 + 800);
    }
  }, [setScore, setEnergy, gameMode, levelIndex, loadLevel, selectedSkinColor, customLevel]);

  const createParticles = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
        life: 1.0, maxLife: 1.0, color, size: Math.random() * 4 + 2
      });
    }
  };

  const update = () => {
    if (gameState !== GameState.PLAYING) return;
    const player = playerRef.current;
    
    currentSpeed.current = Math.min(MAX_SPEED, BASE_SPEED + (scoreRef.current / 1500) * 4);

    if (player.boosterTimer > 0) {
      player.boosterTimer--;
      if (player.boosterTimer <= 0) { player.shieldActive = false; player.magnetActive = false; }
    }

    if (isTimeFrozen) {
      energyRef.current -= ENERGY_DRAIN;
      if (energyRef.current <= 0) { energyRef.current = 0; setIsTimeFrozen(false); }
    } else {
      energyRef.current = Math.min(MAX_ENERGY, energyRef.current + ENERGY_RECHARGE);
    }
    setEnergy(energyRef.current);

    player.distanceTraveled += currentSpeed.current;
    cameraXRef.current = player.distanceTraveled;
    player.dy += GRAVITY;
    player.y += player.dy;

    if (player.y + player.height > CANVAS_HEIGHT - 20) {
      player.y = CANVAS_HEIGHT - 20 - player.height;
      player.dy = 0; player.isGrounded = true; coyoteTimeRef.current = 10;
    } else {
      if (player.isGrounded) player.isGrounded = false;
      if (coyoteTimeRef.current > 0) coyoteTimeRef.current--;
    }

    if (triggerJumpRef.current !== lastJumpTriggerRef.current) {
      jumpBufferRef.current = 10; lastJumpTriggerRef.current = triggerJumpRef.current;
    }

    if (jumpBufferRef.current > 0 && (player.isGrounded || coyoteTimeRef.current > 0)) {
      player.dy = JUMP_FORCE; player.isGrounded = false; coyoteTimeRef.current = 0; jumpBufferRef.current = 0;
      createParticles(player.distanceTraveled + player.width/2, player.y + player.height, '#ffffff', 5);
    }
    if (jumpBufferRef.current > 0) jumpBufferRef.current--;

    const playerWorldX = player.distanceTraveled;
    const margin = 5;

    obstaclesRef.current.forEach(obs => {
      if (!isTimeFrozen) {
        if (obs.type === ObstacleType.MOVING_PISTON) {
           obs.y += obs.moveSpeed * obs.moveDirection;
           if (Math.abs(obs.y - obs.initialY) > obs.moveRange) obs.moveDirection *= -1;
        } else if (obs.type === ObstacleType.FLOATING_PLATFORM) {
          obs.x += obs.moveSpeed * obs.moveDirection;
          if (Math.abs(obs.x - obs.initialX) > obs.moveRange) obs.moveDirection *= -1;
        } else if (obs.type === ObstacleType.ROTATING_SAW) {
          obs.angle += 0.08;
        } else if (obs.type === ObstacleType.CIRCULAR) {
          obs.angle += 0.04;
          obs.x = obs.initialX + Math.cos(obs.angle) * obs.moveRange;
          obs.y = obs.initialY + Math.sin(obs.angle) * obs.moveRange;
        }
      }

      if (playerWorldX + margin < obs.x + obs.width - margin &&
          playerWorldX + player.width - margin > obs.x + margin &&
          player.y + margin < obs.y + obs.height - margin &&
          player.y + player.height - margin > obs.y + margin) {
        
        if (player.shieldActive) {
          player.shieldActive = false; player.boosterTimer = 0;
          obs.x = -2000; createParticles(playerWorldX + player.width, obs.y, '#38bdf8', 15);
        } else if (obs.type === ObstacleType.FLOATING_PLATFORM && player.dy > 0 && player.y + player.height - player.dy - margin <= obs.y) {
           player.y = obs.y - player.height; player.dy = 0; player.isGrounded = true; coyoteTimeRef.current = 10;
        } else {
           player.isDead = true;
           createParticles(playerWorldX + player.width/2, player.y + player.height/2, player.color, 25);
           setGameState(GameState.GAME_OVER);
        }
      }
    });

    collectiblesRef.current.forEach(col => {
      if (col.collected) return;
      let dx = col.x - playerWorldX; let dy = col.y - player.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if (player.magnetActive && dist < 180) { col.x -= dx * 0.18; col.y -= dy * 0.18; }
      if (dist < 40) {
        col.collected = true;
        scoreRef.current += col.value; setScore(scoreRef.current); setCoins(prev => prev + col.value);
        createParticles(col.x, col.y, col.color, 5);
      }
    });

    // INFINITE GENERATION: used for both endless and missions
    if (gameMode === GameMode.ENDLESS || gameMode === GameMode.LEVELS) {
      const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
      if (!lastObs || lastObs.x < player.distanceTraveled + CANVAS_WIDTH) spawnChunk(player.distanceTraveled + 1200);
    }
    particlesRef.current.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, isTimeFrozen ? '#0f172a' : '#020617');
    bgGradient.addColorStop(1, '#000000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const viewOffsetX = cameraXRef.current - 100;
    ctx.fillStyle = isTimeFrozen ? '#334155' : '#1e293b';
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);

    obstaclesRef.current.forEach(obs => {
      const sx = obs.x - viewOffsetX;
      if (sx < -100 || sx > CANVAS_WIDTH + 100) return;
      
      if (obs.type === ObstacleType.STATIC_SPIKE && spikeImgRef.current) {
        ctx.drawImage(spikeImgRef.current, sx, obs.y, obs.width, obs.height);
      } else if (obs.type === ObstacleType.ROTATING_SAW && sawImgRef.current) {
        ctx.save();
        ctx.translate(sx + obs.width/2, obs.y + obs.height/2);
        ctx.rotate(obs.angle);
        ctx.drawImage(sawImgRef.current, -obs.width/2, -obs.height/2, obs.width, obs.height);
        ctx.restore();
      } else {
        if (movingImgRef.current) {
          ctx.drawImage(movingImgRef.current, sx, obs.y, obs.width, obs.height);
        } else {
          ctx.fillStyle = isTimeFrozen ? '#475569' : obs.color;
          ctx.fillRect(sx, obs.y, obs.width, obs.height);
        }
      }
    });

    collectiblesRef.current.forEach(col => {
      if (col.collected) return;
      const sx = col.x - viewOffsetX;
      ctx.fillStyle = isTimeFrozen ? '#94a3b8' : col.color; ctx.beginPath();
      ctx.arc(sx + col.width/2, col.y + col.height/2, col.width/2, 0, Math.PI*2); ctx.fill();
    });

    const player = playerRef.current;
    ctx.save();
    ctx.shadowBlur = player.shieldActive ? 30 : 20;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.fillRect(100, player.y, player.width, player.height);
    if (player.shieldActive) {
      ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 4;
      ctx.strokeRect(94, player.y - 6, player.width + 12, player.height + 12);
    }
    ctx.restore();

    particlesRef.current.forEach(p => {
      const sx = p.x - viewOffsetX;
      ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.beginPath();
      ctx.arc(sx, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1.0;
    });
  };

  const loop = useCallback(() => {
    update();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx);
    }
    requestRef.current = requestAnimationFrame(loop);
  }, [gameState, isTimeFrozen]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [loop]);

  useEffect(() => {
    if (gameState === GameState.MENU || gameState === GameState.LEVEL_SELECTOR) resetGame();
  }, [gameState, resetGame]);

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full object-contain bg-black" />;
});

export default GameCanvas;
