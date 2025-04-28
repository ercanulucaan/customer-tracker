require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const axios = require('axios');

const app = express();

// View engine ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session ayarları
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 gün
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

// Routes
app.get('/', (req, res) => {
    if (req.session.token) {
        res.redirect('/customers');
    } else {
        res.render('login');
    }
});

app.get('/login', (req, res) => {
    if (req.session.token) {
        res.redirect('/customers');
    } else {
        res.render('login');
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.token) {
        res.redirect('/login');
    } else {
        res.render('dashboard', { token: req.session.token });
    }
});

app.get('/customers', (req, res) => {
    if (!req.session.token) {
        res.redirect('/login');
    } else {
        res.render('customers', { token: req.session.token });
    }
});

app.get('/reports', (req, res) => {
    if (!req.session.token) {
        res.redirect('/login');
    } else {
        res.render('reports', { token: req.session.token });
    }
});

app.get('/security', (req, res) => {
    if (!req.session.token) {
        res.redirect('/login');
    } else {
        res.render('security', { token: req.session.token });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// API isteklerini backend'e yönlendir
app.use('/api', async (req, res) => {
    try {
        console.log('API Request:', req.method, req.url);
        console.log('Session Token:', req.session.token);
        console.log('Request Body:', req.body);
        
        const response = await axios({
            method: req.method,
            url: `${process.env.BACKEND_URL}/api${req.url}`,
            data: req.body,
            headers: {
                'Authorization': req.session.token ? `Bearer ${req.session.token}` : undefined,
                'Content-Type': 'application/json',
                host: new URL(process.env.BACKEND_URL).host
            }
        });

        // Login başarılı ise token'ı session'a kaydet
        if (req.url === '/auth/login' && response.data.token) {
            console.log('Login successful, saving token to session');
            req.session.token = response.data.token;
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        reject(err);
                    } else {
                        console.log('Session saved successfully');
                        resolve();
                    }
                });
            });
        }

        // 2FA doğrulaması başarılı ise token'ı session'a kaydet
        if (req.url === '/auth/verify-2fa' && response.data.token) {
            console.log('2FA verification successful, saving token to session');
            req.session.token = response.data.token;
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        reject(err);
                    } else {
                        console.log('Session saved successfully');
                        resolve();
                    }
                });
            });
        }

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Sunucu hatası' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Frontend sunucusu ${PORT} portunda çalışıyor`);
}); 