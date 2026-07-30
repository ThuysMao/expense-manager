# 💰 Expense Manager

Một ứng dụng web quản lý chi tiêu cá nhân hiện đại, giúp bạn theo dõi dòng tiền, quản lý nhiều ví, đặt mục tiêu tài chính và xem báo cáo trực quan.

![Expense Manager Banner](https://via.placeholder.com/1200x400/282c34/ffffff?text=Expense+Manager+-+Quản+Lý+Chi+Tiêu+Thông+Minh)

## ✨ Tính Năng Nổi Bật

- **Quản lý Thu / Chi:** Dễ dàng ghi chép các khoản thu nhập và chi tiêu hằng ngày.
- **Đa Ví (Multi-wallets):** Theo dõi số dư trên nhiều nguồn tiền khác nhau (Tiền mặt, Ngân hàng, Ví điện tử,...).
- **Mục Tiêu Tài Chính:** Thiết lập và theo dõi tiến độ các mục tiêu tiết kiệm.
- **Thống Kê Trực Quan:** Báo cáo dưới dạng biểu đồ giúp bạn có cái nhìn tổng quan về tình hình tài chính.
- **Responsive Design:** Giao diện tối ưu cho mọi thiết bị (Mobile, Tablet, Desktop).
- **Hỗ trợ PWA:** Có thể cài đặt trực tiếp vào điện thoại / máy tính như một ứng dụng native (Progressive Web App).

## 🛠 Công Nghệ Sử Dụng

**Frontend:**
- HTML5, CSS3 (Vanilla)
- JavaScript (ES6+)
- Service Workers (dành cho PWA)

**Backend:**
- Python 3.x
- [Flask](https://flask.palletsprojects.com/) (Web Framework)
- SQLite (Cơ sở dữ liệu)

## 🚀 Hướng Dẫn Cài Đặt (Local Development)

Làm theo các bước sau để chạy dự án trên máy tính của bạn:

### 1. Yêu Cầu Cấu Hình
- Cài đặt Python (phiên bản 3.8 trở lên)
- Một extension chạy Local Server (Ví dụ: Live Server trên VSCode)

### 2. Cài Đặt Backend
Mở terminal, di chuyển vào thư mục dự án và chạy các lệnh sau:

```bash
# Di chuyển vào thư mục backend
cd backend

# (Tuỳ chọn) Tạo môi trường ảo
python -m venv venv
# Kích hoạt venv trên Windows:
venv\Scripts\activate

# Cài đặt các thư viện cần thiết
pip install -r requirements.txt

# Khởi chạy server API (Mặc định chạy ở cổng 5000)
python server.py
```

### 3. Khởi Chạy Frontend
Bạn chỉ cần mở dự án trên VSCode, sau đó sử dụng extension **Live Server** để mở file `frontend/index.html`.
*Lưu ý: Đảm bảo Backend Server đang chạy song song để Frontend có thể gọi dữ liệu từ API.*

## 🤝 Đóng Góp

Chào mừng mọi đóng góp từ cộng đồng! Bạn có thể:
1. Fork dự án
2. Tạo một branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push branch lên (`git push origin feature/AmazingFeature`)
5. Mở một Pull Request

## 📄 Giấy Phép (License)

Dự án này được phân phối dưới giấy phép MIT. Xin xem file `LICENSE` để biết thêm chi tiết.

---
*Phát triển bởi [ThuysMao](https://github.com/ThuysMao)*
