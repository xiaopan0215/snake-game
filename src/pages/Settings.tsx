import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Music } from 'lucide-react';
import { soundManager } from '../utils/sound';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(soundManager.muted);

  const toggleSound = () => {
    const newMuted = soundManager.toggleMute();
    setIsMuted(newMuted);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-4 bg-slate-800 shadow-md">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-slate-700">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">设置</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        
        {/* Sound Settings */}
        <div className="bg-slate-800 rounded-xl p-4 space-y-4">
            <h2 className="text-slate-400 text-sm font-bold uppercase">声音</h2>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </div>
                    <span className="font-medium">音效 & 音乐</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={!isMuted} onChange={toggleSound} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
        </div>

        {/* Account Info (Mock) */}
        <div className="bg-slate-800 rounded-xl p-4 space-y-4">
            <h2 className="text-slate-400 text-sm font-bold uppercase">账号</h2>
            <div className="flex items-center justify-between">
                <span className="text-gray-300">用户 ID</span>
                <span className="font-mono text-gray-500">USER_12345</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-gray-300">版本</span>
                <span className="font-mono text-gray-500">1.0.0</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;