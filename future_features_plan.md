# Kế hoạch phát triển tính năng thangnd.io.vn

Tài liệu này lưu trữ các ý tưởng và định hướng phát triển tiếp theo cho trang cá nhân của anh **Nguyễn Đức Thắng (Thắng IT)**.

---

## 🚀 Tính năng đề xuất tiếp theo

### 1. 🗂️ Quản lý Bio Links động từ Dashboard Admin
* **Mục tiêu:** Cho phép Admin thay đổi link mạng xã hội trực tiếp từ Dashboard mà không cần cấu hình cứng trong code.
* **Cần làm:**
  * Thêm bảng `Link` trong `models.py` (id, title, url, icon_class, is_active, order).
  * Viết API/giao diện thêm/sửa/xóa và cập nhật vị trí sắp xếp trong Blueprint `admin`.
  * Thay đổi hàm hiển thị trang chủ của `main_bp` để đọc dữ liệu link động từ Database.

### 2. 📊 Tích hợp GitHub Projects API
* **Mục tiêu:** Tự động đồng bộ các project từ tài khoản GitHub `ducthangqtm` lên trang chủ.
* **Cần làm:**
  * Sử dụng thư viện `requests` ở backend để fetch dữ liệu từ `https://api.github.com/users/ducthangqtm/repos`.
  * Lọc ra các repository nổi bật (pinned hoặc có star/phù hợp).
  * Vẽ giao diện hiển thị danh sách project đẹp mắt bằng thẻ Glassmorphism ở trang chủ.
  * Cài đặt cơ chế cache ngắn hạn ở Flask để tránh vượt quá giới hạn rate limit của GitHub API.

### 🎨 3. Nâng cấp Blog Kỹ thuật
* **Mục tiêu:** Viết bài viết chia sẻ về Network & Automation có chứa code và sơ đồ mạng trực quan.
* **Cần làm:**
  * Tích hợp parser Markdown (`markdown2`) hỗ trợ hiển thị định dạng tài liệu.
  * Nhúng thư viện **Prism.js** hoặc **highlight.js** vào template chi tiết bài viết để hiển thị code block (Python, Cisco IOS config) có tô màu cú pháp.
  * Nhúng **Mermaid.js** để vẽ sơ đồ topo mạng bằng văn bản thô.

### 🌗 4. Chuyển đổi Dark / Light Mode
* **Mục tiêu:** Chuyển đổi giao diện Sáng/Tối linh hoạt.
* **Cần làm:**
  * Xây dựng hệ thống CSS variables màu sắc tương ứng.
  * Thêm nút gạt chế độ trên Navbar và lưu cấu hình người dùng vào `localStorage`.

---

## 🛠️ Trạng thái hiện tại (Đã hoàn thành)
* **Xác thực:** Băm mật khẩu bằng PBKDF2 (`werkzeug.security`) an toàn.
* **Chat Real-time:** Kết nối 2 chiều với Telegram Bot `@fanthangnd_bot` thông qua Cloudflare Worker proxy (`rapid-fog-cd02.thinhlienfc2014.workers.dev`) và cơ chế Polling 3s.
