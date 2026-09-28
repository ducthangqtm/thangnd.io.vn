# ThangND Lab & Arcade Playground

> **Cổng Serverless Edge Computing & Retro Arcade Game Portal** tại `thangnd.io.vn`  
> **Repository:** `ducthangqtm/thangnd.io.vn`  
> **Nền tảng triển khai:** Cloudflare Pages + Functions + Cloudflare D1 SQLite Database

---

## 🎮 1. Giới Thiệu Dự Án

Dự án `thangnd.io.vn` được tối ưu hóa và cấu trúc lại thành hai phân hệ cốt lõi:
1. **Cloudflare Serverless Lab & API Gateway:**
   - Sandbox tương tác trực tiếp với các Edge Functions:
     + `GET /api/my-ip`: Kiểm tra IP client, ASN, ISP, vị trí địa lý và PoP Datacenter Cloudflare.
     + `GET /api/stats`: Thống kê tổng hợp số lượt gọi API và số lượt chơi game lưu trên Cloudflare D1.
     + `GET /api/leaderboard`: Truy vấn Bảng Vàng Top 10 High Scores theo từng tựa game.
     + `POST /api/track`: Ghi nhận sự kiện telemetry vào D1 database.
   - Trình giả lập cURL command, JSON syntax highlighter và kiểm tra độ trễ Edge theo thời gian thực.
2. **Arcade Game Arena (Retro Cyberpunk Playground):**
   - 6 tựa game mini Arcade chạy trên Canvas và Web Audio API:
     1. **Thắng Nhảy Dây** (`jump`): Game nhảy dây vượt chướng ngại vật nhịp điệu.
     2. **Chiến Cơ Neon** (`space_shooter`): Bắn tàu bay phong cách không gian neon.
     3. **Đua Xe Neon** (`racer`): Đua xe né vật cản tốc độ cao.
     4. **Cyber Snake** (`snake`): Rắn săn mồi cổ điển với giao diện cyberpunk.
     5. **2048 Neon** (`2048`): Ghép số tư duy logic.
     6. **Xếp Hình Neon** (`tetris`): Xếp gạch Tetris kinh điển.
   - Bảng xếp hạng Top 10 High Scores (Global Leaderboard) kết nối trực tiếp với Cloudflare D1.

---

## 📁 2. Cấu Trúc Thư Mục Chuẩn Hóa

```text
thangnd.io.vn/
├── functions/               # Cloudflare Pages Functions (Edge APIs)
│   └── api/
│       ├── my-ip.js         # API trả về IP client & geo details
│       ├── stats.js         # API thống kê tổng lượt call & game plays
│       ├── track.js         # API ghi nhận event telemetry vào D1
│       └── leaderboard.js   # API lấy và ghi nhận điểm kỷ lục D1
├── public/                  # Static assets được phục vụ ở root
│   ├── assets/              # Thumbnail games, sprites, backgrounds, sounds
│   ├── logo-tit.svg         # Logo vector chính thức
│   └── logo-tit.png
├── src/                     # Mã nguồn Frontend ES Modules
│   ├── games/               # Logic 6 game Arcade (Canvas + Audio)
│   ├── modules/             # Quản lý Carousel, Leaderboard, Donate, Lab Sandbox
│   ├── styles/              # CSS Neon Cyberpunk
│   └── main.js              # Entry point kết nối Lab & Arcade
├── index.html               # Trang chủ chính thức duy nhất
├── schema.sql               # Script D1 Database (site_stats, players, leaderboards)
├── vite.config.js           # Cấu hình Vite build
├── wrangler.toml            # Cấu hình D1 database binding cho Pages
└── package.json             # NPM scripts (dev, build, preview)
```

---

## 🚀 3. Hướng Dẫn Chạy & Deploy

### A. Chạy thử nghiệm Local (Development)
```bash
# Cài đặt dependencies
npm install

# Khởi chạy Vite Dev Server
npm run dev

# Kiểm tra build production
npm run build
```

### B. Cấu hình Cloudflare Pages
Khi kết nối Git repository trên Cloudflare Pages Dashboard:
- **Framework preset:** `None` hoặc `Vite`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/` (để trống hoặc `/`)

### C. Cấu hình D1 Database
- **Database Name:** `thangnd-db`
- **Database ID:** `1f218931-cee9-421e-86fe-6cbf61bb8d90`
- Trong cài đặt Cloudflare Pages: vào **Settings ➔ Functions ➔ D1 database bindings**:
  + **Variable name:** `DB`
  + **D1 database:** Chọn `thangnd-db`

Thực thi schema cập nhật lên D1 (nếu cần):
```bash
npx wrangler d1 execute thangnd-db --file=./schema.sql --remote
```
