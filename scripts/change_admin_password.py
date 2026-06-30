import getpass
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from werkzeug.security import generate_password_hash
from app import create_app, db
from app.models import User

def change_password():
    username = input("Username can doi mat khau: ").strip()
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if not user:
            print(f"[!] Khong tim thay user '{username}'.")
            return

        password = getpass.getpass("Mat khau moi: ")
        confirm = getpass.getpass("Nhap lai mat khau moi: ")
        if password != confirm:
            print("[!] Mat khau nhap lai khong khop. Huy thao tac.")
            return
        if len(password) < 8:
            print("[!] Mat khau qua ngan (toi thieu 8 ky tu). Huy thao tac.")
            return

        user.password = generate_password_hash(password)
        db.session.commit()
        print(f"[+] Da doi mat khau cho user '{username}' thanh cong.")

if __name__ == "__main__":
    change_password()