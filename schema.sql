-- ==========================================================
-- THANG ND ECOSYSTEM - CLOUDFLARE D1 DATABASE SCHEMA
-- Database: thangnd-db (ID: 1f218931-cee9-421e-86fe-6cbf61bb8d90)
-- ==========================================================

-- 1. Bảng tracking lượt click và truy cập hệ sinh thái
CREATE TABLE IF NOT EXISTS site_stats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    visits INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Khởi tạo dữ liệu mặc định cho các site vệ tinh
INSERT OR IGNORE INTO site_stats (id, name, visits, updated_at) VALUES 
('thangit', 'Thắng iT Gateway', 0, CURRENT_TIMESTAMP),
('thangnhayday', 'Thắng Nhảy Dây Gateway', 0, CURRENT_TIMESTAMP),
('thangnd_hub', 'Thắng ND Hub Direct', 0, CURRENT_TIMESTAMP);
