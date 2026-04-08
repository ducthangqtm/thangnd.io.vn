from waitress import serve
from app import create_app
import logging
import socket

# 1. Thiết lập Log
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('waitress')

app = create_app()

def get_ip_address():
    """Tự động lấy IP nội bộ của máy đang chạy"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Không cần kết nối thật, chỉ để dò IP local
        s.connect(('8.8.8.8', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

if __name__ == '__main__':
    local_ip = get_ip_address()
    port = 5000
    
    print("="*50)
    print(f"🚀 THANGND.IO.VN - CHẾ ĐỘ PRODUCTION")
    print(f"📍 Local Access:  http://127.0.0.1:{port}")
    print(f"🌐 Network Access: http://{local_ip}:{port}")
    print("="*50)
    
    # host='0.0.0.0' giúp lắng nghe cả localhost và IP mạng (LAN/Internet)
    serve(app, host='0.0.0.0', port=port, threads=6)