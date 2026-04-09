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
    
    # Quan hệ lấy thông tin người bình luận
    # Dùng để hiển thị tên người comment ở post_detail.html thông qua comment.author_info.name
    author_info = db.relationship('User', backref='user_posts_comments', lazy=True)