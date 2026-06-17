from . import db
from datetime import datetime
from flask_login import UserMixin

# 1. Bảng User
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), default='Thắng Nguyễn')
    
    # THÊM MỚI: Cột phân quyền (admin, mod, member)
    # Mặc định khi đăng ký qua trang web sẽ là 'member'
    role = db.Column(db.String(20), nullable=False, default='member')
    
    # Liên kết với bài viết
    posts = db.relationship('Post', backref='author_user', lazy=True)
    
    # Liên kết với bình luận
    # commenter giúp ta gọi user.user_comments để xem người đó đã comment những gì
    user_comments = db.relationship('Comment', backref='commenter', lazy=True)

# 2. Bảng Post
class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(50), default='Thắng Nguyễn') 
    date_posted = db.Column(db.DateTime, default=datetime.utcnow)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Quan hệ với Comment: 
    # cascade="all, delete-orphan" để khi xóa Post thì tự động xóa hết Comment liên quan
    comments = db.relationship('Comment', backref='belong_to_post', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"Post('{self.title}', '{self.date_posted}')"
    
# 3. Bảng Comment
class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.Text, nullable=False)
    date_posted = db.Column(db.DateTime, default=datetime.utcnow)
    
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# 4. Bảng ChatSession (Phiên chat của khách truy cập)
class ChatSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False)
    visitor_name = db.Column(db.String(100), default='Khách ẩn danh')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    messages = db.relationship('ChatMessage', backref='session', lazy=True, cascade="all, delete-orphan")

# 5. Bảng ChatMessage (Tin nhắn chat)
class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), db.ForeignKey('chat_session.session_id'), nullable=False)
    sender = db.Column(db.String(10), nullable=False) # 'visitor' hoặc 'admin'
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    telegram_message_id = db.Column(db.Integer, nullable=True) # Để ánh xạ phản hồi từ admin qua Telegram

# 6. Bảng Link (Quản lý các Bio Links động)
class Link(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    icon_class = db.Column(db.String(100), nullable=False) # e.g. 'fa-brands fa-facebook'
    is_active = db.Column(db.Boolean, default=True)
    order = db.Column(db.Integer, default=0)