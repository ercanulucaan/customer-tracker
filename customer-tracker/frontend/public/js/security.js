document.addEventListener('DOMContentLoaded', () => {
    const token = window.TOKEN;
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const setup2FABtn = document.getElementById('setup2FA');
    const verify2FABtn = document.getElementById('verify2FA');
    const disable2FABtn = document.getElementById('disable2FA');
    const qrCodeContainer = document.getElementById('qrCode');
    const secretContainer = document.getElementById('secret');
    const verifyCodeInput = document.getElementById('verifyCode');
    const disableCodeInput = document.getElementById('disableCode');
    const setupArea = document.getElementById('setupArea');
    const disableArea = document.getElementById('disableArea');
    const twoFactorStatus = document.getElementById('twoFactorStatus');

    // 2FA durumunu kontrol et
    check2FAStatus();

    // 2FA kurulumu
    setup2FABtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/auth/setup-2fa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ token })
            });

            if (response.ok) {
                const data = await response.json();
                qrCodeContainer.innerHTML = `<img src="${data.qrCode}" alt="QR Code">`;
                secretContainer.value = data.secret;
                setupArea.classList.remove('d-none');
                setup2FABtn.disabled = true;
                verify2FABtn.disabled = false;
            } else {
                const error = await response.json();
                alert(error.message || '2FA kurulumu yapılırken bir hata oluştu');
            }
        } catch (error) {
            console.error('2FA kurulum hatası:', error);
            alert('Bir hata oluştu');
        }
    });

    // 2FA doğrulama
    verify2FABtn.addEventListener('click', async () => {
        const code = verifyCodeInput.value;
        if (!code) {
            alert('Lütfen doğrulama kodunu girin');
            return;
        }

        try {
            const response = await fetch('/api/auth/enable-2fa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ token, code })
            });

            if (response.ok) {
                alert('2FA başarıyla aktifleştirildi');
                check2FAStatus();
                setupArea.classList.add('d-none');
                setup2FABtn.disabled = true;
                verify2FABtn.disabled = true;
                disable2FABtn.classList.remove('d-none');
            } else {
                const error = await response.json();
                alert(error.message || '2FA aktivasyonu yapılırken bir hata oluştu');
            }
        } catch (error) {
            console.error('2FA aktivasyon hatası:', error);
            alert('Bir hata oluştu');
        }
    });

    // 2FA devre dışı bırakma
    disable2FABtn.addEventListener('click', async () => {
        const code = disableCodeInput.value;
        if (!code) {
            alert('Lütfen doğrulama kodunu girin');
            return;
        }

        try {
            const response = await fetch('/api/auth/disable-2fa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ token, code })
            });

            if (response.ok) {
                alert('2FA başarıyla devre dışı bırakıldı');
                check2FAStatus();
                setupArea.classList.add('d-none');
                disableArea.classList.add('d-none');
                setup2FABtn.disabled = false;
                verify2FABtn.disabled = true;
                disable2FABtn.classList.add('d-none');
                qrCodeContainer.innerHTML = '';
                secretContainer.value = '';
            } else {
                const error = await response.json();
                alert(error.message || '2FA devre dışı bırakılırken bir hata oluştu');
            }
        } catch (error) {
            console.error('2FA devre dışı bırakma hatası:', error);
            alert('Bir hata oluştu');
        }
    });

    // 2FA durumunu kontrol et
    async function check2FAStatus() {
        try {
            const response = await fetch('/api/auth/2fa-status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.enabled) {
                    twoFactorStatus.className = 'badge bg-success';
                    twoFactorStatus.textContent = 'Aktif';
                    setup2FABtn.disabled = true;
                    verify2FABtn.disabled = true;
                    disable2FABtn.classList.remove('d-none');
                    disableArea.classList.remove('d-none');
                } else {
                    twoFactorStatus.className = 'badge bg-danger';
                    twoFactorStatus.textContent = 'Devre Dışı';
                    setup2FABtn.disabled = false;
                    verify2FABtn.disabled = true;
                    disable2FABtn.classList.add('d-none');
                    disableArea.classList.add('d-none');
                }
            }
        } catch (error) {
            console.error('2FA durum kontrolü hatası:', error);
            twoFactorStatus.className = 'badge bg-danger';
            twoFactorStatus.textContent = 'Hata';
        }
    }
}); 