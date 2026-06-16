import os
from dotenv import load_dotenv

# Tìm và nạp các biến từ file .env vào hệ thống
load_dotenv()

class Config:
    # Cấu hình cơ bản
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-thang-network-2026'
    
    # Cấu hình Database
    # Sử dụng thư mục instance cho SQLite
    BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    INSTANCE_PATH = os.path.join(BASE_DIR, 'instance')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(INSTANCE_PATH, 'blog.db').replace('\\', '/')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Cấu hình Upload
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'app', 'static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # Giới hạn 16MB

    # Cấu hình Telegram Chat
    TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
    TELEGRAM_ADMIN_CHAT_ID = os.environ.get('TELEGRAM_ADMIN_CHAT_ID')
