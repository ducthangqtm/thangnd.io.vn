from waitress import serve
from app import create_app

# Khởi tạo ứng dụng theo cấu hình Factory
app = create_app()

if __name__ == '__main__':
    print("🚀 Server đang chạy tại: http://0.0.0.0:5000")
    print("💡 Host 0.0.0.0 cho phép truy cập từ các thiết bị khác trong cùng mạng LAN.")
    
    # Chạy bằng Waitress (WSGI Server cho Production)
    serve(app, host='0.0.0.0', port=5000, threads=4)
