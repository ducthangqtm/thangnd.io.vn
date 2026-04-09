from flask import render_template, send_from_directory
from flask import current_app as app

@app.route('/')
def index():
    # Thông tin MXH của Sếp
    social_links = {
        "facebook": "https://www.facebook.com/ducthangqtm",
        "zalo": "https://zalo.me/0986192092", 
        "x": "https://x.com/ducthangqtm",
        "github": "https://github.com/ducthangqtm",
        'discord': 'https://discord.com/users/thangqtm',
        'whatsapp': 'https://wa.me/84986192092'
    }
    return render_template('index.html', social=social_links)

@app.route('/cv')
def cv():
    # Dữ liệu Profile đã được tinh chỉnh mốc thời gian và kinh nghiệm
    profile = {
        "name": "Nguyễn Đức Thắng",
        "title": "Senior IT Network Engineer",
        "phone": "0986.192.092",
        "email": "ducthangqtm@gmail.com",
        "address": "Số 12, Thịnh Liên. Phù Đổng, Hà Nội",
        "education": [
            {"school": "Đại học Điện Lực", "major": "Công nghệ thông tin"},
            {"school": "Bách Khoa - Aptech", "major": "Quản trị mạng và bảo mật hệ thống HDSM"}
        ],
        "experience": [
            {
                "company": "Behn Meyer Việt Nam - Chi nhánh Bắc Ninh",
                "time": "04/2025 - Hiện tại",
                "role": "IT Network Engineer",
                "tasks": [
                    "Quản trị toàn bộ hạ tầng mạng và hệ thống CNTT tại chi nhánh Bắc Ninh.",
                    "Đảm bảo sự vận hành ổn định cho hệ thống LAN/WAN, Wifi và các thiết bị ngoại vi.",
                    "Hỗ trợ người dùng cuối (End-user support) và quản trị hệ thống phần cứng/phần mềm doanh nghiệp.",
                    "Ứng dụng Python/Flask xây dựng hệ thống tự động hóa đơn hàng tối ưu quy trình phối hợp vận chuyển."
                ]
            },
            {
                "company": "DB Schenker Việt Nam",
                "time": "10/2016 - 03/2025",
                "role": "IT Network Engineer",
                "tasks": [
                    "Thiết kế và triển khai hạ tầng mạng cho hệ thống kho vận quy mô lớn (30,000 - 40,000 m2).",
                    "Quản lý hơn 500 thiết bị IT, vận hành hệ thống Server, LAN, Vlans, Wifi công nghiệp.",
                    "Quản trị Azure Domain, Office 365 và hỗ trợ kỹ thuật cho các hệ thống ERP (WMS, SAP).",
                   
                ]
            },
            {
                "company": "Srithai Hà Nội",
                "time": "11/2015 - 08/2016",
                "role": "IT Support Engineer",
                "tasks": [
                    "Xây dựng hạ tầng mạng nội bộ, hệ thống Camera giám sát và mạng điện thoại công ty.",
                    "Quản trị người dùng và hỗ trợ kỹ thuật phần mềm ERP Microsoft Dynamics AX."
                ]
            }
        ],
        "skills": ["Python (Flask)", "Network Design", "Azure/O365", "Cisco/Juniper Swtich", "Automation Marketing/Scripts"]
    }
    return render_template('cv.html', p=profile)

@app.route('/google954f6558285dd27a.html')
def google_verify():
    return send_from_directory('static', 'google954f6558285dd27a.html')