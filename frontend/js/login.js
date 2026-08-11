function toggleForm(formType) {
    if (formType === 'register') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
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

// Support Enter key
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (document.getElementById('loginForm').style.display !== 'none') {
            login();
        } else {
            register();
        }
    }
});
