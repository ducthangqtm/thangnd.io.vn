import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'thang-nd-2026-security-key'
    # Sếp có thể đổi secret key này cho bảo mật hơn