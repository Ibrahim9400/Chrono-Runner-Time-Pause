import { ObstacleType, BoosterType } from './constants';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Player extends Entity {
  dy: number;
  isGrounded: boolean;
  isDead: boolean;
  distanceTraveled: number;
  shieldActive: boolean;
  magnetActive: boolean;
  boosterTimer: number;
}

export interface Obstacle extends Entity {
  type: ObstacleType;
  passed: boolean;
  initialX: number;
  initialY: number;
  moveSpeed: number;
  moveRange: number;
  moveDirection: number;
  angle: number;
}

export interface Collectible extends Entity {
  collected: boolean;
  value: number;
  isBooster?: boolean;
  boosterType?: BoosterType;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Inventory {
  shield: number;
  magnet: number;
  energy: number;
}
