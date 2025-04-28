const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Giriş
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
        }

        // 2FA aktif değilse direkt giriş yap
        if (!user.twoFactorEnabled) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
            return res.json({ token });
        }

        // 2FA aktifse geçici token oluştur
        const tempToken = jwt.sign(
            { id: user._id, temp: true },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        res.json({ tempToken, requiresTwoFactor: true });
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ message: 'Giriş yapılırken bir hata oluştu' });
    }
});

// 2FA doğrulama
router.post('/verify-2fa', async (req, res) => {
    try {
        const { tempToken, code } = req.body;

        // Geçici token'ı doğrula
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (!decoded.temp) {
            return res.status(401).json({ message: 'Geçersiz token' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // 2FA kodunu doğrula
        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code
        });

        if (!isValid) {
            return res.status(401).json({ message: 'Geçersiz doğrulama kodu' });
        }

        // Kalıcı token oluştur
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });
    } catch (error) {
        console.error('2FA doğrulama hatası:', error);
        res.status(500).json({ message: 'Doğrulama yapılırken bir hata oluştu' });
    }
});

// 2FA kurulumu
router.post('/setup-2fa', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(401).json({ message: 'Token gerekli' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Yeni 2FA secret oluştur
        const secret = speakeasy.generateSecret({
            name: `Müşteri Takip:${user.username}`
        });

        // QR kod oluştur
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        // Secret'ı geçici olarak sakla
        user.twoFactorSecret = secret.base32;
        await user.save();

        res.json({ secret: secret.base32, qrCode });
    } catch (error) {
        console.error('2FA kurulum hatası:', error);
        res.status(500).json({ message: '2FA kurulumu yapılırken bir hata oluştu' });
    }
});

// 2FA aktivasyonu
router.post('/enable-2fa', async (req, res) => {
    try {
        const { token, code } = req.body;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Kodu doğrula
        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code
        });

        if (!isValid) {
            return res.status(401).json({ message: 'Geçersiz doğrulama kodu' });
        }

        // 2FA'yı aktifleştir
        user.twoFactorEnabled = true;
        await user.save();

        res.json({ message: '2FA başarıyla aktifleştirildi' });
    } catch (error) {
        console.error('2FA aktivasyon hatası:', error);
        res.status(500).json({ message: '2FA aktivasyonu yapılırken bir hata oluştu' });
    }
});

// 2FA devre dışı bırakma
router.post('/disable-2fa', async (req, res) => {
    try {
        const { token, code } = req.body;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Kodu doğrula
        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code
        });

        if (!isValid) {
            return res.status(401).json({ message: 'Geçersiz doğrulama kodu' });
        }

        // 2FA'yı devre dışı bırak
        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        await user.save();

        res.json({ message: '2FA başarıyla devre dışı bırakıldı' });
    } catch (error) {
        console.error('2FA devre dışı bırakma hatası:', error);
        res.status(500).json({ message: '2FA devre dışı bırakılırken bir hata oluştu' });
    }
});

// Get 2FA Status
router.get('/2fa-status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ enabled: user.twoFactorEnabled });
    } catch (error) {
        console.error('2FA status check error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router; 