-- Cloudflare D1 Database Schema for thangnd.io.vn Multi-Game Leaderboard
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  game TEXT NOT NULL DEFAULT 'rope',
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, game)
);

-- Indices for rapid leaderboard sorting & player lookup
CREATE INDEX IF NOT EXISTS idx_leaderboard_game_score ON leaderboard(game, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_player ON leaderboard(player_id);

-- Players table for Name and PIN management
CREATE TABLE IF NOT EXISTS players (
  name TEXT PRIMARY KEY COLLATE NOCASE,
  pin TEXT NOT NULL,
  player_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
