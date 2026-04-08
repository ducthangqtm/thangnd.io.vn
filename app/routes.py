from flask import render_template
from flask import current_app as app
from flask import send_from_directory

@app.route('/')
def index():
    # Sếp có thể thay đổi link MXH ở đây nếu muốn
    social_links = {
        "facebook": "https://www.facebook.com/ducthangqtm",
        "zalo": "https://zalo.me/0986192092", # Thay số điện thoại Sếp vào
        "x": "https://x.com/ducthangqtm",
        "github": "https://github.com/ducthangqtm",
    }
    return render_template('index.html', social=social_links)

@app.route('/google954f6558285dd27a.html') # Thay bằng tên file thực tế của Sếp
def google_verify():
    return send_from_directory('static', 'google954f6558285dd27a.html')