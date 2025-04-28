require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = require('./app');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const dashboardRoutes = require('./routes/dashboard');

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch(err => console.error('MongoDB bağlantı hatası:', err));

// Create initial admin user if not exists
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createInitialAdmin() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                username: 'admin',
                password: hashedPassword
            });
            console.log('İlk admin kullanıcısı oluşturuldu');
        }
    } catch (error) {
        console.error('Admin kullanıcısı oluşturma hatası:', error);
    }
}

createInitialAdmin();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend sunucusu ${PORT} portunda çalışıyor`);
}); 