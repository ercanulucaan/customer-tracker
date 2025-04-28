const express = require('express');
const path = require('path');
const auth = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const transactionRoutes = require('./routes/transactions');

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Template engine ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// Static dosyalar
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Frontend Routes
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/dashboard', auth, (req, res) => {
    res.render('dashboard', {
        token: req.token,
        process: { env: { API_BASE_URL: process.env.API_BASE_URL } }
    });
});

app.get('/customers', auth, (req, res) => {
    res.render('customers', {
        token: req.token,
        process: { env: { API_BASE_URL: process.env.API_BASE_URL } }
    });
});

app.get('/reports', auth, (req, res) => {
    res.render('reports', {
        token: req.token,
        process: { env: { API_BASE_URL: process.env.API_BASE_URL } }
    });
});

app.get('/security', auth, (req, res) => {
    res.render('security', {
        token: req.token,
        process: { env: { API_BASE_URL: process.env.API_BASE_URL } }
    });
});

app.get('/logout', (req, res) => {
    res.redirect('/login');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);

module.exports = app; 