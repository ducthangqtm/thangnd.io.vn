from flask import Flask, request, jsonify, Response, session
import requests
import os

app = Flask(__name__)
app.secret_key = 'thangnd-secret-key' # Phải có cái này để dùng session

# 1. Khớp thông số từ file cấu hình OpenClaw của Sếp
OPENCLAW_URL = 'http://127.0.0.1:18789'
OPENCLAW_TOKEN = '3a65af5e56fe234825f6354c2db4fa130eaa2523dcc96c7d'

@app.route('/api/chat', methods=['POST'])
def chat():
    # Kiểm tra đăng nhập (để bảo vệ bot của Sếp)
    if not session.get('logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    headers = {
        'Authorization': f'Bearer {OPENCLAW_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    # 2. Quan trọng: Sửa model thành đúng con đang chạy trong OpenClaw Control
    payload = {
        "model": "openrouter/stepfun/step-3.5-flash:free", 
        "messages": data.get('messages', []),
        "stream": data.get('stream', False)
    }
    
    try:
        if payload['stream']:
            resp = requests.post(
                f'{OPENCLAW_URL}/v1/chat/completions',
                headers=headers,
                json=payload,
                stream=True,
                timeout=30 # Tránh treo server
            )
            
            def generate():
                for line in resp.iter_lines():
                    if line:
                        yield line.decode('utf-8') + '\n'
            
            return Response(generate(), content_type='text/event-stream')
        else:
            resp = requests.post(
                f'{OPENCLAW_URL}/v1/chat/completions',
                headers=headers,
                json=payload,
                timeout=30
            )
            return jsonify(resp.json())
            
    except Exception as e:
        return jsonify({'error': f'Lỗi kết nối OpenClaw: {str(e)}'}), 500

if __name__ == '__main__':
    # Cho phép máy khác trong LAN truy cập vào IP 192.168.1.6 của Sếp
    app.run(host='0.0.0.0', port=5000, debug=True)