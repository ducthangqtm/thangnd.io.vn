import requests
from flask import render_template, request, redirect, url_for, session, jsonify, current_app as app

# --- CẤU HÌNH OPENCLAW NỘI BỘ ---
# Vì chạy chung trên server nên dùng localhost/127.0.0.1 là nhanh nhất
OPENCLAW_API_URL = "http://127.0.0.1:18789" 
OPENCLAW_TOKEN = "3a65af5e56fe234825f6354c2db4fa130eaa2523dcc96c7d"

@app.route('/')
def index():
    skills = ['Network Infrastructure', 'Python/Flask', 'AI Automation', 'Nginx/IIS']
    return render_template('index.html', 
                           title='Nguyễn Đức Thắng | Portfolio', 
                           skills=skills)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        # Logic kiểm tra mật khẩu Sếp vừa đổi
        if username == 'thangnd' and password == 'Ducthang@92':
            session['logged_in'] = True  # Quan trọng: Lưu trạng thái đăng nhập
            return redirect(url_for('index'))
        else:
            return render_template('login.html', 
                                   title='Đăng nhập hệ thống', 
                                   error="Sai tài khoản hoặc mật khẩu")

    return render_template('login.html', title='Đăng nhập hệ thống')

@app.route('/logout')
def logout():
    session.clear() # Đăng xuất sạch sẽ
    return redirect(url_for('index'))

@app.route('/chat_tt', methods=['POST'])
def chat_with_tt():
    # Chỉ cho phép chat nếu đã đăng nhập thành công
    if not session.get('logged_in'):
        return jsonify({'reply': 'Sếp xác thực đã rồi em mới nói chuyện nhé!'}), 401

    user_msg = request.json.get('msg')
    
    headers = {
        "Authorization": f"Bearer {OPENCLAW_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "openrouter/stepfun/step-3.5-flash:free", # Model từ file JSON của Sếp
        "messages": [
            {"role": "system", "content": "Bạn là Tiểu Tuyết, trợ lý thông minh của Sếp Thắng. Hãy trả lời ngắn gọn, chuyên nghiệp."},
            {"role": "user", "content": user_msg}
        ]
    }

    try:
        # Flask gọi nội bộ sang OpenClaw Gateway
        response = requests.post(f"{OPENCLAW_API_URL}/v1/chat/completions", 
                                 json=payload, 
                                 headers=headers, 
                                 timeout=10)
        data = response.json()
        reply = data['choices'][0]['message']['content']
        return jsonify({'reply': reply})
    except Exception as e:
        return jsonify({'reply': "Dạ Sếp, em đang mất kết nối với OpenClaw Gateway rồi. Sếp kiểm tra lại Port 18789 nhé!"})