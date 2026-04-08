from flask import render_template
from flask import current_app as app

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