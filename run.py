from app import create_app

app = create_app()

if __name__ == '__main__':
    # Chạy ở cổng 5000 để Nginx proxy vào
    app.run(host='0.0.0.0', port=5000, debug=True)