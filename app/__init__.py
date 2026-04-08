from flask import Flask

def create_app():
    app = Flask(__name__)
    app.secret_key = 'thangnd-secret-2026'

    with app.app_context():
        from . import routes # Dòng này sẽ nạp toàn bộ @app.route ở trên
    return app