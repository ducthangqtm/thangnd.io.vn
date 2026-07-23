import os
import requests
from flask import jsonify, render_template
from . import wc2026_bp

STAGE_NAMES = {
    "group-stage": "Vòng bảng",
    "round-of-32": "Vòng 32",
    "round-of-16": "Vòng 1/16",
    "quarterfinals": "Tứ Kết",
    "semifinals": "Bán Kết",
    "3rd-place-match": "Tranh Hạng 3",
    "final": "Chung Kết"
}

@wc2026_bp.route('/')
def index():
    return render_template("wc2026/index.html")

import json
from flask import current_app as app

@wc2026_bp.route('/api/data', methods=['GET'])
def api_get_data():
    """
    Loads static World Cup 2026 scores from the local JSON file.
    """
    json_path = os.path.join(app.root_path, 'blueprints', 'wc2026', 'data', 'wc2026_data.json')
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"matches": [], "error": f"Lỗi đọc dữ liệu tĩnh: {str(e)}"})
