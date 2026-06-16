import os
import re

from flask import render_template, request, redirect, url_for, jsonify, flash, abort
from flask import current_app as app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
from app.models import Post, User
from app import db
from app.utils import slugify, delete_image_files
from . import admin_bp

@admin_bp.route('/thangnd-dashboard')
@login_required
def dashboard():
    if current_user.role not in ['admin', 'mod']:
        abort(403)
    posts = Post.query.order_by(Post.date_posted.desc()).all()
    users = User.query.all()
    return render_template('admin/dashboard.html', posts=posts, users=users)

@admin_bp.route('/thangnd-admin/create-user', methods=['POST'])
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
        hashed_password = generate_password_hash(password)
        new_user = User(username=username, password=hashed_password, name=full_name, role=role)
        db.session.add(new_user)
        db.session.commit()
        flash(f'Đã tạo thành công tài khoản {role}: {username}', 'success')
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/delete-user/<int:id>')
@login_required
def delete_user(id):
    if current_user.role != 'admin': abort(403)
    user = User.query.get_or_404(id)
    if user.username == 'thangnd':
        flash('Không thể xóa Admin gốc!', 'danger')
        return redirect(url_for('admin.dashboard'))
    db.session.delete(user)
    db.session.commit()
    flash(f'Đã xóa user {user.username}', 'success')
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/thangnd-admin', methods=['GET', 'POST'])
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
        return redirect(url_for('admin.dashboard'))
    return render_template('admin/add_post.html')



@admin_bp.route('/edit-post/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_post(id):
    if current_user.role not in ['admin', 'mod']: abort(403)
    post = Post.query.get_or_404(id)
    if request.method == 'POST':
        new_content = request.form.get('content')
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
        return redirect(url_for('admin.dashboard'))
    return render_template('admin/edit_post.html', post=post)

@admin_bp.route('/delete-post/<int:id>')
@login_required
def delete_post(id):
    if current_user.role != 'admin': abort(403)
    post = Post.query.get_or_404(id)
    delete_image_files(post.content)
    db.session.delete(post)
    db.session.commit()
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/upload-image-content', methods=['POST'])
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
