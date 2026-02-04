-- Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('golden-egg', 'horse-racing')),
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
    total_participants INTEGER NOT NULL,
    settings JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_type ON game_sessions(type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);

-- Participants Table
CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    avatar_url TEXT,
    player_number INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id);

-- Winners Table
CREATE TABLE IF NOT EXISTS winners (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    prize_rank INTEGER,
    won_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_winners_session ON winners(session_id);

-- Shake Data Table
CREATE TABLE IF NOT EXISTS shake_data (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    intensity REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shake_participant ON shake_data(participant_id);
CREATE INDEX IF NOT EXISTS idx_shake_timestamp ON shake_data(timestamp);

-- Initial Data
INSERT OR IGNORE INTO game_sessions (id, type, status, total_participants, settings)
VALUES ('system', 'golden-egg', 'waiting', 0, '{}');

INSERT OR IGNORE INTO participants (id, session_id, nickname, player_number) 
VALUES ('admin_001', 'system', '管理员', 0);
