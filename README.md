# 💰 Quản lý Tài chính (Expense Manager)

Dự án ứng dụng Quản lý Tài chính cá nhân đa nền tảng, thiết kế hiện đại và hỗ trợ đa người dùng (Multi-user). Ứng dụng được xây dựng với kiến trúc Client-Server, sử dụng **Flask (Python)** làm Backend và **Vanilla JS/HTML/CSS** làm Frontend. Dự án được cấu hình PWA để cài đặt như một ứng dụng độc lập trên điện thoại và đã sẵn sàng triển khai lên môi trường Đám mây (Fly.io).

👉 **[TRẢI NGHIỆM NGAY TẠI ĐÂY](https://quanlytaichinh.fly.dev/)** 👈

> **⚠️ LƯU Ý QUAN TRỌNG:** Ứng dụng này là một công cụ hỗ trợ ghi chép. Hệ thống **KHÔNG** kết nối với tài khoản ngân hàng thực tế hay lấy tiền của bạn. Toàn bộ số tiền (số dư ví, thu/chi) đều do **bạn tự nhập tay** để tự quản lý cá nhân.

---

## 🌟 Tính năng Nổi bật

- **Tài khoản Đa người dùng (Multi-user):** Tính năng Đăng ký, Đăng nhập an toàn với mã hóa mật khẩu. Mỗi người dùng có một không gian dữ liệu tách biệt hoàn toàn.
- **Giao diện Hiện đại (Modern UI):** Hỗ trợ tính năng thay đổi giao diện Sáng/Tối (Dark/Light mode) tích hợp với thiết kế bóng bẩy, thẻ gradient.
- **Quản lý Thu Chi:** Ghi chép, theo dõi và phân loại các giao dịch (Thu nhập / Chi tiêu) một cách nhanh chóng.
- **Quản lý Đa Ví:** Tạo và quản lý tiền từ nhiều nguồn khác nhau (Tiền mặt, Tài khoản Ngân hàng, Ví tiết kiệm...). Hỗ trợ tính năng rút tiền / chuyển tiền nội bộ.
- **Mục tiêu Tiết kiệm:** Lập các mục tiêu tài chính, theo dõi tiến độ tích lũy trực quan.
- **Thống kê Trực quan:** Biểu đồ hình vòng (Donut Chart) và biểu đồ cột (Bar Chart) mô phỏng dòng tiền theo tháng.
- **Quản lý Dữ liệu Cá nhân:** Khả năng sao lưu/nhập dữ liệu (Export/Import JSON) và tính năng Xóa Vĩnh Viễn tài khoản cùng toàn bộ dữ liệu.
- **Hỗ trợ Ứng dụng PWA:** Cài đặt trực tiếp lên màn hình chính của điện thoại (iOS/Android) mà không cần qua App Store/Google Play. Hoạt động mượt mà như native app.

---

## 📂 Cấu trúc Thư mục

```text
expense-manager/
├── backend/
│   ├── database.py         # Xử lý logic SQLite, Migration và quản lý dữ liệu người dùng
│   ├── server.py           # REST API endpoints (Flask), xác thực Session
│   └── requirements.txt    # Danh sách thư viện Python (Flask, Werkzeug...)
│
├── frontend/
│   ├── css/                # Hệ thống Design System (components.css, index.css, animations.css)
│   ├── js/                 # Logic giao diện theo từng trang (app.js, login.js, wallets.js...)
│   ├── icons/              # Cụm icon cho PWA
│   ├── login.html          # Trang Đăng nhập / Đăng ký
│   ├── index.html          # Trang chính của ứng dụng
│   ├── manifest.json       # Cấu hình cài đặt PWA
│   └── sw.js               # Service Worker để cache dữ liệu và hỗ trợ offline
│
├── Dockerfile              # Cấu hình containerization để deploy
└── fly.toml                # Cấu hình triển khai hệ thống lên Fly.io
```

---

## 🚀 Hướng dẫn Triển khai & Chạy thử

Dự án hiện tại được gom (bundle) frontend vào backend, do đó Flask sẽ đóng vai trò serve cả API lẫn các file tĩnh (HTML, CSS, JS).

### 1. Chạy trên Môi trường Local (Máy cá nhân)

**Yêu cầu:** Máy đã cài sẵn Python 3.10+.

```bash
# 1. Cài đặt các thư viện cần thiết
cd backend
pip install -r requirements.txt

# 2. Khởi chạy máy chủ Flask
python server.py
```
> Trình duyệt tự động mở hoặc bạn có thể truy cập `http://localhost:5000`. Hệ thống sẽ tự động tạo file `expense_manager.db` trong thư mục `backend/` vào lần đầu chạy.

### 2. Triển khai lên Môi trường Đám mây (Fly.io)

Dự án đã được thiết lập sẵn sàng để đẩy lên Fly.io sử dụng Dockerfile và Persistent Volume (giữ liệu an toàn không bị mất khi khởi động lại).

```bash
# 1. Triển khai ứng dụng (sẽ tự build Docker image và đẩy lên cloud)
fly deploy

# 2. Kiểm tra log nếu có lỗi
fly logs
```

**Cấu hình Database trên Cloud:** 
Trong file `fly.toml`, cơ sở dữ liệu đã được cấu hình lưu vào Persistent Volume có tên là `sqlite_data` (mount tại thư mục `/data`). Mọi dữ liệu người dùng sẽ được lưu trữ an toàn.

---

## ⚙️ Công nghệ Sử dụng

- **Backend:** Python 3, Flask, Werkzeug, SQLite3.
- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Chart.js (để vẽ biểu đồ).
- **Deployment:** Docker, Gunicorn, Fly.io Cloud Platform.

---

## ©️ Bản quyền

© 2026 Bản quyền thuộc về **Thuysmao**. Mọi quyền được bảo lưu.
