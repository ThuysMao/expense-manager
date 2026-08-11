# Hướng dẫn đưa ứng dụng Expense Manager lên Cloud (PythonAnywhere)

Dự án này được viết bằng **Python (Flask)** và cơ sở dữ liệu **SQLite**. File Python đã được thiết kế sẵn để tự động phát luôn cả phần giao diện Frontend (PWA).

Điều này có nghĩa là bạn **chỉ cần đưa toàn bộ dự án này lên một dịch vụ duy nhất**. Với cấu hình này (Python + SQLite), lựa chọn hoàn hảo, miễn phí và bền vững nhất là **PythonAnywhere**. Các dịch vụ khác (như Render hay Vercel) thường sẽ tự động xóa mất file dữ liệu `.db` của bạn sau mỗi vài ngày, nhưng PythonAnywhere thì lưu trữ vĩnh viễn.

Dưới đây là 5 bước chi tiết để bạn tự đưa lên PythonAnywhere:

### Bước 1: Nén dự án và Tạo tài khoản
1. Trên máy tính của bạn, nén toàn bộ thư mục `expense-manager` (bao gồm cả thư mục `backend` và `frontend`) thành một file **.zip** (ví dụ: `expense.zip`).
2. Truy cập trang web **[pythonanywhere.com](https://www.pythonanywhere.com/)** và tạo một tài khoản miễn phí (Create a Beginner account).

### Bước 2: Tải code của bạn lên Cloud
1. Sau khi đăng nhập, chọn tab **Files** ở menu bên trên.
2. Bạn sẽ thấy một nút màu vàng ghi là **Upload a file**. Bấm vào đó và tải file `expense.zip` của bạn lên.
3. Chuyển sang tab **Consoles**, mở một cái **Bash** (cửa sổ lệnh).
4. Gõ lệnh sau để giải nén file zip của bạn: 
   ```bash
   unzip expense.zip
   ```

### Bước 3: Cài đặt thư viện (Dependencies)
Cũng trong cái màn hình Bash đó, bạn gõ lệnh này để máy chủ đám mây tải về các thư viện cần thiết:
```bash
pip3.10 install --user -r expense-manager/backend/requirements.txt
```
*(Lưu ý: Bạn có thể đổi số `3.10` thành phiên bản Python bạn chọn ở Bước 4).*

### Bước 4: Tạo Web App
1. Chuyển sang tab **Web** trên menu.
2. Bấm vào nút xanh **Add a new web app**.
3. Bỏ qua màn hình đầu tiên (bấm Next), sau đó chọn **Flask** -> Chọn **Python 3.10** (hoặc bản tương ứng).
4. Ở màn hình cấu hình đường dẫn, hệ thống sẽ gợi ý đường dẫn file. Hãy sửa lại thành: 
   `/home/TEN_TAI_KHOAN_CUA_BAN/expense-manager/backend/server.py`
   *(Đổi `TEN_TAI_KHOAN_CUA_BAN` thành tên bạn vừa đăng ký).*

### Bước 5: Chỉnh sửa file kết nối (WSGI)
1. Kéo xuống dưới trong trang cấu hình Web, bạn sẽ thấy mục **WSGI configuration file**. Bấm vào link đó để mở trình soạn thảo.
2. Xóa code cũ và dán đoạn code sau để nó trỏ đúng vào dự án của bạn:

```python
import sys
import os

# Thêm đường dẫn thư mục backend vào hệ thống
path = '/home/TEN_TAI_KHOAN_CUA_BAN/expense-manager/backend'
if path not in sys.path:
    sys.path.append(path)

# Thêm đường dẫn thư mục gốc để Flask tìm thấy frontend
root_path = '/home/TEN_TAI_KHOAN_CUA_BAN/expense-manager'
if root_path not in sys.path:
    sys.path.append(root_path)

from server import app as application  # Import app từ file server.py của bạn
```
*(Nhớ đổi `TEN_TAI_KHOAN_CUA_BAN` thành tên thật của bạn nhé).*

3. Lưu lại (nút **Save** góc trên).
4. Quay lại tab **Web** và bấm nút **Reload** màu xanh lá cây ở trên cùng.

---
**Hoàn tất! 🎉**
Bây giờ trang web của bạn đã chạy 24/24 trên địa chỉ mạng: `https://TEN_TAI_KHOAN_CUA_BAN.pythonanywhere.com`. 
Bạn có thể mở link này trên điện thoại, chọn **Add to Home Screen** và tận hưởng ứng dụng mọi lúc mọi nơi!
