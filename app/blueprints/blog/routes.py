from flask import render_template, request, redirect, url_for
from flask_login import login_required, current_user
from app.models import Post, Comment
from app import db
from . import blog_bp

@blog_bp.route('/blog')
def blog_list():
    query = request.args.get('q')
    if query:
        posts = Post.query.filter(
            (Post.title.contains(query)) | (Post.content.contains(query))
        ).order_by(Post.date_posted.desc()).all()
    else:
        posts = Post.query.order_by(Post.date_posted.desc()).all()
    return render_template('blog/blog.html', posts=posts, search_query=query)

@blog_bp.route('/blog/<slug>')
def blog_detail(slug):
    post = Post.query.filter_by(slug=slug).first_or_404()
    return render_template('blog/post_detail.html', post=post)

@blog_bp.route('/post/<int:post_id>/comment', methods=['POST'])
@login_required
def add_comment(post_id):
    body = request.form.get('comment_body')
    if body:
        new_comment = Comment(body=body, post_id=post_id, user_id=current_user.id)
        db.session.add(new_comment)
        db.session.commit()
    post = Post.query.get_or_404(post_id)
    return redirect(url_for('blog.blog_detail', slug=post.slug))
