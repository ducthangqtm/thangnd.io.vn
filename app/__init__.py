import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate # 1. Import thêm Migrate

# Khởi tạo các extension
db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate() # 2. Khởi tạo đối tượng migrate

def create_app():
    app = Flask(__name__)

    # 1. Cấu hình Database & Security
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.instance_path, 'blog.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'dev-key-thang-network-2026'

    # 2. Đảm bảo thư mục 'instance' tồn tại
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # 3. Kết nối app với các extension
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db) # 3. Kết nối migrate với app và db
    
    # Cấu hình cho Login: Nếu chưa đăng nhập mà vào trang cấm thì đá về trang 'login'
    login_manager.login_view = 'login'
    login_manager.login_message_category = 'info'

    # 4. Đăng ký Models, Routes và User Loader
    with app.app_context():
        from . import models
        from . import routes
        from .models import User # Import bảng User để load dữ liệu
        
        # User Loader: Giúp Flask-Login lấy thông tin User từ ID trong session
        @login_manager.user_loader
        def load_user(user_id):
            return User.query.get(int(user_id))

        # Tự động tạo file .db nếu chưa có (Sau này dùng Migrate thì dòng này có thể bỏ qua)
        db.create_all()

    return app