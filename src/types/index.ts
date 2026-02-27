export interface User {
  id: string;
  email: string | null;
  nickname: string;
  energy: number;
  coins: number;
  is_subscribed: boolean;
  created_at: string;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Snake {
  id: string;
  head: Coordinate; // Head position
  length: number;   // Length of the snake (min 2)
  direction: Direction; // Direction the head is facing
  segments: Coordinate[]; // All body segments, segments[0] is head
  color: string;
  isExiting?: boolean; // Visual state for animation
}

export interface LevelData {
  level_id: string;
  level_number: number;
  difficulty: 'easy' | 'medium' | 'hard';
  grid_config: {
    width: number;
    height: number;
  };
  snakes: Snake[];
  track_length: number; // Total steps for turtle
  turtle_speed: number; // Steps per second (or similar metric)
  push_back_amount: number; // Steps to push back turtle on successful snake exit
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface UserProgress {
  level_id: string;
  completion_time: number;
  used_hints: number;
  is_completed: boolean;
}
