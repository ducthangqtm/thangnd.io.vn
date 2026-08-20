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
        from app.blueprints.wc2026 import wc2026_bp
        from app.blueprints.epl import epl_bp
        from app.blueprints.c1 import c1_bp

        app.register_blueprint(main_bp)
        app.register_blueprint(auth_bp)
        app.register_blueprint(blog_bp)
        app.register_blueprint(admin_bp)
        app.register_blueprint(chat_bp)
        app.register_blueprint(wc2026_bp, url_prefix='/wc2026')
        app.register_blueprint(epl_bp, url_prefix='/epl')
        app.register_blueprint(c1_bp, url_prefix='/c1')

        # Đăng ký template filter cho markdown
        import markdown2
        @app.template_filter('markdown')
        def render_markdown(text):
            if not text:
                return ""
            return markdown2.markdown(text, extras=["fenced-code-blocks", "tables", "break-on-newline", "code-friendly"])

        # User Loader
        from app.models import User
        @login_manager.user_loader
        def load_user(user_id):
            return User.query.get(int(user_id))

        # Tự động tạo db nếu chưa có
        db.create_all()

        # Tự động đồng bộ các link mặc định nếu database trống
        from app.models import Link, AffiliateLink, JumpRopeProgress
        try:
            if Link.query.count() == 0:
                default_links = [
                    Link(title="Facebook", url="https://www.facebook.com/ducthangqtm", icon_class="fab fa-facebook", order=1),
                    Link(title="Zalo", url="https://zalo.me/0986192092", icon_class="fa-solid fa-comment-sms", order=2),
                    Link(title="Telegram", url="https://t.me/ducthangqtm", icon_class="fab fa-telegram", order=3),
                    Link(title="Discord", url="https://discord.com/users/thangqtm", icon_class="fab fa-discord", order=4),
                    Link(title="Whatsapp", url="https://wa.me/84986192092", icon_class="fab fa-whatsapp", order=5),
                    Link(title="X (Twitter)", url="https://x.com/ducthangqtm", icon_class="fa-brands fa-x-twitter", order=6)
                ]
                db.session.bulk_save_objects(default_links)
                db.session.commit()
            
            # Seed Affiliate links mặc định nếu trống
            if AffiliateLink.query.count() == 0:
                default_aff_links = [
                    AffiliateLink(title="Dây Nhảy Sợi Cáp Đếm Số Tự Động", url="https://shopee.vn", category="Thiết bị", icon_class="fa-solid fa-bolt", order=1),
                    AffiliateLink(title="Thảm Nhảy Dây Giảm Chấn Cao Cấp", url="https://shopee.vn", category="Thiết bị", icon_class="fa-solid fa-rug", order=2),
                    AffiliateLink(title="Giày Thể Thao Êm Chân Chuyên Nhảy Dây", url="https://shopee.vn", category="Trang phục", icon_class="fa-solid fa-shoe-prints", order=3),
                    AffiliateLink(title="Bình Nước Thể Thao 2L Lock&Lock", url="https://shopee.vn", category="Phụ kiện", icon_class="fa-solid fa-bottle-water", order=4)
                ]
                db.session.bulk_save_objects(default_aff_links)
                db.session.commit()

            # Seed Tiến trình Nhảy Dây mặc định nếu trống
            if JumpRopeProgress.query.count() == 0:
                default_progress = [
                    JumpRopeProgress(day_number=1, title="Khởi động hành trình 100 ngày", description="Nhảy 500 cái nhẹ nhàng làm quen lại nhịp độ. Hơi mỏi chân nhẹ.", video_url="https://tiktok.com", is_completed=True),
                    JumpRopeProgress(day_number=2, title="Tăng tốc ngày thứ hai", description="Tăng lên 800 cái. Bắt đầu quen nhịp dây.", video_url="https://tiktok.com", is_completed=True),
                ]
                db.session.bulk_save_objects(default_progress)
                db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error seeding links or progress: {e}")

    return app