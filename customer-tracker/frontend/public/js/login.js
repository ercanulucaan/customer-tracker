document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const twoFactorForm = document.getElementById('twoFactorForm');
    const twoFactorContainer = document.getElementById('twoFactorContainer');
    let tempToken = null;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.requiresTwoFactor) {
                    // 2FA gerekiyorsa geçici token'ı sakla ve 2FA formunu göster
                    tempToken = data.tempToken;
                    loginForm.classList.add('d-none');
                    twoFactorContainer.classList.remove('d-none');
                } else {
                    // 2FA gerekmiyorsa direkt giriş yap
                    localStorage.setItem('token', data.token);
                    window.location.href = '/dashboard';
                }
            } else {
                alert(data.message || 'Giriş başarısız');
            }
        } catch (error) {
            console.error('Giriş hatası:', error);
            alert('Bir hata oluştu');
        }
    });

    twoFactorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('twoFactorCode').value;

        try {
            const response = await fetch('/api/auth/verify-2fa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tempToken, code })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = '/dashboard';
            } else {
                alert(data.message || 'Doğrulama başarısız');
            }
        } catch (error) {
            console.error('2FA doğrulama hatası:', error);
            alert('Bir hata oluştu');
        }
    });
}); 