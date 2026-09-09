# 🕹️ thangnd.io.vn — Thắng Arcade & Leaderboard

Cổng game Arcade cá nhân phong cách Cyberpunk / Retro Synthwave tại [thangnd.io.vn](https://thangnd.io.vn).

## 🎮 Các trò chơi tích hợp:
1. **Thắng Nhảy Dây — Thử Thách Hành Lang 1.5m**: Game nhảy dây pixel-art 60 FPS, vật lý dây uốn lượn mượt mà, nhân vật Thắng nhảy tránh dây.
2. **Cyber Snake (Rắn Săn Mồi Neon)**: Đồ hoạ neon glow, hỗ trợ cả bàn phím lẫn D-Pad cảm ứng cho điện thoại.
3. **2048 Retro Neon**: Ghép số cổ điển với phong cách Synthwave, hỗ trợ vuốt chạm đa điểm.

---

## 🏆 Hệ thống Bảng Xếp Hạng Đa Game (Multi-Game Leaderboard):
- **Cơ chế Player ID ẩn**: Mỗi người chơi được cấp một ID định danh ẩn trong trình duyệt (`localStorage`).
- **Tên dùng chung & Tự động đồng bộ**: Nhập tên 1 lần dùng cho tất cả các trò chơi. Khi đổi nickname, hệ thống tự động cập nhật tên mới cho toàn bộ các kỷ lục của người chơi đó.
- **Lưu kỷ lục cao nhất (Best Score per Player)**: Mỗi người chơi giữ 1 vị trí với điểm cao nhất trong từng trò, tránh spam top.
- **Sẵn sàng mở rộng**: Hỗ trợ thêm bất kỳ trò chơi mới nào sau này mà không cần thay đổi cấu trúc bảng database.

---

## 🚀 Hướng dẫn Triển khai lên Cloudflare Pages & D1:

### Bước 1: Deploy Website qua Cloudflare Pages
1. Truy cập [dash.cloudflare.com](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Chọn repo `ducthangqtm/thangnd.io.vn`.
3. Cấu hình build:
   - **Framework preset**: `None`
   - **Build command**: *(Để trống)*
   - **Build output directory**: `/` *(hoặc để trống nếu deploy root directory)*
4. Bấm **Save and Deploy**.

### Bước 2: Tạo Cloudflare D1 Database cho Bảng Xếp Hạng
1. Vào mục **Workers & Pages** > **D1 SQL Database** > **Create database**.
2. Đặt tên database là `thangnd-db` (hoặc tên tuỳ chọn).
3. Chạy lệnh SQL tạo bảng (sử dụng Console trên web Cloudflare hoặc CLI Wrangler):
   ```bash
   npx wrangler d1 execute thangnd-db --remote --file=./schema.sql
   ```
   *(Hoặc copy toàn bộ nội dung file `schema.sql` dán vào tab **Console** của database D1 trên trang Cloudflare).*

### Bước 3: Liên kết D1 Database với Cloudflare Pages
1. Trong trang dự án Cloudflare Pages vừa tạo, vào **Settings** > **Functions**.
2. Cuộn xuống phần **D1 database bindings** > Bấm **Add binding**.
3. Điền cấu hình:
   - **Variable name**: `DB` *(BẮT BUỘC viết hoa chữ DB)*
   - **D1 database**: Chọn database `thangnd-db` vừa tạo ở Bước 2.
4. Bấm **Save**.
5. Vào tab **Deployments** và bấm **Retry deployment** (hoặc push một commit mới) để Functions nhận binding `DB`.

Website của bạn đã sẵn sàng chạy với bảng xếp hạng thời gian thực trên toàn cầu! 🎉
