from waitress import serve
from app import create_app

# Khởi tạo ứng dụng theo cấu hình Factory
app = create_app()

if __name__ == '__main__':
    print("Server dang chay tai: http://127.0.0.1:5000 (Che do Nginx Proxy)")
    
    # Chạy bằng Waitress tại localhost, Nginx sẽ proxy vào đây
    serve(app, host='127.0.0.1', port=5000, threads=4)
