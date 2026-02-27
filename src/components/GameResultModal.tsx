import React from 'react';
import { RefreshCw, Home, ArrowRight } from 'lucide-react';

interface GameResultModalProps {
  isOpen: boolean;
  type: 'won' | 'lost';
  onRetry: () => void;
  onNext?: () => void;
  onHome: () => void;
  coinsEarned?: number;
}

const GameResultModal: React.FC<GameResultModalProps> = ({
  isOpen,
  type,
  onRetry,
  onNext,
  onHome,
  coinsEarned = 0,
}) => {
  if (!isOpen) return null;

  const isWin = type === 'won';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl transform transition-all scale-100 border-4 border-yellow-400">
        
        {/* Header Icon/Image */}
        <div className="flex justify-center -mt-16 mb-4">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${isWin ? 'bg-yellow-400' : 'bg-gray-400'}`}>
            <span className="text-5xl drop-shadow-md">
              {isWin ? '🏆' : '🐢'}
            </span>
          </div>
        </div>

        {/* Title */}
        <h2 className={`text-3xl font-black text-center mb-2 stroke-black drop-shadow-sm ${isWin ? 'text-yellow-500' : 'text-gray-600'}`} style={{ textShadow: '1px 1px 0 #000' }}>
          {isWin ? '胜利!' : '游戏结束'}
        </h2>

        {/* Message */}
        <div className="text-center text-gray-600 mb-8 font-medium">
          <p>{isWin ? '干得好！所有的蛇都清理干净了！' : '小乌龟掉进洞里了！再试一次吧。'}</p>
          {isWin && coinsEarned > 0 && (
            <div className="mt-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full inline-block font-bold">
              💰 +{coinsEarned} 金币
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          {isWin && onNext && (
            <button 
              onClick={onNext}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-[0_2px_0_rgb(21,128,61)] active:translate-y-[2px] transition-all flex items-center justify-center"
            >
              <span className="mr-2">下一关</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <button 
            onClick={onRetry}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_0_rgb(29,78,216)] active:shadow-[0_2px_0_rgb(29,78,216)] active:translate-y-[2px] transition-all flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            重试
          </button>

          <button 
            onClick={onHome}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl shadow-[0_4px_0_rgb(156,163,175)] active:shadow-[0_2px_0_rgb(156,163,175)] active:translate-y-[2px] transition-all flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            返回主页
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResultModal;
