
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -10;
export const BASE_SPEED = 5;
export const MAX_SPEED = 12;
export const PLAYER_SIZE = 32;
export const MAX_ENERGY = 100;
export const ENERGY_DRAIN = 0.8;
export const ENERGY_RECHARGE = 0.3;

export enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER,
  SHOP,
  LEVEL_SELECTOR,
  EDITOR,
  LEVEL_COMPLETED,
  AD_WATCHING
}

export enum GameMode {
  ENDLESS,
  LEVELS,
  CUSTOM
}

export enum ObstacleType {
  STATIC_SPIKE,
  MOVING_PISTON,
  ROTATING_SAW,
  FLOATING_PLATFORM,
  CIRCULAR
}

export enum BoosterType {
  MAGNET = 'magnet',
  SHIELD = 'shield',
  energy = 'energy'
}

export const BOOSTER_PRICES = {
  [BoosterType.MAGNET]: 30,
  [BoosterType.SHIELD]: 50,
  [BoosterType.energy]: 25
};

export const SKINS = [
  { id: 'default', name: 'NEON PROTOCOL', color: '#0ea5e9', price: 0 },
  { id: 'crimson', name: 'CRIMSON GHOST', color: '#ef4444', price: 50 },
  { id: 'emerald', name: 'EMERALD PHASE', color: '#10b981', price: 100 },
  { id: 'gold', name: 'AURIC CHRONOS', color: '#f59e0b', price: 250 },
];

export const MISSIONS = [
  { id: 1, name: "Sector 7-A", target: 10, difficulty: "Tutorial" },
  { id: 2, name: "Grid Runner", target: 20, difficulty: "Easy" },
  { id: 3, name: "Phase Shift", target: 50, difficulty: "Normal" },
  { id: 4, name: "Zero Logic", target: 100, difficulty: "Hard" },
  { id: 5, name: "Vantablack", target: 500, difficulty: "Impossible" },
];

export const SPIKE_IMG_URL = 'https://i.postimg.cc/6yRGR92h/Bg.png';
export const SAW_IMG_URL = 'https://i.postimg.cc/tYwG0j2c/saw.png';
export const MOVING_OBJ_IMG_URL = 'https://i.postimg.cc/tYwG0j2c/saw-bg.png';
