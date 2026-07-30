# Expense Manager

Project quản lý chi tiêu cá nhân đơn giản, sử dụng Flask cho backend và Vanilla JS (HTML/CSS/JS thuần) cho frontend. Có hỗ trợ PWA để cài đặt như app trên điện thoại.

## Tính năng chính
- Ghi chép thu chi hàng ngày
- Quản lý nhiều ví (tiền mặt, tài khoản ngân hàng)
- Đặt mục tiêu tiết kiệm
- Biểu đồ thống kê cơ bản
- Chạy offline được (nhờ Service Worker / PWA)

## Cấu trúc thư mục

```text
expense-manager/
├── backend/
│   ├── database.py         # Khởi tạo và tương tác với SQLite
│   ├── server.py           # Chứa các API endpoint (Flask)
│   └── requirements.txt    # Danh sách thư viện Python
│
├── frontend/
│   ├── css/                # Style giao diện
│   ├── js/                 # Logic gọi API và xử lý giao diện
│   ├── icons/              # Icon cho PWA
│   ├── index.html          # File giao diện chính
│   ├── manifest.json       # Config PWA
│   └── sw.js               # Service worker (cache file)
└── .gitignore
```

## Hướng dẫn chạy thử

Để chạy project này, bạn cần chạy song song cả backend và frontend.

### 1. Chạy Backend (API)
Yêu cầu: Máy đã cài sẵn Python.

```bash
cd backend
pip install -r requirements.txt
python server.py
```
> Mặc định API sẽ chạy ở `http://localhost:5000`.

### 2. Chạy Frontend
Bạn dùng VSCode, cài extension **Live Server**. Sau đó click chuột phải vào file `frontend/index.html` và chọn "Open with Live Server".
Giao diện web sẽ tự động mở lên trên trình duyệt.

---
**Lưu ý:** Database SQLite (`expense_manager.db`) sẽ tự động được tạo trong thư mục `backend/` trong lần đầu chạy server.
