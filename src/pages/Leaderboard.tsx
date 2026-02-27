import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown } from 'lucide-react';

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const leaders = [
    { rank: 1, name: 'TopPlayer', score: 9999 },
    { rank: 2, name: 'SnakeMaster', score: 8888 },
    { rank: 3, name: 'BlueBird', score: 7777 },
    { rank: 4, name: 'You', score: 1234 },
  ];

  return (
    <div className="flex flex-col h-screen bg-blue-500 text-white p-4">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">排行榜</h1>
      </div>

      <div className="bg-white/10 rounded-xl p-4 space-y-4">
        {leaders.map((leader, index) => (
          <div key={index} className={`flex justify-between items-center p-3 rounded-lg ${leader.name === 'You' ? 'bg-yellow-400/20 border border-yellow-400' : 'bg-white/5'}`}>
             <div className="flex items-center">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${
                 leader.rank === 1 ? 'bg-yellow-400 text-black' : 
                 leader.rank === 2 ? 'bg-gray-300 text-black' : 
                 leader.rank === 3 ? 'bg-orange-400 text-black' : 'bg-blue-400'
               }`}>
                 {leader.rank <= 3 ? <Crown className="w-4 h-4" /> : leader.rank}
               </div>
               <span className="font-bold">{leader.name}</span>
             </div>
             <span className="font-mono">{leader.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;