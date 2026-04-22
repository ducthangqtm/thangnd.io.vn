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
