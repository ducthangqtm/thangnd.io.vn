# Thắng ND — Digital Identity & Lab Ecosystem

> **Digital Identity Hub & API Gateway** của **Nguyễn Đức Thắng (Thắng ND)**  
> **Repository:** `ducthangqtm/thangnd.io.vn`  
> **Hạ tầng triển khai:** Cloudflare Free Tier (Pages + Workers + D1 SQLite Database)

---

## 🌐 1. Cấu Trúc Hệ Sinh Thái Domain

| Tên miền / Subdomain | Mục đích & Chức năng | Nền tảng |
| :--- | :--- | :--- |
| **`thangnd.io.vn`** | **Digital Identity Hub (Root)**: Danh thiếp số Bento Grid hiện đại chuẩn PC Desktop, điều hướng toàn bộ hệ sinh thái | Cloudflare Pages |
| **`lab.thangnd.io.vn`** | **Vibe Coding Playground & API Gateway**: Worker xử lý `/api/my-ip`, `/api/stats`, `/api/track` và tương tác D1 | Cloudflare Worker |
| **`thangit.com`** | **Tech Gateway**: Kênh kỹ thuật mạng (Cisco, MikroTik, Cloudflare Zero Trust, WAN IP, Speedtest) | Site vệ tinh |
| **`thangnhayday.com`** | **Fitness Gateway**: Kênh cardio nhảy dây (1000 Skips Challenge, Arcade Mini-game, D1 Leaderboard) | Site vệ tinh |

---

## 📁 2. Cấu Trúc Thư Mục Dự Án

```text
thangnd.io.vn/
├── public/                 # Cloudflare Pages (Frontend tĩnh)
│   └── index.html          # Trang Bento Grid PC (Tailwind CSS CDN + Google Fonts)
├── worker/                 # Cloudflare Workers (Backend API)
│   ├── index.js            # Router API (/api/my-ip, /api/stats, /api/track)
│   └── wrangler.toml       # Cấu hình Worker & binding Cloudflare D1
├── schema.sql              # Script DDL khởi tạo bảng site_stats & seed dữ liệu
├── index.html              # Đồng bộ root index.html hỗ trợ linh hoạt build Pages
├── THANGND_ECOSYSTEM_SPEC.md # Đặc tả kiến trúc chi tiết
└── README.md               # Hướng dẫn quản trị & triển khai hệ thống
```

---

## 🚀 3. Hướng Dẫn Triển Khai Nhanh

### Bước 1: Khởi tạo Database Cloudflare D1

- **Database Name:** `thangnd-db`
- **Database ID:** `1f218931-cee9-421e-86fe-6cbf61bb8d90`

Chạy lệnh thực thi file `schema.sql` lên D1 Remote:
```bash
# Thực thi migration D1 trực tiếp qua Wrangler
npx wrangler d1 execute thangnd-db --file=./schema.sql --remote
```

*(Hoặc: Đăng nhập vào Cloudflare Dashboard ➔ Workers & Pages ➔ D1 SQL Database ➔ chọn `thangnd-db` ➔ tab **Console** ➔ dán toàn bộ nội dung file `schema.sql` và bấm Execute).*

---

### Bước 2: Deploy Cloudflare Worker (`lab.thangnd.io.vn`)

1. Di chuyển vào thư mục worker:
```bash
cd worker
```

2. Kiểm tra hoặc đăng nhập Cloudflare (nếu chưa đăng nhập):
```bash
npx wrangler login
```

3. Deploy Worker lên Cloudflare Edge:
```bash
npx wrangler deploy
```

4. **Gán Custom Domain trên Cloudflare Dashboard**:
   - Truy cập **Workers & Pages** ➔ Chọn Worker **`thangnd-lab-api`**.
   - Vào tab **Settings** ➔ **Domains & Routes** ➔ Bấm **Add** ➔ **Custom Domain**.
   - Nhập: `lab.thangnd.io.vn` và bấm kích hoạt (Cloudflare sẽ tự động cấp SSL/TLS và cấu hình DNS CNAME).

---

### Bước 3: Deploy Frontend (Cloudflare Pages)

1. Truy cập **Cloudflare Dashboard** ➔ **Workers & Pages** ➔ **Create application** ➔ **Pages** ➔ **Connect to Git**.
2. Chọn repository: **`ducthangqtm/thangnd.io.vn`**.
3. Cấu hình thông số Build:
   - **Framework preset**: `None`
   - **Build command**: *(để trống)*
   - **Build output directory**: `public` (hoặc `.` vì root đã đồng bộ `index.html`)
4. Bấm **Save and Deploy**.
5. **Gán Custom Domain**:
   - Sau khi deploy xong, vào tab **Custom domains** của Pages project.
   - Thêm `thangnd.io.vn` và bấm kích hoạt.

---

## 🔌 4. Đặc Tả API Gateway (`lab.thangnd.io.vn`)

| Phương thức | Đường dẫn | Chức năng | Dữ liệu trả về |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/my-ip` | Trả về thông tin IP, quốc gia, thành phố của khách qua Cloudflare Headers | `{ "ip": "...", "country": "VN", "city": "Hanoi" }` |
| `GET` | `/api/stats` | Lấy danh sách lượt click / visits các site từ Cloudflare D1 | `{ "success": true, "data": [...], "totalVisits": 120 }` |
| `POST` | `/api/track` | Tăng số lượt visits cho site (`thangit`, `thangnhayday`, `thangnd_hub`) | `{ "success": true, "siteId": "thangit" }` |
| `OPTIONS`| `*` | Xử lý CORS Preflight cho toàn bộ domain vệ tinh | Status 204 No Content |

---

## 🛠️ 5. Thử Nghiệm Tại Local (Development)

- **Test Worker API tại máy:**
  ```bash
  cd worker
  npx wrangler dev
  ```
- **Test Frontend tại máy:**
  Mở file `public/index.html` trực tiếp trên trình duyệt hoặc sử dụng Live Server (`npx serve public`).

---

© 2026 **Nguyễn Đức Thắng (Thắng ND)**. All rights reserved.
