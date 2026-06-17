import os
from flask import render_template, send_from_directory
from flask import current_app as app
from app.models import Link
from app.github_service import get_github_repositories
from . import main_bp

@main_bp.route('/')
def index():
    # Load Bio Links động từ Database
    links = Link.query.filter_by(is_active=True).order_by(Link.order.asc()).all()
    
    social_links = {
        "facebook": "https://www.facebook.com/ducthangqtm",
        "zalo": "https://zalo.me/0986192092",
        "telegram": "https://t.me/ducthangqtm",
        "x": "https://x.com/ducthangqtm",
        "github": "https://github.com/ducthangqtm",
        'discord': 'https://discord.com/users/thangqtm',
        'whatsapp': 'https://wa.me/84986192092'
    }
    
    repos = get_github_repositories()
    return render_template('main/index.html', links=links, social=social_links, repos=repos)

@main_bp.route('/cv')
def cv():
    return render_template('main/cv.html')

@main_bp.route('/download-cv')
def download_cv():
    img_dir = os.path.join(app.root_path, 'static', 'img')
    return send_from_directory(directory=img_dir, path='cv.pdf', as_attachment=True, download_name='CV_Nguyen_Duc_Thang.pdf')

@main_bp.route('/google954f6558285dd27a.html')
def google_verify():
    return send_from_directory('static', 'google954f6558285dd27a.html')
