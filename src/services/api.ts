import { supabase } from '../supabase/client';
import { LevelData, UserProgress } from '../types';

export const getLevelData = async (levelId: string): Promise<LevelData | null> => {
  const { data, error } = await supabase
    .from('level_data')
    .select('*')
    .eq('level_id', levelId)
    .single();

  if (error) {
    console.error('Error fetching level data:', error);
    return null;
  }

  // Validate data structure for new schema
  if (!data || typeof data.track_length !== 'number') {
    console.warn('Fetched data is missing track_length, ignoring:', data);
    return null;
  }

  return data as LevelData;
};

export const saveUserProgress = async (progress: UserProgress, userId: string) => {
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      level_id: progress.level_id,
      completion_time: progress.completion_time,
      used_hints: progress.used_hints,
      is_completed: progress.is_completed,
      completed_at: new Date().toISOString()
    }, { onConflict: 'user_id,level_id' });

  if (error) {
    console.error('Error saving progress:', error);
  }
};
