from flask import render_template, request, redirect, url_for, session, jsonify, Response, current_app as app
import requests

# Cấu hình OpenClaw
OPENCLAW_URL = 'http://127.0.0.1:18789'
OPENCLAW_TOKEN = '3a65af5e56fe234825f6354c2db4fa130eaa2523dcc96c7d'

@app.route('/')
def index():
    skills = ['Network Infrastructure', 'Python/Flask', 'AI Automation', 'Nginx/IIS']
    return render_template('index.html', title='Nguyễn Đức Thắng', skills=skills)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.form.get('username') == 'thangnd' and request.form.get('password') == 'Ducthang@92':
            session['logged_in'] = True
            return redirect(url_for('index'))
        return render_template('login.html', error="Sai tài khoản hoặc mật khẩu")
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

# Endpoint gọi từ JavaScript trên Web
@app.route('/chat_tt', methods=['POST'])
def chat():
    if not session.get('logged_in'):
        return jsonify({'reply': 'Sếp đăng nhập đã nhé!'}), 401

    user_msg = request.json.get('msg')
    
    headers = {
        'Authorization': f'Bearer {OPENCLAW_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        "model": "openrouter/stepfun/step-3.5-flash:free", 
        "messages": [{"role": "user", "content": user_msg}],
        "stream": False
    }
    
    try:
        resp = requests.post(f'{OPENCLAW_URL}/v1/chat/completions', headers=headers, json=payload, timeout=30)
        result = resp.json()
        # Trả về đúng định dạng mà JavaScript đang chờ (data.reply)
        reply = result['choices'][0]['message']['content']
        return jsonify({'reply': reply})
    except Exception as e:
        return jsonify({'reply': f'Lỗi kết nối OpenClaw: {str(e)}'})