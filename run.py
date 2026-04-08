from app import create_app

app = create_app()

if __name__ == '__main__':
    # Sếp để 0.0.0.0 để truy cập được từ IP 192.168.1.6
    app.run(host='0.0.0.0', port=5000, debug=True)