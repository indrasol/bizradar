-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    language TEXT DEFAULT 'en',
    time_zone TEXT DEFAULT 'UTC',
    date_format TEXT DEFAULT 'MM/DD/YYYY',
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
