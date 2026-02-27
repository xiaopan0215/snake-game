import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Zap, Coins, Store, Crown, BarChart2, Gift, Calendar, Rocket, Play, Lock, Check } from 'lucide-react';
import { levels } from '../data/levels';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [energy, setEnergy] = useState(() => parseInt(localStorage.getItem('energy') || '5'));
  const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('coins') || '100'));
  const [completedLevels, setCompletedLevels] = useState<string[]>(() => JSON.parse(localStorage.getItem('completedLevels') || '[]'));
  
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  useEffect(() => {
    localStorage.setItem('energy', energy.toString());
    localStorage.setItem('coins', coins.toString());
  }, [energy, coins]);

  const handleStartLevel = (levelId: string) => {
    // Check energy
    if (energy <= 0) {
        alert("精力不足！");
        return;
    }
    // setEnergy(e => Math.max(0, e - 1)); // Deduct energy? Maybe later.
    navigate(`/game/${levelId}`);
  };

  const levelList = Object.values(levels).sort((a, b) => a.level_number - b.level_number);

  return (
    <div className="flex flex-col h-screen bg-[#00BFFF] relative overflow-hidden concentric-circles">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 z-10">
        <div className="flex space-x-2">
          {/* Version */}
          <span className="text-white text-xs font-bold absolute top-2 left-2">0.1.0</span>
          
          {/* Energy */}
          <div className="flex items-center bg-teal-800/50 rounded-full px-2 py-1 mt-4 border border-teal-400/30">
            <Zap className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" />
            <span className="text-white font-bold text-sm">{energy}</span>
            <button className="bg-orange-400 rounded-full p-0.5 ml-1 hover:scale-110 transition-transform" onClick={() => setEnergy(e => e + 1)}>
              <span className="text-white text-xs">+</span>
            </button>
          </div>

          {/* Coins */}
          <div className="flex items-center bg-teal-800/50 rounded-full px-2 py-1 mt-4 border border-teal-400/30">
            <Coins className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" />
            <span className="text-white font-bold text-sm">{coins}</span>
            <button className="bg-green-500 rounded-full p-0.5 ml-1 hover:scale-110 transition-transform" onClick={() => setCoins(c => c + 50)}>
              <span className="text-white text-xs">+</span>
            </button>
          </div>
        </div>

        <div className="flex space-x-2 mt-4">
          <button className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors" onClick={() => navigate('/settings')}>
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Side Buttons */}
      <div className="absolute right-2 top-20 flex flex-col space-y-3 z-10">
        <button className="bg-teal-500 p-2 rounded-full flex flex-col items-center w-12 h-12 justify-center shadow-lg border-2 border-white/20 active:scale-95 transition-transform">
          <Rocket className="w-5 h-5 text-yellow-300" />
          <span className="text-[10px] text-white leading-none mt-1">桌面</span>
        </button>
        <button className="bg-teal-500 p-2 rounded-full flex flex-col items-center w-12 h-12 justify-center shadow-lg border-2 border-white/20 active:scale-95 transition-transform">
          <Gift className="w-5 h-5 text-yellow-300" />
          <span className="text-[10px] text-white leading-none mt-1">入口</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-0 pb-32">
        {/* Title */}
        <div className="relative mb-8 transform hover:scale-105 transition-transform duration-500">
          <div className="bg-blue-600 border-4 border-orange-400 rounded-xl px-8 py-2 transform -rotate-2 shadow-xl">
             <h1 className="text-4xl font-black text-white stroke-black" style={{ textShadow: '2px 2px 0 #000' }}>
               <span className="text-yellow-300">快来</span>整个活
             </h1>
          </div>
          {/* Character placeholder */}
          <div className="mt-8 relative w-48 h-48 bg-blue-500 rounded-full flex items-center justify-center animate-bounce-slow shadow-2xl">
             <div className="w-32 h-20 bg-blue-700 rounded-full relative overflow-hidden">
               <div className="absolute -top-4 left-8 w-8 h-8 bg-black rounded-full border-2 border-yellow-400"></div>
               <div className="absolute -top-4 right-8 w-8 h-8 bg-black rounded-full border-2 border-yellow-400"></div>
               {/* Mouth */}
               <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-red-500 rounded-b-full border-2 border-black"></div>
             </div>
          </div>
        </div>
        
        {/* Play Button */}
        <button 
            onClick={() => setShowLevelSelect(true)}
            className="group bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 px-12 rounded-2xl shadow-[0_6px_0_rgb(200,150,0)] active:shadow-none active:translate-y-1 transition-all transform hover:scale-105 flex items-center space-x-2"
        >
            <Play className="w-8 h-8 fill-white stroke-2" />
            <div className="flex flex-col items-start">
                <div className="text-2xl drop-shadow-md leading-none">开始游戏</div>
                <div className="text-xs opacity-90 mt-1">当前: 第 {completedLevels.length + 1} 关</div>
            </div>
        </button>
        
        {/* Bottom Feature Buttons */}
        <div className="absolute bottom-24 w-full px-8 flex justify-between items-center pointer-events-none">
          <button className="flex flex-col items-center pointer-events-auto transform hover:scale-110 transition-transform">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
              <span className="text-2xl">👺</span>
            </div>
            <span className="text-white text-xs mt-1 font-bold shadow-black drop-shadow-md">新年闯关</span>
          </button>

          <div className="flex flex-col space-y-3 pointer-events-auto">
             <button className="flex flex-col items-center transform hover:scale-110 transition-transform">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                <Gift className="w-5 h-5 text-orange-300" />
              </div>
              <span className="text-white text-[10px] mt-1 font-bold drop-shadow-md">订阅有奖</span>
            </button>
            <button className="flex flex-col items-center transform hover:scale-110 transition-transform">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-[10px] mt-1 font-bold drop-shadow-md">七日签到</span>
            </button>
          </div>
        </div>
      </div>

      {/* Level Select Modal/Overlay */}
      {showLevelSelect && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-end animate-in fade-in duration-200">
            <div className="w-full h-[80vh] bg-[#00BFFF] rounded-t-3xl p-6 flex flex-col relative animate-in slide-in-from-bottom duration-300">
                <button 
                    onClick={() => setShowLevelSelect(false)}
                    className="absolute top-4 right-4 bg-white/20 p-2 rounded-full text-white"
                >
                    ✕
                </button>
                <h2 className="text-2xl font-black text-white text-center mb-6 drop-shadow-md">选择关卡</h2>
                
                <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-4 p-2 content-start">
                    {levelList.map((level) => {
                        const isLocked = level.level_number > completedLevels.length + 1;
                        const isCompleted = completedLevels.includes(level.level_id);
                        
                        return (
                            <button 
                                key={level.level_id}
                                disabled={isLocked}
                                onClick={() => handleStartLevel(level.level_id)}
                                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative shadow-md transition-all
                                    ${isLocked ? 'bg-slate-700/50 cursor-not-allowed' : 'bg-white hover:scale-105 active:scale-95'}
                                    ${isCompleted ? 'border-4 border-green-400' : ''}
                                `}
                            >
                                {isLocked ? (
                                    <Lock className="w-6 h-6 text-slate-400" />
                                ) : (
                                    <>
                                        <span className={`text-2xl font-black ${isCompleted ? 'text-green-500' : 'text-slate-800'}`}>
                                            {level.level_number}
                                        </span>
                                        {isCompleted && (
                                            <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-0.5 border-2 border-white">
                                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bg-[#009ACD] p-2 flex justify-around items-end pb-4 pt-4 rounded-t-3xl shadow-lg z-20">
        <button className="flex flex-col items-center space-y-1 opacity-70 hover:opacity-100 transition-opacity" onClick={() => navigate('/skins')}>
          <div className="bg-blue-500 p-2 rounded-xl">
            <Store className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-bold">皮肤</span>
        </button>
        
        <button className="flex flex-col items-center space-y-1 -mt-6 transform scale-110" onClick={() => setShowLevelSelect(false)}>
          <div className="bg-blue-400 p-3 rounded-xl border-4 border-[#00BFFF] shadow-lg">
            <Crown className="w-8 h-8 text-yellow-300" fill="currentColor" />
          </div>
          <span className="text-white text-xs font-bold">主页</span>
        </button>
        
        <button className="flex flex-col items-center space-y-1 opacity-70 hover:opacity-100 transition-opacity" onClick={() => navigate('/leaderboard')}>
          <div className="bg-blue-500 p-2 rounded-xl">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-bold">排行</span>
        </button>
      </div>
    </div>
  );
};

export default Home;