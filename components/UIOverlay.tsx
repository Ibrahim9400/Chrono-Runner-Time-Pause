
import React, { useState, useEffect } from 'react';
import { GameState, MAX_ENERGY, SKINS, GameMode, ObstacleType, BoosterType, BOOSTER_PRICES, MISSIONS } from '../constants';
import { 
  Play, RefreshCw, Zap, Trophy, ShoppingBag, Map, Edit, Check, X, 
  Coins, Shield, Magnet, BatteryLow, CreditCard, ExternalLink, LayoutGrid, Timer, Info, AlertTriangle, Route, Pause, Home, Lock
} from 'lucide-react';
import { Inventory } from '../types';

interface UIOverlayProps {
  gameState: GameState;
  gameMode: GameMode;
  levelIndex: number;
  score: number;
  highScore: number;
  coins: number;
  energy: number;
  selectedSkin: string;
  unlockedSkins: string[];
  unlockedLevels: number[];
  inventory: Inventory;
  setGameState: (state: GameState) => void;
  setGameMode: (mode: GameMode) => void;
  setLevelIndex: (idx: number) => void;
  onStart: () => void;
  onRestart: () => void;
  isTimeFrozen: boolean;
  onToggleFreeze: () => void;
  onJump: () => void;
  onBuySkin: (skinId: string, price: number) => void;
  onSelectSkin: (skinId: string) => void;
  onBuyBooster: (type: BoosterType) => void;
  onUseBooster: (type: BoosterType) => void;
  onBuyCoins: (amount: number) => void;
  onAdFinished: () => void;
  onSaveCustomLevel: (level: any[]) => void;
}

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-black/80 backdrop-blur-[40px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-[2.5rem] p-8 ${className}`}>
    {children}
  </div>
);

const UIOverlay: React.FC<UIOverlayProps> = ({
  gameState, gameMode, levelIndex, score, highScore, coins, energy, selectedSkin, unlockedSkins, unlockedLevels, inventory,
  setGameState, setGameMode, setLevelIndex, onStart, onRestart, isTimeFrozen,
  onToggleFreeze, onJump, onBuySkin, onSelectSkin, onBuyBooster, onUseBooster, onBuyCoins, onAdFinished, onSaveCustomLevel
}) => {
  const [shopTab, setShopTab] = useState<'skins' | 'boosters'>('skins');
  const [adCountdown, setAdCountdown] = useState(3);

  useEffect(() => {
    let timer: any;
    if (gameState === GameState.AD_WATCHING) {
      setAdCountdown(3);
      timer = setInterval(() => {
        setAdCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onAdFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, onAdFinished]);

  if (gameState === GameState.PLAYING) {
    return (
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-10">
        <div className="absolute inset-0 flex pointer-events-auto overflow-hidden">
          <div className="w-1/2 h-full cursor-pointer transition-colors active:bg-sky-500/5" onPointerDown={(e) => { e.preventDefault(); onToggleFreeze(); }} />
          <div className="w-1/2 h-full cursor-pointer transition-colors active:bg-white/5" onPointerDown={(e) => { e.preventDefault(); onJump(); }} />
        </div>

        <div className="flex justify-between items-start z-50">
          <div className="flex flex-col gap-2">
            <div className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 shadow-lg ring-1 ring-white/5">
              <Trophy className="w-4 h-4 text-sky-400" />
              <span className="text-white font-black text-lg">{Math.floor(score)}</span>
            </div>
            <div className="bg-black/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 shadow-lg ring-1 ring-white/5">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-white font-black text-lg">{coins}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
             <button 
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setGameState(GameState.PAUSED); }} 
                className="bg-black/80 backdrop-blur-xl p-3 rounded-xl border border-white/10 pointer-events-auto hover:bg-white/10 transition-colors mb-2"
             >
               <Pause className="w-5 h-5 text-white" />
             </button>
             <div className="w-48 h-2 bg-white/5 rounded-full border border-white/10 overflow-hidden shadow-inner ring-1 ring-white/5">
               <div className={`h-full transition-all duration-300 ${isTimeFrozen ? 'bg-sky-400 animate-pulse' : 'bg-sky-600'}`} style={{ width: `${(energy/MAX_ENERGY)*100}%` }} />
             </div>
             <div className="text-[8px] font-black text-white/50 tracking-[0.4em] uppercase">Temporal Sync</div>
          </div>
        </div>
        
        <div className="flex justify-center mb-2 z-50">
           <div className="bg-black/80 backdrop-blur-2xl px-5 py-1.5 rounded-full border border-white/10 flex items-center gap-5 shadow-2xl ring-1 ring-white/5">
              <div className="flex items-center gap-2">
                <Route className="w-3 h-3 text-sky-400" />
                <span className="text-white font-black text-sm font-mono">{Math.floor(score)}m</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-2">
                <Trophy className="w-3 h-3 text-amber-500" />
                <span className="text-white/60 font-black text-sm font-mono">{Math.floor(highScore)}m</span>
              </div>
           </div>
        </div>

        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto z-[100]">
          {[
            { type: BoosterType.SHIELD, icon: Shield, count: inventory.shield, color: 'text-sky-400' },
            { type: BoosterType.MAGNET, icon: Magnet, count: inventory.magnet, color: 'text-fuchsia-400' },
            { type: BoosterType.energy, icon: Zap, count: inventory.energy, color: 'text-amber-400' }
          ].map((b, i) => (
            <button 
              key={i}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); if (b.count > 0) onUseBooster(b.type); }}
              className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center transition-all group active:scale-90 ${b.count > 0 ? 'bg-black/95 border-white/20 hover:border-sky-500/50' : 'bg-black/40 border-white/5 opacity-30'}`}
            >
              <b.icon className={`w-4 h-4 ${b.color}`} />
              <span className="text-[8px] font-black text-white mt-0.5">{b.count}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === GameState.AD_WATCHING) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-[500] backdrop-blur-xl">
        <div className="text-center">
          <div className="w-24 h-24 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
          <h2 className="text-3xl font-black italic tracking-tighter text-white mb-2 uppercase">Syncing Chrono-Link...</h2>
          <p className="text-sky-400 font-bold tracking-widest text-sm uppercase">Reviving in {adCountdown}s</p>
        </div>
      </div>
    );
  }

  if (gameState === GameState.LEVEL_COMPLETED) {
    const currentMission = MISSIONS.find(m => m.id === levelIndex);
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-[300]">
        <GlassCard className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-sky-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(14,165,233,0.5)]">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2 uppercase">MISSION COMPLETED</h2>
          <p className="text-white/60 font-bold mb-8 uppercase tracking-[0.2em]">{currentMission?.name}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="text-[10px] text-sky-400 font-black tracking-widest uppercase mb-1">Earned</div>
              <div className="flex items-center justify-center gap-2">
                 <Coins className="w-4 h-4 text-amber-500" />
                 <span className="text-2xl font-black text-white">+{Math.floor(score / 5)}</span>
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="text-[10px] text-sky-400 font-black tracking-widest uppercase mb-1">Target</div>
              <div className="text-2xl font-black text-white">{currentMission?.target}m</div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button onClick={() => setGameState(GameState.LEVEL_SELECTOR)} className="p-4 bg-sky-500 text-white rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all">
              CONTINUE MISSIONS
            </button>
            <button onClick={() => setGameState(GameState.MENU)} className="p-4 bg-white/10 border border-white/10 text-white rounded-2xl font-black text-lg hover:bg-white/20 active:scale-95 transition-all">
              RETURN TO MENU
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (gameState === GameState.PAUSED) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-[200]">
        <GlassCard className="w-full max-w-sm text-center">
          <h2 className="text-5xl font-black text-white italic tracking-tighter mb-8">PAUSED</h2>
          <div className="flex flex-col gap-4">
            <button onClick={() => setGameState(GameState.PLAYING)} className="p-5 bg-sky-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all">
              <Play className="w-6 h-6 fill-white" /> RESUME SYNC
            </button>
            <button onClick={() => setGameState(GameState.MENU)} className="p-5 bg-white/10 border border-white/10 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-4 hover:bg-white/20 active:scale-95 transition-all">
              <Home className="w-6 h-6" /> EXIT TO MENU
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020617] p-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.15),transparent_60%)] animate-pulse" />
        <div className="relative z-10 text-center mb-12">
          <div className="text-sky-500 font-black text-[10px] tracking-[1em] mb-4 opacity-60 uppercase">Chrono-Link Stable</div>
          <h1 className="text-8xl md:text-9xl font-black text-white tracking-tighter mb-4 italic leading-none drop-shadow-2xl">
            CHRONO<br/><span className="text-sky-500">RUNNER</span>
          </h1>
        </div>
        
        <div className="grid grid-cols-2 gap-6 w-full max-w-2xl z-20">
          <button onClick={() => { setGameMode(GameMode.ENDLESS); onStart(); }} className="col-span-2 group relative overflow-hidden h-24 bg-white rounded-3xl hover:bg-sky-50 transition-all flex items-center justify-center gap-6 shadow-2xl active:scale-95">
            <Play className="w-10 h-10 text-black fill-black" />
            <span className="text-4xl font-black text-black italic tracking-tighter uppercase">ENDLESS RUN</span>
          </button>
          <button onClick={() => setGameState(GameState.LEVEL_SELECTOR)} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 flex items-center justify-center gap-4 transition-all group active:scale-95">
            <Map className="w-6 h-6 text-sky-400" />
            <span className="font-black text-white tracking-widest text-sm uppercase">MISSIONS</span>
          </button>
          <button onClick={() => setGameState(GameState.SHOP)} className="h-20 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 flex items-center justify-center gap-4 transition-all group active:scale-95">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            <span className="font-black text-white tracking-widest text-sm uppercase">ARSENAL</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.LEVEL_SELECTOR) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-8">
        <GlassCard className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">Sector Missions</h2>
            <button onClick={() => setGameState(GameState.MENU)} className="p-3 rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {MISSIONS.map(m => {
              const isUnlocked = unlockedLevels.includes(m.id);
              return (
                <button 
                  key={m.id}
                  disabled={!isUnlocked}
                  onClick={() => { setGameMode(GameMode.LEVELS); setLevelIndex(m.id); onStart(); }}
                  className={`p-6 border rounded-3xl text-left transition-all group relative ${isUnlocked ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-sky-500/50' : 'bg-black/40 border-white/5 opacity-50 grayscale'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-sky-400 tracking-widest uppercase">{m.difficulty}</span>
                    {isUnlocked ? <Trophy className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" /> : <Lock className="w-4 h-4 text-white/20" />}
                  </div>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter mb-1">{m.name}</h3>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Target: {m.target}m</p>
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="bg-black/60 px-4 py-1 rounded-full text-[8px] font-black tracking-widest text-white/40 border border-white/10">LOCKED</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </GlassCard>
      </div>
    );
  }

  if (gameState === GameState.SHOP) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-8">
        <GlassCard className="w-full max-w-4xl h-[500px] flex flex-col p-0 border-white/5 ring-1 ring-white/10 overflow-hidden">
          <div className="flex h-full">
            <div className="w-20 bg-white/5 border-r border-white/10 flex flex-col items-center py-8 gap-8">
              {[
                { tab: 'skins', icon: LayoutGrid, color: 'text-sky-400' },
                { tab: 'boosters', icon: Shield, color: 'text-amber-400' }
              ].map(t => (
                <button 
                  key={t.tab}
                  onClick={() => setShopTab(t.tab as any)} 
                  className={`p-4 rounded-xl transition-all active:scale-90 ${shopTab === t.tab ? 'bg-white/10 text-white shadow-xl' : 'text-white/20 hover:text-white'}`}
                >
                  <t.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                 <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">{shopTab} Catalog</h2>
                 <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-xl border border-white/10">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="font-black text-lg text-white">{coins}</span>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {shopTab === 'skins' && (
                  <div className="grid grid-cols-2 gap-6">
                    {SKINS.map(s => (
                      <div key={s.id} className={`p-5 rounded-[2rem] border-2 transition-all group ${selectedSkin === s.id ? 'border-sky-500 bg-sky-500/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                        <div className="w-10 h-10 rounded-lg mb-3 shadow-2xl" style={{ backgroundColor: s.color, boxShadow: `0 0 30px ${s.color}44` }} />
                        <div className="text-base font-black text-white mb-2 tracking-tighter">{s.name}</div>
                        {unlockedSkins.includes(s.id) ? (
                          <button onClick={() => onSelectSkin(s.id)} className={`w-full py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${selectedSkin === s.id ? 'bg-sky-500 text-white' : 'bg-white/10 text-white/40 hover:bg-white/20'}`}>
                            {selectedSkin === s.id ? 'EQUIPPED' : 'USE'}
                          </button>
                        ) : (
                          <button onClick={() => onBuySkin(s.id, s.price)} disabled={coins < s.price} className="w-full py-2.5 bg-amber-600 rounded-xl text-[9px] font-black flex items-center justify-center gap-2 text-white disabled:opacity-20">
                            <Coins className="w-4 h-4" /> {s.price}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {shopTab === 'boosters' && (
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { type: BoosterType.SHIELD, name: 'AEGIS', icon: Shield, color: 'text-sky-400' },
                      { type: BoosterType.MAGNET, name: 'FLUX', icon: Magnet, color: 'text-fuchsia-400' },
                      { type: BoosterType.energy, name: 'SYNC', icon: Zap, color: 'text-amber-400' }
                    ].map(b => (
                      <div key={b.type} className="p-6 rounded-[2rem] border border-white/5 bg-white/5 flex flex-col items-center transition-all">
                        <b.icon className={`w-8 h-8 mb-3 ${b.color}`} />
                        <div className="text-sm font-black text-white mb-4 tracking-tighter">{b.name}</div>
                        <button onClick={() => onBuyBooster(b.type)} disabled={coins < BOOSTER_PRICES[b.type]} className="w-full py-2.5 bg-white/10 rounded-xl text-[9px] font-black flex items-center justify-center gap-2">
                           <Coins className="w-4 h-4" /> {BOOSTER_PRICES[b.type]}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setGameState(GameState.MENU)} className="m-6 p-3 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-xl hover:bg-sky-400 transition-colors">Return</button>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl text-white">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-6 animate-pulse" />
        <h2 className="text-7xl font-black italic tracking-tighter mb-2 leading-none text-center">CORE FAILURE</h2>
        
        <div className="flex gap-12 mb-10">
           <div className="text-center">
              <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] mb-1">Meters</div>
              <div className="text-4xl font-black tracking-tighter">{Math.floor(score)}</div>
           </div>
           <div className="text-center">
              <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] mb-1">Best</div>
              <div className="text-4xl font-black text-white/30 tracking-tighter">{Math.floor(highScore)}</div>
           </div>
        </div>
        
        <div className="flex flex-col gap-3 w-full max-w-xs px-6">
          <button 
            onClick={() => setGameState(GameState.AD_WATCHING)} 
            className="p-5 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl font-black flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:scale-105 active:scale-95 transition-all group"
          >
            <Zap className="w-5 h-5 text-amber-400 group-hover:animate-bounce" /> 
            RESURRECT (WATCH AD)
          </button>
          <button onClick={onRestart} className="p-5 bg-white text-black rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gray-100 active:scale-95 transition-all">
            <RefreshCw className="w-5 h-5" /> REBOOT SYSTEM
          </button>
          <button onClick={() => setGameState(GameState.MENU)} className="text-white/30 font-black hover:text-white transition-colors text-[10px] uppercase tracking-[0.4em] mt-4 text-center active:scale-95">Main Menu</button>
        </div>
      </div>
    );
  }

  return null;
};

export default UIOverlay;
