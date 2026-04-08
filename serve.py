from app import create_app

# Khởi tạo ứng dụng
app = create_app()

if __name__ == '__main__':
    # Chạy thẳng với cấu hình cơ bản nhất
    # Host 0.0.0.0 để Sếp check được bằng điện thoại trong cùng mạng LAN
    app.run(host='0.0.0.0', port=5000, debug=True)