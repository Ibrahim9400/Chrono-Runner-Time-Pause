
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import GameCanvas, { GameCanvasHandle } from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameState, MAX_ENERGY, GameMode, SKINS, BoosterType, BOOSTER_PRICES, MISSIONS } from './constants';
import { Inventory } from './types';

declare global {
  interface Window {
    CrazyGames: any;
  }
}

const App: React.FC = () => {
  const gameRef = useRef<GameCanvasHandle>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.ENDLESS);
  const [levelIndex, setLevelIndex] = useState(1);
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);
  const [jumpTrigger, setJumpTrigger] = useState(0);
  const [activeBoosterEffect, setActiveBoosterEffect] = useState<BoosterType | null>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const sdkInitializing = useRef(false);

  // CrazyGames SDK initialization with extreme safety
  useEffect(() => {
    let mounted = true;

    const initializeSDK = async () => {
      if (sdkInitializing.current) return;
      
      // Small delay to ensure the script is ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (mounted && window.CrazyGames?.SDK) {
        sdkInitializing.current = true;
        try {
          // Wrap init in an extra layer of try-catch and timeout
          const initPromise = window.CrazyGames.SDK.init();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SDK Init Timeout')), 3000)
          );
          
          await Promise.race([initPromise, timeoutPromise]);
          
          if (mounted) {
            console.log("CrazyGames SDK Initialized Successfully");
            setIsSdkReady(true);
          }
        } catch (error) {
          // Catch the [object Object] or other errors here
          console.warn("CrazyGames SDK initialization failed (caught):", error);
          if (mounted) setIsSdkReady(false);
        }
      }
    };
    
    initializeSDK();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Tracking gameplay for CrazyGames - strictly guarded
  useEffect(() => {
    if (isSdkReady && window.CrazyGames?.SDK?.game) {
      try {
        if (gameState === GameState.PLAYING) {
          window.CrazyGames.SDK.game.gameplayStart();
        } else {
          window.CrazyGames.SDK.game.gameplayStop();
        }
      } catch (e) {
        // Silently swallow errors from SDK tracking
      }
    }
  }, [gameState, isSdkReady]);

  // Persistent State with comprehensive try-catch wrappers to avoid "Uncaught [object Object]" on startup
  const safeGetItem = (key: string, defaultValue: string) => {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const [highScore, setHighScore] = useState(() => Number(safeGetItem('chrono_high_score', '0')));
  const [coins, setCoins] = useState(() => Number(safeGetItem('chrono_coins', '0')));
  
  const [inventory, setInventory] = useState<Inventory>(() => {
    try {
      const saved = localStorage.getItem('chrono_inventory');
      return saved ? JSON.parse(saved) : { shield: 0, magnet: 0, energy: 0 };
    } catch (e) {
      return { shield: 0, magnet: 0, energy: 0 };
    }
  });

  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('chrono_unlocked_skins');
      return saved ? JSON.parse(saved) : ['default'];
    } catch (e) {
      return ['default'];
    }
  });

  const [unlockedLevels, setUnlockedLevels] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('chrono_unlocked_levels');
      return saved ? JSON.parse(saved) : [1];
    } catch (e) {
      return [1];
    }
  });

  const [selectedSkin, setSelectedSkin] = useState(() => safeGetItem('chrono_selected_skin', 'default'));
  const [customLevel, setCustomLevel] = useState<any[]>([]);

  // Safe persist effects
  useEffect(() => { try { localStorage.setItem('chrono_high_score', highScore.toString()); } catch (e) {} }, [highScore]);
  useEffect(() => { try { localStorage.setItem('chrono_coins', coins.toString()); } catch (e) {} }, [coins]);
  useEffect(() => { try { localStorage.setItem('chrono_inventory', JSON.stringify(inventory)); } catch (e) {} }, [inventory]);
  useEffect(() => { try { localStorage.setItem('chrono_unlocked_skins', JSON.stringify(unlockedSkins)); } catch (e) {} }, [unlockedSkins]);
  useEffect(() => { try { localStorage.setItem('chrono_selected_skin', selectedSkin); } catch (e) {} }, [selectedSkin]);
  useEffect(() => { try { localStorage.setItem('chrono_unlocked_levels', JSON.stringify(unlockedLevels)); } catch (e) {} }, [unlockedLevels]);

  const selectedSkinColor = useMemo(() => SKINS.find(s => s.id === selectedSkin)?.color || '#0ea5e9', [selectedSkin]);

  const handleJump = useCallback(() => {
    if (gameState === GameState.PLAYING) setJumpTrigger(prev => prev + 1);
  }, [gameState]);

  const handleToggleFreeze = useCallback(() => {
    if (gameState === GameState.PLAYING) setIsTimeFrozen(prev => !prev);
  }, [gameState]);

  const handleTogglePause = useCallback(() => {
    if (gameState === GameState.PLAYING) setGameState(GameState.PAUSED);
    else if (gameState === GameState.PAUSED) setGameState(GameState.PLAYING);
  }, [gameState]);

  useEffect(() => {
    if (gameMode === GameMode.LEVELS && gameState === GameState.PLAYING) {
      const currentMission = MISSIONS.find(m => m.id === levelIndex);
      if (currentMission && score >= currentMission.target) {
        setGameState(GameState.LEVEL_COMPLETED);
        if (levelIndex < MISSIONS.length && !unlockedLevels.includes(levelIndex + 1)) {
          setUnlockedLevels(prev => [...prev, levelIndex + 1]);
        }
      }
    }
  }, [score, gameMode, gameState, levelIndex, unlockedLevels]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); handleJump(); }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'p') handleToggleFreeze();
      if (e.code === 'Escape') handleTogglePause();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleJump, handleToggleFreeze, handleTogglePause]);

  useEffect(() => { if (score > highScore) setHighScore(score); }, [score, highScore]);

  const onBuySkin = (skinId: string, price: number) => {
    if (coins >= price) { setCoins(p => p - price); setUnlockedSkins(p => [...p, skinId]); setSelectedSkin(skinId); }
  };

  const onBuyBooster = (type: BoosterType) => {
    const price = BOOSTER_PRICES[type];
    if (coins >= price) {
      setCoins(p => p - price);
      setInventory(p => ({ ...p, [type]: p[type as keyof Inventory] + 1 }));
    }
  };

  const onUseBooster = (type: BoosterType) => {
    if (inventory[type as keyof Inventory] > 0) {
      setInventory(p => ({ ...p, [type]: p[type as keyof Inventory] - 1 }));
      setActiveBoosterEffect(type);
    }
  };

  const onAdFinished = useCallback(() => {
    gameRef.current?.revive();
    setGameState(GameState.PLAYING);
    setIsTimeFrozen(false);
  }, []);

  return (
    <div className="w-screen h-screen bg-[#020617] flex items-center justify-center select-none overflow-hidden font-sans">
      <div className="relative w-full h-full bg-black overflow-hidden">
        <GameCanvas 
          ref={gameRef}
          gameState={gameState} gameMode={gameMode} levelIndex={levelIndex}
          selectedSkinColor={selectedSkinColor} setGameState={setGameState}
          setScore={setScore} setEnergy={setEnergy} setCoins={setCoins}
          isTimeFrozen={isTimeFrozen} setIsTimeFrozen={setIsTimeFrozen}
          triggerJump={jumpTrigger} customLevel={customLevel}
          activeBoosterEffect={activeBoosterEffect}
          onBoosterConsumed={() => setActiveBoosterEffect(null)}
        />
        <UIOverlay 
          gameState={gameState} gameMode={gameMode} levelIndex={levelIndex} score={score} highScore={highScore}
          coins={coins} energy={energy} selectedSkin={selectedSkin} unlockedSkins={unlockedSkins}
          unlockedLevels={unlockedLevels}
          inventory={inventory} setGameState={setGameState} setGameMode={setGameMode} setLevelIndex={setLevelIndex}
          onStart={() => { setGameState(GameState.PLAYING); setIsTimeFrozen(false); setScore(0); }}
          onRestart={() => { setGameState(GameState.MENU); setTimeout(() => { setGameState(GameState.PLAYING); setIsTimeFrozen(false); }, 50); }}
          isTimeFrozen={isTimeFrozen} onToggleFreeze={handleToggleFreeze} onJump={handleJump}
          onBuySkin={onBuySkin} onSelectSkin={setSelectedSkin} onBuyBooster={onBuyBooster}
          onUseBooster={onUseBooster} onBuyCoins={(amt) => setCoins(c => c + amt)}
          onAdFinished={onAdFinished}
          onSaveCustomLevel={setCustomLevel}
        />
      </div>
    </div>
  );
};

export default App;
