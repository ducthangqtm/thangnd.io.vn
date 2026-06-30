import getpass
from werkzeug.security import generate_password_hash
from app import create_app, db
from app.models import User

def create_super_admin():
    app = create_app()
    with app.app_context():
        # Thông tin Admin gốc
        username = "thangnd"

        user = User.query.filter_by(username=username).first()
        if not user:
            password = getpass.getpass("Mat khau cho Super Admin moi: ")
            admin = User(
                username=username,
                password=generate_password_hash(password),
                name="Nguyễn Đức Thắng",
                role="admin" # Gán quyền Admin tối cao
            )
            db.session.add(admin)
            db.session.commit()
            print("[+] Da tao Super Admin thangnd thanh cong!")
        else:
            user.role = "admin" # Update quyền nếu user đã tồn tại
            db.session.commit()
            print("[!] Da cap nhat quyen Admin cho thangnd.")

if __name__ == "__main__":
    create_super_admin()