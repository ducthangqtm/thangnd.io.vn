from google import genai
from app import create_app, db
from app.models import Post
import re
import unicodedata

# 1. Cấu hình API Key của anh
client = genai.Client(api_key="AIzaSyCAeoqV5aYtbaU9qXuKhpjBy_7rh3Wq-o0")

def slugify(text):
    """Hàm tạo đường dẫn không dấu cho bài viết"""
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)

def generate_blog_post():
    app = create_app()
    with app.app_context():
        print("🤖 AI đang suy nghĩ nội dung (phiên bản 2026)...")
        
        prompt = """
        Viết một bài blog kỹ thuật ngắn gọn dành cho IT Network.
        Chủ đề: 'Cách Python Automation thay đổi công việc của Network Engineer năm 2026'.
        Yêu cầu định dạng CHÍNH XÁC:
        TITLE: [Tiêu đề]
        CONTENT: [Nội dung bằng HTML, dùng thẻ <p>, <ul>, <li>, <strong>]
        """
        
        try:
            # Sửa tên model thành 'gemini-2.0-flash' - bản ổn định nhất hiện tại
            response = client.models.generate_content(
                model="gemini-2.0-flash", 
                contents=prompt
            )
            text = response.text

            title_match = re.search(r"TITLE:(.*)", text)
            content_match = re.search(r"CONTENT:([\s\S]*)", text)

            if title_match and content_match:
                title = title_match.group(1).strip()
                content = content_match.group(1).strip()
                slug = slugify(title)

                if not Post.query.filter_by(slug=slug).first():
                    new_post = Post(
                        title=title,
                        content=content,
                        author="Gemini AI Blogger",
                        slug=slug
                    )
                    db.session.add(new_post)
                    db.session.commit()
                    print(f"✅ Đã đăng bài: {title}")
                else:
                    print("⚠️ Bài này đã tồn tại.")
            else:
                print("❌ AI trả về sai định dạng. Thử lại phát nữa xem sao anh.")
                
        except Exception as e:
            # Nếu 2.0 vẫn lỗi, ta sẽ thử 'gemini-1.5-flash-latest'
            print(f"❌ Lỗi: {str(e)}")
            print("💡 Đang thử lại với model backup...")
            try:
                response = client.models.generate_content(model="gemini-1.5-flash-latest", contents=prompt)
                # ... (phần code xử lý bên dưới giữ nguyên nếu anh muốn viết thêm cơ chế retry)
            except:
                pass

if __name__ == "__main__":
    generate_blog_post()