function toggleForm(formType) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'none';
    
    if (formType === 'forgot') {
        const step1 = document.getElementById('forgotStep1');
        const step2 = document.getElementById('forgotStep2');
        if (step1) step1.style.display = 'block';
        if (step2) step2.style.display = 'none';
        
        const subtitle = document.getElementById('forgotSubtitle');
        if (subtitle) subtitle.textContent = 'Nhập tên đăng nhập để tiếp tục';
        
        const uname = document.getElementById('forgotUsername');
        const pwd = document.getElementById('forgotNewPassword');
        if (uname) uname.value = '';
        if (pwd) pwd.value = '';
        
        const success = document.getElementById('forgotSuccess');
        if (success) success.style.display = 'none';
        hideError('forgot');
    }
    
    if (document.getElementById(`${formType}Form`)) {
        document.getElementById(`${formType}Form`).style.display = 'block';
    }
}

function showError(formType, message) {
    const errorEl = document.getElementById(`${formType}Error`);
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function hideError(formType) {
    document.getElementById(`${formType}Error`).style.display = 'none';
}

async function login() {
    hideError('login');
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    
    if (!usernameInput.value || !passwordInput.value) {
        return showError('login', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            window.location.href = '/';
        } else {
            showError('login', data.error || 'Đăng nhập thất bại');
        }
    } catch (error) {
        showError('login', 'Lỗi kết nối đến máy chủ');
    }
}

async function register() {
    hideError('register');
    const nameInput = document.getElementById('regName');
    const usernameInput = document.getElementById('regUsername');
    const passwordInput = document.getElementById('regPassword');
    
    if (!nameInput.value || !usernameInput.value || !passwordInput.value) {
        return showError('register', 'Vui lòng nhập đầy đủ thông tin');
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: nameInput.value,
                username: usernameInput.value,
                password: passwordInput.value
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            window.location.href = '/';
        } else {
            showError('register', data.error || 'Đăng ký thất bại');
        }
    } catch (error) {
        showError('register', 'Lỗi kết nối đến máy chủ');
    }
}

async function verifyForgotUsername() {
    hideError('forgot');
    const usernameInput = document.getElementById('forgotUsername');
    if (!usernameInput.value) {
        return showError('forgot', 'Vui lòng nhập tên đăng nhập');
    }

    try {
        const response = await fetch('/api/auth/check-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput.value })
        });

        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('forgotStep1').style.display = 'none';
            document.getElementById('forgotStep2').style.display = 'block';
            document.getElementById('forgotSubtitle').textContent = 'Nhập mật khẩu mới cho tài khoản ' + usernameInput.value;
        } else {
            showError('forgot', data.error || 'Tên đăng nhập không tồn tại');
        }
    } catch (error) {
        showError('forgot', 'Lỗi kết nối đến máy chủ');
    }
}

async function resetPassword() {
    hideError('forgot');
    document.getElementById('forgotSuccess').style.display = 'none';
    const usernameInput = document.getElementById('forgotUsername');
    const newPasswordInput = document.getElementById('forgotNewPassword');
    
    if (!usernameInput.value || !newPasswordInput.value) {
        return showError('forgot', 'Vui lòng nhập đầy đủ thông tin');
    }

    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameInput.value,
                new_password: newPasswordInput.value
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('forgotSuccess').textContent = 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.';
            document.getElementById('forgotSuccess').style.display = 'block';
            usernameInput.value = '';
            newPasswordInput.value = '';
            setTimeout(() => toggleForm('login'), 2000);
        } else {
            showError('forgot', data.error || 'Đặt lại mật khẩu thất bại');
        }
    } catch (error) {
        showError('forgot', 'Lỗi kết nối đến máy chủ');
    }
}

// Support Enter key
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (document.getElementById('loginForm').style.display !== 'none') {
            login();
        } else if (document.getElementById('registerForm').style.display !== 'none') {
            register();
        } else if (document.getElementById('forgotForm').style.display !== 'none') {
            if (document.getElementById('forgotStep1').style.display !== 'none') {
                verifyForgotUsername();
            } else {
                resetPassword();
            }
        }
    }
});
