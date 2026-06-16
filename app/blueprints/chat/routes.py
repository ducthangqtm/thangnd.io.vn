import requests
from flask import request, jsonify, current_app as app
from app import db
from app.models import ChatSession, ChatMessage
from . import chat_bp

def send_telegram_message(token, chat_id, text):
    """Gửi tin nhắn tới Telegram và trả về message_id"""
    if not token or not chat_id:
        return None
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        res_json = response.json()
        if res_json.get("ok"):
            return res_json["result"]["message_id"]
    except Exception as e:
        print(f"Lỗi gửi tin nhắn Telegram: {e}")
    return None

@chat_bp.route('/chat/send', methods=['POST'])
def send_message():
    data = request.get_json() or {}
    session_id = data.get('session_id')
    message_text = data.get('message')
    visitor_name = data.get('visitor_name') or 'Khách ẩn danh'

    if not session_id or not message_text:
        return jsonify({"error": "Thiếu dữ liệu"}), 400

    # Lấy hoặc tạo Chat Session
    session = ChatSession.query.filter_by(session_id=session_id).first()
    if not session:
        session = ChatSession(session_id=session_id, visitor_name=visitor_name)
        db.session.add(session)
        db.session.commit()

    # Tạo tin nhắn mới của Khách
    new_msg = ChatMessage(session_id=session_id, sender='visitor', message=message_text)
    db.session.add(new_msg)
    db.session.commit()

    # Gửi tới Telegram
    token = app.config.get('TELEGRAM_BOT_TOKEN')
    chat_id = app.config.get('TELEGRAM_ADMIN_CHAT_ID')
    
    if token and chat_id:
        tg_text = (
            f"<b>💬 Tin nhắn mới từ website</b>\n"
            f"👤 <b>Khách:</b> {visitor_name}\n"
            f"🔑 <b>Session:</b> <code>{session_id}</code>\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"{message_text}\n\n"
            f"👉 <i>Hãy dùng tính năng Reply tin nhắn này để trả lời!</i>"
        )
        msg_id = send_telegram_message(token, chat_id, tg_text)
        if msg_id:
            new_msg.telegram_message_id = msg_id
            db.session.commit()

    return jsonify({"success": True, "message": "Đã gửi tin nhắn"})

@chat_bp.route('/chat/history', methods=['GET'])
def get_history():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({"error": "Thiếu session_id"}), 400

    messages = ChatMessage.query.filter_by(session_id=session_id).order_by(ChatMessage.timestamp.asc()).all()
    history = []
    for msg in messages:
        history.append({
            "sender": msg.sender,
            "message": msg.message,
            "timestamp": msg.timestamp.strftime("%H:%M - %d/%m/%Y")
        })
    return jsonify({"history": history})

@chat_bp.route('/chat/telegram/webhook', methods=['POST'])
def telegram_webhook():
    data = request.get_json() or {}
    message = data.get('message')
    
    if not message:
        return jsonify({"status": "ignored"}), 200

    # Kiểm tra xem có phải tin nhắn reply từ Admin không
    reply_to_message = message.get('reply_to_message')
    from_user = message.get('from', {})
    chat_id = str(message.get('chat', {}).get('id'))
    admin_chat_id = str(app.config.get('TELEGRAM_ADMIN_CHAT_ID'))

    # Chỉ nhận tin nhắn từ Chat ID của Admin để bảo mật
    if chat_id != admin_chat_id:
        return jsonify({"error": "Unauthorized"}), 403

    reply_text = message.get('text')
    if reply_to_message and reply_text:
        orig_msg_id = reply_to_message.get('message_id')
        
        # Tìm tin nhắn gốc để biết gửi cho session_id nào
        orig_msg = ChatMessage.query.filter_by(telegram_message_id=orig_msg_id).first()
        if orig_msg:
            # Lưu tin nhắn trả lời của Admin
            admin_msg = ChatMessage(
                session_id=orig_msg.session_id,
                sender='admin',
                message=reply_text
            )
            db.session.add(admin_msg)
            db.session.commit()
            return jsonify({"status": "success", "session_id": orig_msg.session_id})
        
    return jsonify({"status": "no_match"}), 200
