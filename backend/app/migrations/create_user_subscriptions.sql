-- Create user_subscriptions table if it does not exist
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    plan_type TEXT NOT NULL,
    status TEXT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure an index on user_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- Add trigger to keep updated_at current
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_user_subscriptions'
    ) THEN
        CREATE OR REPLACE FUNCTION set_timestamp() RETURNS trigger AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER set_timestamp_user_subscriptions
        BEFORE UPDATE ON user_subscriptions
        FOR EACH ROW
        EXECUTE PROCEDURE set_timestamp();
    END IF;
END$$;


