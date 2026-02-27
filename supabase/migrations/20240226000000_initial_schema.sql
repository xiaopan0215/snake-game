-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    nickname VARCHAR(100) NOT NULL,
    energy INTEGER DEFAULT 5,
    coins INTEGER DEFAULT 0,
    is_subscribed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    level_id VARCHAR(50) NOT NULL,
    completion_time INTEGER,
    used_hints INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, level_id)
);

-- Create indexes for user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_level_id ON user_progress(level_id);

-- Create level_data table
CREATE TABLE IF NOT EXISTS level_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id VARCHAR(50) UNIQUE NOT NULL,
    level_number INTEGER NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'easy',
    time_limit INTEGER NOT NULL,
    grid_config JSONB NOT NULL,
    snake_positions JSONB NOT NULL,
    player_start JSONB NOT NULL,
    exit_position JSONB NOT NULL,
    is_unlocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for level_data
CREATE INDEX IF NOT EXISTS idx_level_data_level_number ON level_data(level_number);
CREATE INDEX IF NOT EXISTS idx_level_data_difficulty ON level_data(difficulty);

-- Grant permissions (RLS)
-- Check permissions for the new table and grant access to the anon and authenticated roles

-- Users table permissions
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to users" ON users
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated read access to users" ON users
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Allow authenticated update access to own user data" ON users
    FOR UPDATE TO authenticated USING (auth.uid() = id);

GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- User progress table permissions
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to user_progress" ON user_progress
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated read access to user_progress" ON user_progress
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert access to user_progress" ON user_progress
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated update access to user_progress" ON user_progress
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

GRANT SELECT ON user_progress TO anon;
GRANT ALL PRIVILEGES ON user_progress TO authenticated;

-- Level data table permissions
ALTER TABLE level_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to level_data" ON level_data
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated read access to level_data" ON level_data
    FOR SELECT TO authenticated USING (true);

GRANT SELECT ON level_data TO anon;
GRANT SELECT ON level_data TO authenticated;
