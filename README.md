# 🚀 NGUYEN DUC THANG - PORTFOLIO

Giao diện Bio Link cá nhân được xây dựng trên nền tảng **Flask**, tối ưu hóa cho tốc độ và khả năng hiển thị đa thiết bị. Dự án được thiết kế theo phong cách tối giản (Minimalism) dành riêng cho kỹ sư hệ thống.

## 🛠️ Cấu trúc hệ thống (Clean Architecture)

Dự án được rút gọn tối đa, không sử dụng Database rườm rà, tập trung vào hiệu suất:

- **Backend:** Flask (Python 3.x)
- **Frontend:** Tailwind CSS (via CDN) & FontAwesome
- **Deployment:** Cấu hình sẵn sàng cho Nginx / Gunicorn trên môi trường Windows/Linux.

## 📂 Sơ đồ thư mục

```text
thangnd.io.vn/
├── app/
│   ├── static/          # Assets: Profile images, CSS
│   ├── templates/       # Jinja2 Templates: index, base
│   ├── __init__.py      # Flask Application Factory
│   └── routes.py        # Main Routing (Bio Links)
├── serve.py             # Entry point (Development Server)
└── requirements.txt     # Danh sách thư viện
```
