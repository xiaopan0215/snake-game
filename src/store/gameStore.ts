import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Skin {
  id: string;
  name: string;
  color: string; // Tailwind class or Hex
  headColor: string;
  eyeColor: string;
  price: number;
  unlocked: boolean;
}

interface GameState {
  coins: number;
  energy: number;
  selectedSkinId: string;
  skins: Skin[];
  
  // Actions
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  unlockSkin: (skinId: string) => void;
  selectSkin: (skinId: string) => void;
}

const DEFAULT_SKINS: Skin[] = [
  { id: 'default', name: '经典绿', color: '#2ECC71', headColor: '#27AE60', eyeColor: 'white', price: 0, unlocked: true },
  { id: 'blue', name: '海洋蓝', color: '#3498DB', headColor: '#2980B9', eyeColor: 'yellow', price: 100, unlocked: false },
  { id: 'red', name: '火焰红', color: '#E74C3C', headColor: '#C0392B', eyeColor: 'black', price: 200, unlocked: false },
  { id: 'purple', name: '神秘紫', color: '#9B59B6', headColor: '#8E44AD', eyeColor: '#00FF00', price: 300, unlocked: false },
  { id: 'gold', name: '土豪金', color: '#F1C40F', headColor: '#F39C12', eyeColor: 'red', price: 1000, unlocked: false },
];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      coins: 100, // Initial coins
      energy: 5,
      selectedSkinId: 'default',
      skins: DEFAULT_SKINS,

      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      
      spendCoins: (amount) => {
        const { coins } = get();
        if (coins >= amount) {
          set({ coins: coins - amount });
          return true;
        }
        return false;
      },

      unlockSkin: (skinId) => set((state) => ({
        skins: state.skins.map(s => s.id === skinId ? { ...s, unlocked: true } : s)
      })),

      selectSkin: (skinId) => set({ selectedSkinId: skinId }),
    }),
    {
      name: 'snake-game-storage',
    }
  )
);