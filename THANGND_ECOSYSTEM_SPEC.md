# ĐẶC TẢ DỰ ÁN: HỆ SINH THÁI THẮNG ND (DIGITAL IDENTITY & LAB)

> **Tài liệu chuẩn hóa kiến trúc & hướng dẫn Agent thực thi (Dành cho Antigravity / Cursor / Claude Code)**  
> **Repository:** `ducthangqtm/thangnd.io.vn`  
> **Hạ tầng mục tiêu:** Cloudflare Free Tier (Pages + Workers + D1 Database)

---

## 1. TỔNG QUAN HỆ THỐNG & BỐI CẢNH

Hệ sinh thái Thắng ND được định vị trên 3 trụ cột domain:
1. **`thangit.com`**: Kênh Chuyên môn Kỹ thuật (Senior Network/System Engineer, Cisco, MikroTik, Cloudflare, Công cụ IP WAN, Speedtest).
2. **`thangnhayday.com`**: Kênh Năng lượng & Thể chất (Cardio, Kỷ luật thử thách, Cổng Arcade Mini-Game kết nối Cloudflare D1).
3. **`thangnd.io.vn` (Dự án mới - Trọng tâm)**:
   - **Root Domain (`thangnd.io.vn`)**: Digital Identity Hub (Danh thiếp số dạng Bento Grid sáng sủa, hiện đại, trải rộng tối ưu cho PC Desktop, xóa bỏ hoàn toàn layout Link-in-Bio tối màu chật hẹp).
   - **Subdomain (`lab.thangnd.io.vn`)**: Vibe Coding Playground & API Gateway (Cloudflare Worker xử lý bot Telegram, webhook, IP lookup và đọc/ghi D1).

---

## 2. CẤU TRÚC THƯ MỤC MONOREPO

Dự án được quản lý trong repo GitHub duy nhất (`ducthangqtm/thangnd.io.vn`):

```text
thangnd.io.vn/
├── public/                 # Cloudflare Pages (Frontend tĩnh)
│   └── index.html          # Trang Landing Bento Grid (Tailwind CSS CDN + Google Fonts)
├── worker/                 # Cloudflare Workers (Backend API)
│   ├── index.js            # Router xử lý API & tương tác D1
│   └── wrangler.toml       # File cấu hình Cloudflare Worker + Binding D1
├── schema.sql              # File khởi tạo database Cloudflare D1
└── README.md               # Hướng dẫn setup và CI/CD
```

---

## 3. DATABASE SCHEMA (CLOUDFLARE D1)

- **Database Name:** `thangnd-db`
- **Database ID:** `1f218931-cee9-421e-86fe-6cbf61bb8d90`

File: `schema.sql`

```sql
-- Khởi tạo bảng tracking lượt click và truy cập hệ sinh thái
CREATE TABLE IF NOT EXISTS site_stats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    visits INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Khởi tạo dữ liệu mặc định cho các site vệ tinh
INSERT OR IGNORE INTO site_stats (id, name, visits) VALUES 
('thangit', 'Thắng iT Gateway', 0),
('thangnhayday', 'Thắng Nhảy Dây Gateway', 0),
('thangnd_hub', 'Thắng ND Hub Direct', 0);
```

---

## 4. BACKEND API SPECIFICATION (WORKER)

File: `worker/wrangler.toml`

```toml
name = "thangnd-lab-api"
main = "index.js"
compatibility_date = "2026-09-01"

[[d1_databases]]
binding = "DB"
database_name = "thangnd-db"
database_id = "1f218931-cee9-421e-86fe-6cbf61bb8d90"
```

File: `worker/index.js`
- **CORS Middleware**: Mở quyền cho các origin trong hệ sinh thái (`thangnd.io.vn`, `thangit.com`, `thangnhayday.com`).
- **Endpoint 1: `GET /api/my-ip`**:
  - Trích xuất `cf-connecting-ip`, `cf-ipcountry`, `request.cf.city`.
  - Trả về JSON: `{ ip: "...", country: "...", city: "..." }`.
- **Endpoint 2: `GET /api/stats`**:
  - Query: `SELECT * FROM site_stats`.
  - Trả về JSON danh sách lượt truy cập các site.
- **Endpoint 3: `POST /api/track`**:
  - Nhận payload `{ siteId: "thangit" | "thangnhayday" }`.
  - Query: `UPDATE site_stats SET visits = visits + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`.

---

## 5. FRONTEND DESIGN SPECIFICATION (BENTO GRID PC)

File: `public/index.html`

- **Visual Style**:
  - Tông màu: Clean Light Theme (Nền `bg-slate-50`, các card `bg-white` với `border-slate-200/80` và shadow nhẹ).
  - Khổ hiển thị: `max-w-6xl` hoặc `max-w-7xl` căn giữa màn hình PC, tràn đầy không gian mắt nhìn, tuyệt đối không co cụm dạng cột dọc như mobile link-in-bio.
  - Font: `Plus Jakarta Sans` hoặc `Inter`.
- **Các khối Bento chính**:
  1. **Status Header Bar**:
     - Pulse badge màu xanh (Online / Active).
     - Live IP Tag: Tự động fetch từ Worker API để hiện IP và vị trí của khách ghé thăm.
  2. **Hero Card (Cột trái lớn - md:col-span-7)**:
     - Avatar bo góc tròn mềm mại (`rounded-2xl`).
     - Tên "Nguyễn Đức Thắng" + Tagline kép (Senior Network Engineer x Cardio Creator).
     - Hàng nút Social: GitHub, Telegram, Facebook, TikTok.
  3. **Playground & Lab Card (Cột phải - md:col-span-5)**:
     - Card phong cách Terminal/Code (nền tối `from-slate-900 to-slate-800` để tạo điểm nhấn phá cách).
     - Giới thiệu Lab Thử Nghiệm: Bot Telegram, Automation, API. Nút dẫn sang `lab.thangnd.io.vn`.
  4. **Thắng iT Gateway Card (md:col-span-6)**:
     - Biểu tượng mạng (Network Wired), các tag kỹ thuật: Cisco, MikroTik, Cloudflare Zero Trust.
     - Nút CTA chuyển hướng đến `thangit.com` (gắn tracker click qua `navigator.sendBeacon`).
  5. **Thắng Nhảy Dây Gateway Card (md:col-span-6)**:
     - Biểu tượng năng lượng (Bolt), các tag: Cardio Challenge, Arcade Mini-game, D1 Leaderboard.
     - Nút CTA chuyển hướng đến `thangnhayday.com` (gắn tracker click).

---

## 6. HƯỚNG DẪN TRIỂN KHAI NHANH CHO AGENT / DEVELOPER

### Bước 1: Khởi tạo bảng trên Cloudflare D1
- Chạy lệnh migration hoặc dán nội dung file `schema.sql` trực tiếp vào tab **Console** của database `thangnd-db` trên Cloudflare Dashboard:
```bash
npx wrangler d1 execute thangnd-db --file=./schema.sql --remote
```

### Bước 2: Deploy Worker
```bash
cd worker
npx wrangler deploy
# Sau đó gán Custom Domain: lab.thangnd.io.vn trong Cloudflare Dashboard
```

### Bước 3: Deploy Frontend (Cloudflare Pages)
- Kết nối GitHub Repo `ducthangqtm/thangnd.io.vn` vào **Cloudflare Pages**.
- Build settings:
  - **Framework preset**: None
  - **Build output directory**: `public`
- Sau khi deploy, gán Custom Domain: `thangnd.io.vn`.
