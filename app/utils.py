import unicodedata
import re
import os
from flask import current_app as app

def slugify(text):
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)

def delete_image_files(content):
    """Tìm và xóa các file ảnh vật lý có trong nội dung bài viết"""
    images = re.findall(r'src="([^"]+)"', content)
    for img_url in images:
        if '/static/uploads/' in img_url:
            filename = img_url.split('/')[-1]
            file_path = os.path.join(app.root_path, 'static', 'uploads', filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Lỗi xóa file: {e}")

import time

# Simple in-memory cache store
_cache = {}

def get_cached_data(key, fetch_func, expiry_seconds=60):
    """
    Simple in-memory cache to store API responses.
    """
    now = time.time()
    if key in _cache:
        data, timestamp = _cache[key]
        if now - timestamp < expiry_seconds:
            return data
            
    # Fetch fresh data
    data = fetch_func()
    _cache[key] = (data, now)
    return data

