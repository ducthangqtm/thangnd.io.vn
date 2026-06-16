import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from app.config import Config

# Khởi tạo các extension
db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Đảm bảo thư mục 'instance' tồn tại
    if not os.path.exists(app.instance_path):
        try:
            os.makedirs(app.instance_path)
        except OSError:
            pass

    # Kết nối app với các extension
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    
    # Cấu hình cho Login
    login_manager.login_view = 'auth.login' # Cập nhật link sang blueprint auth
    login_manager.login_message_category = 'info'

    with app.app_context():
        # Đăng ký Blueprints
        from app.blueprints.main import main_bp
        from app.blueprints.auth import auth_bp
        from app.blueprints.blog import blog_bp
        from app.blueprints.admin import admin_bp
        from app.blueprints.chat import chat_bp

        app.register_blueprint(main_bp)
        app.register_blueprint(auth_bp)
        app.register_blueprint(blog_bp)
        app.register_blueprint(admin_bp)
        app.register_blueprint(chat_bp)

        # User Loader
        from app.models import User
        @login_manager.user_loader
        def load_user(user_id):
            return User.query.get(int(user_id))

        # Tự động tạo db nếu chưa có
        db.create_all()

    return app