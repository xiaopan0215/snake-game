import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Lock, Coins } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const Skins: React.FC = () => {
  const navigate = useNavigate();
  const { coins, skins, selectedSkinId, unlockSkin, selectSkin, spendCoins } = useGameStore();

  const handlePurchase = (skinId: string, price: number) => {
    if (spendCoins(price)) {
        unlockSkin(skinId);
        selectSkin(skinId);
    } else {
        alert('金币不足！');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#00BFFF] relative overflow-hidden concentric-circles">
      <div className="flex items-center justify-between p-4 z-10">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-4 bg-white/20 p-2 rounded-full">
            <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-2xl font-black text-white stroke-black drop-shadow-md">皮肤商店</h1>
        </div>
        <div className="flex items-center bg-black/30 rounded-full px-3 py-1">
            <Coins className="w-5 h-5 text-yellow-400 mr-1" />
            <span className="text-white font-bold">{coins}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 z-10 pb-24">
        <div className="grid grid-cols-2 gap-4">
            {skins.map(skin => {
                const isSelected = selectedSkinId === skin.id;
                
                return (
                    <div 
                        key={skin.id} 
                        className={`
                            relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center 
                            transition-all transform hover:scale-105
                            ${isSelected ? 'border-4 border-yellow-400 shadow-xl' : 'border-2 border-white/50'}
                        `}
                        onClick={() => skin.unlocked && selectSkin(skin.id)}
                    >
                        {/* Preview */}
                        <div className="w-20 h-20 rounded-full mb-3 flex items-center justify-center shadow-inner" style={{ backgroundColor: skin.color }}>
                            {/* Snake Head Preview with Eyes */}
                            <div className="w-12 h-12 rounded-lg relative shadow-lg" style={{ backgroundColor: skin.headColor }}>
                                <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white flex items-center justify-center">
                                    <div className="w-1 h-1 bg-black rounded-full"></div>
                                </div>
                                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-white flex items-center justify-center">
                                    <div className="w-1 h-1 bg-black rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        <span className="font-bold text-gray-800 mb-2">{skin.name}</span>

                        {skin.unlocked ? (
                            isSelected ? (
                                <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-xs font-black flex items-center">
                                    <Check className="w-3 h-3 mr-1" /> 已装备
                                </div>
                            ) : (
                                <div className="bg-gray-200 text-gray-500 px-4 py-1 rounded-full text-xs font-bold">
                                    点击装备
                                </div>
                            )
                        ) : (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePurchase(skin.id, skin.price);
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center shadow-md active:translate-y-1 transition-all"
                            >
                                {skin.price} <Coins className="w-3 h-3 ml-1" />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default Skins;