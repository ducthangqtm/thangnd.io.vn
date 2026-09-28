-- ==========================================================
-- THANGND LAB & ARCADE PLAYGROUND - CLOUDFLARE D1 DATABASE SCHEMA
-- Database: thangnd-db (ID: 1f218931-cee9-421e-86fe-6cbf61bb8d90)
-- ==========================================================

-- 1. BẢNG THỐNG KÊ TRAFFIC & API REQUESTS (CLOUDFLARE LAB)
CREATE TABLE IF NOT EXISTS site_stats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    visits INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Khởi tạo dữ liệu mặc định cho Lab telemetry
INSERT OR IGNORE INTO site_stats (id, name, visits, updated_at) VALUES 
('api_my_ip', 'API /api/my-ip Calls', 0, CURRENT_TIMESTAMP),
('api_stats', 'API /api/stats Queries', 0, CURRENT_TIMESTAMP),
('api_leaderboard', 'API /api/leaderboard Calls', 0, CURRENT_TIMESTAMP),
('portal_visits', 'Portal Page Impressions', 0, CURRENT_TIMESTAMP);

-- 2. BẢNG NGƯỜI CHƠI & BẢO VỆ DANH TÍNH BẢNG VÀNG
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE,
    pin_hash TEXT NOT NULL,
    contact_info TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_players_normalized ON players(normalized_name);

-- 3. BẢNG ĐIỂM CHI TIẾT THEO TUẦN VÀ THEO GAME
CREATE TABLE IF NOT EXISTS game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    week_id TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_game_scores_game ON game_scores(game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_week ON game_scores(game_id, week_id, score DESC);

-- 4. BẢNG LEADERBOARDS MINI-GAMES TRỰC TIẾP
CREATE TABLE IF NOT EXISTS leaderboards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_game_score ON leaderboards(game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_game_created ON leaderboards(game_id, created_at DESC);

-- 5. BẢNG THỐNG KÊ TỔNG THỂ GAME (TOTAL PLAYS)
CREATE TABLE IF NOT EXISTS game_stats (
    key TEXT PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO game_stats (key, value) VALUES ('total_plays', 0);
