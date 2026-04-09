import os
import unicodedata
import re
from flask import render_template, send_from_directory, request, redirect, url_for, jsonify, flash, abort, session
from flask import current_app as app
from .models import Post, User, Comment 
from . import db
from werkzeug.utils import secure_filename
from flask_login import login_user, logout_user, login_required, current_user

# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------
def slugify(text):
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)

def delete_image_files(content):
    """Tìm và xóa các file ảnh vật lý có trong nội dung bài viết"""
    images = re.findall(r'src="([^"]+)"', content)
    for img_url in images:
        if '/static/uploads/' in img_url:
            filename = img_url.split('/')[-1]
            file_path = os.path.join(app.root_path, 'static', 'uploads', filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Lỗi xóa file: {e}")

# ---------------------------------------------------------
# ROUTES CÔNG KHAI
# ---------------------------------------------------------
@app.route('/')
def index():
    social_links = {
        "facebook": "https://www.facebook.com/ducthangqtm",
        "zalo": "https://zalo.me/0986192092", 
        "x": "https://x.com/ducthangqtm",
        "github": "https://github.com/ducthangqtm",
        'discord': 'https://discord.com/users/thangqtm',
        'whatsapp': 'https://wa.me/84986192092'
    }
    return render_template('index.html', social=social_links)

@app.route('/cv')
def cv():
    return render_template('cv.html')

@app.route('/blog')
def blog_list():
    posts = Post.query.order_by(Post.date_posted.desc()).all()
    return render_template('blog.html', posts=posts)

@app.route('/blog/<slug>')
def blog_detail(slug):
    post = Post.query.filter_by(slug=slug).first_or_404()
    return render_template('post_detail.html', post=post)

# ---------------------------------------------------------
# XỬ LÝ ĐĂNG NHẬP & ĐĂNG KÝ
# ---------------------------------------------------------
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form.get('username')).first()
        if user and user.password == request.form.get('password'):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Tài khoản hoặc mật khẩu không đúng!', 'danger')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        session.pop('_flashes', None)

    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        
        if User.query.filter_by(username=username).first():
            flash('Tên đăng nhập đã tồn tại!', 'danger')
            return redirect(url_for('register'))
            
        new_user = User(username=username, password=password, name=full_name, role='member')
        db.session.add(new_user)
        db.session.commit()
        
        flash('Tài khoản đã được tạo! Giờ anh có thể đăng nhập để bình luận.', 'success')
        return redirect(url_for('login'))
        
    return render_template('register.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

# ---------------------------------------------------------
# HỆ THỐNG BÌNH LUẬN
# ---------------------------------------------------------
@app.route('/post/<int:post_id>/comment', methods=['POST'])
@login_required
def add_comment(post_id):
    body = request.form.get('comment_body')
    if body:
        new_comment = Comment(body=body, post_id=post_id, user_id=current_user.id)
        db.session.add(new_comment)
        db.session.commit()
    post = Post.query.get_or_404(post_id)
    return redirect(url_for('blog_detail', slug=post.slug))

# ---------------------------------------------------------
# PHẦN QUẢN TRỊ (ADMIN & MODERATOR)
# ---------------------------------------------------------
@app.route('/thangnd-dashboard')
@login_required
def dashboard():
    if current_user.role not in ['admin', 'mod']:
        abort(403)
    
    posts = Post.query.order_by(Post.date_posted.desc()).all()
    users = User.query.all()
    return render_template('dashboard.html', posts=posts, users=users)

@app.route('/thangnd-admin/create-user', methods=['POST'])
@login_required
def admin_create_user():
    if current_user.role != 'admin':
        abort(403)
        
    username = request.form.get('username')
    password = request.form.get('password')
    full_name = request.form.get('full_name')
    role = request.form.get('role')

    if User.query.filter_by(username=username).first():
        flash('Username này đã tồn tại!', 'danger')
    else:
        new_user = User(username=username, password=password, name=full_name, role=role)
        db.session.add(new_user)
        db.session.commit()
        flash(f'Đã tạo thành công tài khoản {role}: {username}', 'success')
        
    return redirect(url_for('dashboard'))

@app.route('/delete-user/<int:id>')
@login_required
def delete_user(id):
    if current_user.role != 'admin': abort(403)
    user = User.query.get_or_404(id)
    if user.username == 'thangnd':
        flash('Không thể xóa Admin gốc!', 'danger')
        return redirect(url_for('dashboard'))
        
    db.session.delete(user)
    db.session.commit()
    flash(f'Đã xóa user {user.username}', 'success')
    return redirect(url_for('dashboard'))

@app.route('/thangnd-admin', methods=['GET', 'POST'])
@login_required
def add_post():
    if current_user.role not in ['admin', 'mod']: abort(403)
    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content')
        slug = slugify(title)
        
        file = request.files.get('image')
        image_html = ""
        if file and file.filename != '':
            upload_path = os.path.join(app.root_path, 'static', 'uploads')
            if not os.path.exists(upload_path): os.makedirs(upload_path)
            filename = secure_filename(file.filename)
            filename = f"{int(os.urandom(4).hex(), 16)}_{filename}"
            file.save(os.path.join(upload_path, filename))
            img_url = url_for('static', filename='uploads/' + filename)
            image_html = f'<div class="flex justify-center mb-8"><img src="{img_url}" class="max-w-full rounded-3xl shadow-[0_10px_30px_-5px_rgba(212,175,55,0.3)] border border-white/5" style="max-height: 500px; width: 600px; object-fit: cover;"></div>'

        new_post = Post(
            title=title,
            content=image_html + content,
            author=current_user.name,
            slug=slug,
            user_id=current_user.id
        )
        db.session.add(new_post)
        db.session.commit()
        return redirect(url_for('dashboard'))
    return render_template('add_post.html')

@app.route('/edit-post/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_post(id):
    if current_user.role not in ['admin', 'mod']: abort(403)
    post = Post.query.get_or_404(id)
    
    if request.method == 'POST':
        new_content = request.form.get('content')
        
        # SO SÁNH ĐỂ XÓA ẢNH CŨ KHÔNG CÒN DÙNG TRONG BẢN SỬA
        old_images = re.findall(r'src="([^"]+)"', post.content)
        new_images = re.findall(r'src="([^"]+)"', new_content)
        
        for img in old_images:
            if img not in new_images and '/static/uploads/' in img:
                filename = img.split('/')[-1]
                file_path = os.path.join(app.root_path, 'static', 'uploads', filename)
                if os.path.exists(file_path):
                    try: os.remove(file_path)
                    except: pass

        post.title = request.form.get('title')
        post.content = new_content
        post.slug = slugify(post.title)
        db.session.commit()
        return redirect(url_for('dashboard'))
        
    return render_template('edit_post.html', post=post)

@app.route('/delete-post/<int:id>')
@login_required
def delete_post(id):
    if current_user.role != 'admin': abort(403)
    post = Post.query.get_or_404(id)
    
    # XÓA FILE ẢNH VẬT LÝ TRƯỚC KHI XÓA BÀI
    delete_image_files(post.content)
    
    db.session.delete(post)
    db.session.commit()
    return redirect(url_for('dashboard'))

@app.route('/upload-image-content', methods=['POST'])
@login_required
def upload_image_content():
    file = request.files.get('upload')
    if file:
        upload_path = os.path.join(app.root_path, 'static', 'uploads')
        if not os.path.exists(upload_path): os.makedirs(upload_path)
        filename = secure_filename(file.filename)
        filename = f"editor_{int(os.urandom(4).hex(), 16)}_{filename}"
        file.save(os.path.join(upload_path, filename))
        return jsonify({"uploaded": 1, "fileName": filename, "url": url_for('static', filename='uploads/' + filename)})
    return jsonify({"uploaded": 0, "error": {"message": "Lỗi tải file."}})

@app.route('/download-cv')
def download_cv():
    img_dir = os.path.join(app.root_path, 'static', 'img')
    return send_from_directory(directory=img_dir, path='cv.pdf', as_attachment=True, download_name='CV_Nguyen_Duc_Thang.pdf')

@app.route('/google954f6558285dd27a.html')
def google_verify():
    return send_from_directory('static', 'google954f6558285dd27a.html')