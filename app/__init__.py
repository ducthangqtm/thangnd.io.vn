from flask import Flask

def create_app():
    app = Flask(__name__)
    
    # Nạp cấu hình từ file config.py (Chứa SECRET_KEY để dùng Session)
    try:
        app.config.from_object('config.Config')
    except:
        # Dự phòng nếu file config lỗi, Sếp vẫn chạy được web
        app.config['SECRET_KEY'] = 'thangnd-secret-2026'

    with app.app_context():
        # Import routes ở đây để đăng ký các đường dẫn (/, /login, /chat_tt)
        from . import routes
        
        # Trả về app nằm ngoài hoặc cuối hàm để đảm bảo app đã sẵn sàng
        return app