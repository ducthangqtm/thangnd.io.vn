from flask import Flask

def create_app():
    app = Flask(__name__)
    app.secret_key = 'thangnd_secret_key' # Giữ lại để Flask chạy ổn định

    with app.app_context():
        from . import routes
    
    return app