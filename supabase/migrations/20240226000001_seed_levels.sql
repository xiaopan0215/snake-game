INSERT INTO level_data (level_id, level_number, difficulty, time_limit, grid_config, snake_positions, player_start, exit_position, is_unlocked)
VALUES (
  'level_1',
  1,
  'easy',
  300,
  '{"width": 10, "height": 10}',
  '[
    {"id": "snake_1", "segments": [{"x": 4, "y": 3}, {"x": 4, "y": 4}, {"x": 4, "y": 5}], "color": "#FF0000", "direction": "vertical"},
    {"id": "snake_2", "segments": [{"x": 2, "y": 7}, {"x": 3, "y": 7}, {"x": 4, "y": 7}, {"x": 5, "y": 7}], "color": "#00FF00", "direction": "horizontal"}
  ]',
  '{"x": 1, "y": 1}',
  '{"x": 8, "y": 8}',
  true
) ON CONFLICT (level_id) DO NOTHING;
