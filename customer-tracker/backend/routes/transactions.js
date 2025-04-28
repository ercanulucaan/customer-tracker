const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

// İşlemleri getir (filtreli)
router.get('/', auth, async (req, res) => {
    try {
        const { startDate, endDate, customerId, type } = req.query;
        
        // Filtreleme kriterleri
        const filter = {};
        
        // Tarih filtresi
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // Müşteri filtresi
        if (customerId) {
            filter.customer = customerId;
        }
        
        // İşlem tipi filtresi
        if (type) {
            filter.type = type;
        }

        // İşlemleri getir ve müşteri bilgilerini populate et
        const transactions = await Transaction.find(filter)
            .populate('customer', 'name')
            .sort({ date: -1 });

        // İstatistikleri hesapla
        const statistics = {
            totalIncome: 0,
            totalExpense: 0,
            netProfit: 0
        };

        transactions.forEach(transaction => {
            if (transaction.type === 'gelen') {
                statistics.totalIncome += transaction.amount;
            } else {
                statistics.totalExpense += transaction.amount;
            }
        });

        statistics.netProfit = statistics.totalIncome - statistics.totalExpense;

        res.json({
            transactions,
            statistics
        });
    } catch (error) {
        console.error('İşlem getirme hatası:', error);
        res.status(500).json({ error: 'İşlemler getirilirken bir hata oluştu' });
    }
});

// Yeni işlem ekle
router.post('/', auth, async (req, res) => {
    try {
        const { customerId, type, amount, description, date } = req.body;

        // Validasyon
        if (!customerId || !type || !amount || !date) {
            return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
        }

        // Müşteri kontrolü
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ error: 'Müşteri bulunamadı' });
        }

        // Yeni işlem oluştur
        const transaction = new Transaction({
            customer: customerId,
            type,
            amount,
            description,
            date: new Date(date)
        });

        await transaction.save();

        // Müşteri bakiyesini güncelle
        if (type === 'gelen') {
            customer.balance += amount;
            customer.lastPaymentDate = new Date(date);
            customer.lastPaymentAmount = amount;
        } else {
            customer.balance -= amount;
        }

        await customer.save();

        res.status(201).json(transaction);
    } catch (error) {
        console.error('İşlem ekleme hatası:', error);
        res.status(500).json({ error: 'İşlem eklenirken bir hata oluştu' });
    }
});

// İşlem sil
router.delete('/:id', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        
        if (!transaction) {
            return res.status(404).json({ error: 'İşlem bulunamadı' });
        }

        // Müşteri bakiyesini güncelle
        const customer = await Customer.findById(transaction.customer);
        if (customer) {
            if (transaction.type === 'gelen') {
                customer.balance -= transaction.amount;
            } else {
                customer.balance += transaction.amount;
            }
            await customer.save();
        }

        await transaction.remove();
        res.json({ message: 'İşlem başarıyla silindi' });
    } catch (error) {
        console.error('İşlem silme hatası:', error);
        res.status(500).json({ error: 'İşlem silinirken bir hata oluştu' });
    }
});

module.exports = router; 