CREATE TABLE IF NOT EXISTS pursuit_followup_notes (
    id SERIAL PRIMARY KEY,
    pursuit_id VARCHAR NOT NULL,
    user_id TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (pursuit_id) REFERENCES pursuits(id) ON DELETE CASCADE
);