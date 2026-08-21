import os
from flask import render_template, send_from_directory, Response
from flask import current_app as app
from app.models import Link, AffiliateLink, VisitorCount, Post
from app import db
from app.github_service import get_github_repositories
from . import main_bp

@main_bp.route('/')
def index():
    # Tăng và lưu số lượt truy cập (Visitor Count)
    visitor = VisitorCount.query.first()
    if not visitor:
        visitor = VisitorCount(count=1)
        db.session.add(visitor)
    else:
        visitor.count += 1
    db.session.commit()
    
    # Load Bio Links động từ Database cho IT
    it_links = Link.query.filter((Link.target == 'it') | (Link.target == None)).filter_by(is_active=True).order_by(Link.order.asc()).all()
    
    # Load Bio Links động từ Database cho Nhảy Dây
    nhayday_links = Link.query.filter_by(target='nhayday', is_active=True).order_by(Link.order.asc()).all()
    
    # Load các link Affiliate cho Nhảy Dây
    aff_links = AffiliateLink.query.filter_by(is_active=True).order_by(AffiliateLink.order.asc()).all()
    
    # Phân nhóm các link affiliate theo danh mục
    links_by_category = {}
    for link in aff_links:
        if link.category not in links_by_category:
            links_by_category[link.category] = []
        links_by_category[link.category].append(link)
    
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
    return render_template('main/index.html', links=it_links, nhayday_links=nhayday_links, social=social_links, repos=repos, links_by_category=links_by_category, visitor_count=visitor.count)

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

@main_bp.route('/robots.txt')
def robots():
    content = """User-agent: *
Allow: /
Sitemap: https://thangnhayday.com/sitemap.xml
"""
    return Response(content, mimetype='text/plain')

@main_bp.route('/sitemap.xml')
def sitemap():
    base_url = "https://thangnhayday.com"
    pages = [
        {"loc": f"{base_url}/", "priority": "1.0", "changefreq": "daily"},
        {"loc": f"{base_url}/cv", "priority": "0.7", "changefreq": "monthly"},
        {"loc": f"{base_url}/blog", "priority": "0.8", "changefreq": "daily"},
    ]
    try:
        posts = Post.query.order_by(Post.date_posted.desc()).all()
        for p in posts:
            pages.append({
                "loc": f"{base_url}/blog/{p.slug}",
                "priority": "0.6",
                "changefreq": "weekly",
                "lastmod": p.date_posted.strftime("%Y-%m-%d") if p.date_posted else None
            })
    except Exception:
        pass

    xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml_lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for page in pages:
        xml_lines.append('  <url>')
        xml_lines.append(f'    <loc>{page["loc"]}</loc>')
        if page.get("lastmod"):
            xml_lines.append(f'    <lastmod>{page["lastmod"]}</lastmod>')
        xml_lines.append(f'    <changefreq>{page.get("changefreq", "monthly")}</changefreq>')
        xml_lines.append(f'    <priority>{page.get("priority", "0.5")}</priority>')
        xml_lines.append('  </url>')
    xml_lines.append('</urlset>')

    return Response('\n'.join(xml_lines), mimetype='application/xml')
