import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameBoard from '../components/GameBoard';
import GameResultModal from '../components/GameResultModal';
import { levels } from '../data/levels';
import { getLevelData, saveUserProgress } from '../services/api';
import { supabase } from '../supabase/client';
import { Clock, Heart, MoreHorizontal, Zap, Lightbulb, Settings, MessageCircle, Minus, Plus, Coins, Bomb } from 'lucide-react';
import { LevelData } from '../types';
import { canSnakeExit } from '../utils/gameLogic';
import { soundManager } from '../utils/sound';
import { useGameStore } from '../store/gameStore';

const Game: React.FC = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [turtleProgress, setTurtleProgress] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showResultModal, setShowResultModal] = useState(false);
  
  // UI State
  const [scale, setScale] = useState(1);
  const [lives, setLives] = useState(3);
  const [hintSnakeId, setHintSnakeId] = useState<string | null>(null);
  
  // Store
  const { coins, spendCoins, addCoins } = useGameStore();
  const [isBombActive, setIsBombActive] = useState(false);

  // Game timer refs
  const turtleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLevel = async () => {
    if (!levelId) return;
    
    setLoading(true);
    // Try to fetch from API first
    const data = await getLevelData(levelId);
    
    if (data) {
      setLevelData(data);
    } else {
      // Fallback to local data
      const localData = levels[levelId];
      if (localData) {
        setLevelData(localData);
      }
    }
    setLoading(false);
    resetGame();
  };

  const resetGame = () => {
    setTurtleProgress(0);
    setGameStatus('playing');
    setShowResultModal(false);
    setIsPaused(false);
    setScale(1);
    setLives(3);
  };

  useEffect(() => {
    fetchLevel();
  }, [levelId]);

  // Turtle Movement Timer
  useEffect(() => {
    if (isPaused || !levelData || gameStatus !== 'playing') {
        if (turtleTimerRef.current) clearInterval(turtleTimerRef.current);
        return;
    }

    turtleTimerRef.current = setInterval(() => {
      setTurtleProgress(prev => {
        const next = prev + levelData.turtle_speed;
        return Math.min(next, levelData.track_length);
      });
    }, 1000);

    return () => {
        if (turtleTimerRef.current) clearInterval(turtleTimerRef.current);
    };
  }, [isPaused, levelData, gameStatus]);

  // Check for game over condition
  useEffect(() => {
    if (levelData && gameStatus === 'playing') {
        if (turtleProgress >= levelData.track_length || lives <= 0) {
            handleLevelFail();
        }
    }
  }, [turtleProgress, lives, levelData, gameStatus]);

  const handleInvalidMove = () => {
    if (gameStatus !== 'playing') return;
    setLives(prev => Math.max(0, prev - 1));
    if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]); // Error vibration pattern
    }
  };

  const handleLevelComplete = async () => {
    if (gameStatus !== 'playing') return;
    setGameStatus('won');
    setIsPaused(true);
    soundManager.playWin();
    setShowResultModal(true);
    addCoins(50); // Award coins for completing level
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user && levelData) {
      await saveUserProgress({
        level_id: levelData.level_id,
        completion_time: 0, 
        used_hints: 0,
        is_completed: true
      }, user.id);
    }
  };

  const handleLevelFail = () => {
    if (gameStatus !== 'playing') return;
    setGameStatus('lost');
    setIsPaused(true);
    soundManager.playLose();
    setShowResultModal(true);
  };

  const handleToggleBomb = () => {
    if (gameStatus !== 'playing') return;
    
    if (isBombActive) {
      setIsBombActive(false);
      return;
    }

    if (coins >= 50) {
      setIsBombActive(true);
      soundManager.playClick();
    } else {
      soundManager.playBlock();
      if (navigator.vibrate) navigator.vibrate(200);
    }
  };

  const handleBombUsed = (snakeId: string) => {
    if (spendCoins(50)) {
        setIsBombActive(false);
        soundManager.playExplosion();
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50, 50, 100]);
        }
    }
  };

  const handleSnakeExit = () => {
    if (levelData) {
        setTurtleProgress(prev => Math.max(0, prev - levelData.push_back_amount));
        
        // Haptic Feedback
        if (navigator.vibrate) {
            navigator.vibrate(200); // Vibrate for 200ms
        }
    }
  };

  const handleHint = () => {
    if (!levelData || gameStatus !== 'playing') return;

    // Find a snake that can exit
    const validSnake = levelData.snakes.find(snake => 
        canSnakeExit(snake, levelData.snakes, levelData.grid_config)
    );

    if (validSnake) {
        setHintSnakeId(validSnake.id);
        soundManager.playHint();
        
        // Clear hint after 2 seconds
        setTimeout(() => setHintSnakeId(null), 2000);
    } else {
        // No valid moves? (Shouldn't happen in solvable levels)
        soundManager.playBlock();
    }
  };

  const handleAddTime = () => {
    if (gameStatus !== 'playing') return;
    
    setTurtleProgress(prev => Math.max(0, prev - 10)); // Rewind significantly
    soundManager.playPowerUp();
    
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
  };

  const handleRetry = () => {
    resetGame();
    if (levelData) {
        setLevelData({...levelData}); 
    }
  };

  const handleNextLevel = () => {
    if (!levelData) return;
    const nextLevelNum = levelData.level_number + 1;
    const nextLevelId = `level_${nextLevelNum}`;
    
    if (levels[nextLevelId]) {
        navigate(`/game/${nextLevelId}`);
    } else {
        navigate('/');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-green-100 text-green-800 font-bold text-xl">加载中...</div>;
  }

  if (!levelData) {
    return <div className="flex items-center justify-center h-screen bg-green-100 text-red-600 font-bold text-xl">关卡未找到</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-[#66c266] relative overflow-hidden font-sans">
      {/* Background Decorative Elements (CSS only) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-green-800 rounded-full blur-xl"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-yellow-200 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 left-1/4 w-40 h-40 bg-green-700 rounded-full blur-2xl"></div>
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 pt-4 pb-2 z-20 flex flex-col items-center pointer-events-none">
         {/* Title */}
         <div className="text-white text-4xl font-black stroke-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] mb-2" 
              style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
            第{levelData.level_number}关
         </div>
         
         {/* Status Row: Clock, Hearts, Energy */}
         <div className="flex items-center space-x-4">
             {/* Timer */}
             <div className="bg-white rounded-full px-3 py-1 flex items-center shadow-md border-2 border-orange-200">
                <Clock className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-orange-500 font-bold font-mono">
                    {Math.max(0, levelData.track_length - Math.floor(turtleProgress))}
                </span>
             </div>

             {/* Hearts */}
             <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                    <Heart key={i} className={`w-6 h-6 fill-current ${i < lives ? 'text-red-500' : 'text-gray-300'}`} strokeWidth={2} stroke="white" />
                ))}
             </div>

             {/* Energy */}
             <div className="flex flex-col items-center">
                <div className="flex items-center">
                    <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400 stroke-black stroke-1 drop-shadow-sm" />
                    <span className="text-white font-black text-xl stroke-black drop-shadow-sm" style={{ textShadow: '1px 1px 0 #000' }}>4</span>
                </div>
             </div>

             {/* Coins */}
             <div className="flex items-center ml-2 bg-black/30 rounded-full px-2 py-1">
                <Coins className="w-4 h-4 text-yellow-300 mr-1" />
                <span className="text-white font-bold text-sm">{coins}</span>
             </div>
         </div>
      </div>

      {/* Top Corners */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto">
         <button className="bg-orange-400 p-2 rounded-full border-2 border-white shadow-md hover:scale-105 transition-transform" onClick={() => setIsPaused(!isPaused)}>
            <Settings className="w-6 h-6 text-white" />
         </button>
      </div>
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
         <button className="bg-white/50 p-2 rounded-full border-2 border-white shadow-md">
            <MessageCircle className="w-6 h-6 text-gray-700" />
         </button>
      </div>

      {/* Game Board */}
      <div className="flex-1 relative z-10 mt-24 mb-24">
        <GameBoard 
            levelData={levelData} 
            onLevelComplete={handleLevelComplete}
            onLevelFail={handleLevelFail}
            onSnakeExit={handleSnakeExit}
            turtleProgress={turtleProgress}
            scale={scale}
            onScaleChange={setScale}
            hintSnakeId={hintSnakeId}
            onInvalidMove={handleInvalidMove}
            isBombActive={isBombActive}
            onUseBomb={handleBombUsed}
        />
        
        {/* Overlay Instruction (Only show initially?) */}
        {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#fff8e7] border-2 border-orange-400 rounded-full px-6 py-2 shadow-lg pointer-events-none opacity-80">
            <span className="text-brown-800 font-bold text-lg">手指外拨缩放</span>
        </div> */}
      </div>
      
      {/* Bottom Controls Bar */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex items-end justify-between pointer-events-auto">
         {/* Left: Hint */}
         <button 
            className="bg-yellow-400 rounded-xl p-2 shadow-[0_4px_0_rgb(217,119,6)] border-2 border-white flex flex-col items-center w-16 hover:translate-y-1 hover:shadow-none transition-all active:scale-95"
            onClick={handleHint}
         >
            <div className="bg-white/30 rounded-full p-1 mb-1">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <span className="text-amber-900 font-black text-xs">提示</span>
         </button>

         {/* Center: Zoom Slider */}
         <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full mb-2">
            <Minus className="w-5 h-5 text-white cursor-pointer" onClick={() => setScale(s => Math.max(0.5, s - 0.1))} />
            <input 
                type="range" 
                min="0.5" 
                max="2.5" 
                step="0.1" 
                value={scale} 
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-32 h-2 bg-green-600 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />
            <Plus className="w-5 h-5 text-white cursor-pointer" onClick={() => setScale(s => Math.min(2.5, s + 0.1))} />
         </div>

         {/* Right: Add Time */}
         <button 
            className="bg-yellow-400 rounded-xl p-2 shadow-[0_4px_0_rgb(217,119,6)] border-2 border-white flex flex-col items-center w-16 hover:translate-y-1 hover:shadow-none transition-all active:scale-95"
            onClick={handleAddTime}
         >
            <div className="bg-white/30 rounded-full p-1 mb-1">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-amber-900 font-black text-xs">加时</span>
         </button>

         {/* Bomb */}
         <button 
            className={`bg-red-500 rounded-xl p-2 shadow-[0_4px_0_rgb(185,28,28)] border-2 border-white flex flex-col items-center w-16 hover:translate-y-1 hover:shadow-none transition-all active:scale-95 ${isBombActive ? 'ring-4 ring-yellow-400 scale-105' : ''}`}
            onClick={handleToggleBomb}
         >
            <div className="bg-white/30 rounded-full p-1 mb-1">
              <Bomb className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col items-center -mt-1">
                <span className="text-white font-black text-xs">炸弹</span>
                <span className="text-white/80 text-[10px] font-bold">50币</span>
            </div>
         </button>
      </div>

      {/* Result Modal */}
      <GameResultModal 
        isOpen={showResultModal}
        type={gameStatus === 'won' ? 'won' : 'lost'}
        onRetry={handleRetry}
        onNext={handleNextLevel}
        onHome={() => navigate('/')}
        coinsEarned={50}
      />
    </div>
  );
};

export default Game;