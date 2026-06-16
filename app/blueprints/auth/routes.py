from flask import render_template, request, redirect, url_for, flash, session
from flask_login import login_user, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import User
from app import db
from . import auth_bp

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form.get('username')).first()
        if user:
            is_valid = False
            # Check if password is a hash
            if user.password.startswith(('pbkdf2:', 'scrypt:', 'bcrypt:', 'argon2:')):
                is_valid = check_password_hash(user.password, request.form.get('password'))
            else:
                # Plaintext fallback for legacy users
                is_valid = (user.password == request.form.get('password'))
                if is_valid:
                    # Upgrade password to hash on successful login
                    user.password = generate_password_hash(request.form.get('password'))
                    db.session.commit()
            
            if is_valid:
                login_user(user)
                return redirect(url_for('main.index'))
            else:
                flash('Tài khoản hoặc mật khẩu không đúng!', 'danger')
        else:
            flash('Tài khoản hoặc mật khẩu không đúng!', 'danger')
    return render_template('auth/login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        session.pop('_flashes', None)

    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        
        if User.query.filter_by(username=username).first():
            flash('Tên đăng nhập đã tồn tại!', 'danger')
            return redirect(url_for('auth.register'))
            
        hashed_password = generate_password_hash(password)
        new_user = User(username=username, password=hashed_password, name=full_name, role='member')
        db.session.add(new_user)
        db.session.commit()
        
        flash('Tài khoản đã được tạo! Giờ anh có thể đăng nhập để bình luận.', 'success')
        return redirect(url_for('auth.login'))
        
    return render_template('auth/register.html')

@auth_bp.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('main.index'))
