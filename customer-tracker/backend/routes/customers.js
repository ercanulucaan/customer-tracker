const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Tüm müşterileri getir
router.get('/', auth, async (req, res) => {
    try {
        const customers = await Customer.find().sort({ name: 1 });
        res.json(customers);
    } catch (error) {
        console.error('Müşteri listesi getirme hatası:', error);
        res.status(500).json({ error: 'Müşteriler getirilirken bir hata oluştu' });
    }
});

// Müşteri detaylarını getir
router.get('/:id', auth, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Müşteri bulunamadı' });
        }

        // Müşterinin son işlemlerini getir
        const transactions = await Transaction.find({ customer: req.params.id })
            .sort({ date: -1 })
            .limit(5);

        res.json({
            customer,
            recentTransactions: transactions
        });
    } catch (error) {
        console.error('Müşteri detay getirme hatası:', error);
        res.status(500).json({ error: 'Müşteri detayları getirilirken bir hata oluştu' });
    }
});

// Yeni müşteri ekle
router.post('/', auth, async (req, res) => {
    try {
        const { name, phone, address, notes, balance, lastPaymentDate, lastPaymentAmount } = req.body;

        // Validasyon
        if (!name || !phone) {
            return res.status(400).json({ error: 'Ad ve telefon alanları zorunludur' });
        }

        // Telefon numarası formatı kontrolü
        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: 'Geçersiz telefon numarası formatı' });
        }

        const customer = new Customer({
            name,
            phone,
            address: address || '',
            notes: notes || '',
            balance: balance || 0,
            lastPaymentDate: lastPaymentDate || null,
            lastPaymentAmount: lastPaymentAmount || 0
        });

        await customer.save();
        res.status(201).json(customer);
    } catch (error) {
        console.error('Müşteri ekleme hatası:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Müşteri eklenirken bir hata oluştu' });
    }
});

// Müşteri güncelle
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, phone, address, notes, balance, lastPaymentDate, lastPaymentAmount } = req.body;

        // Validasyon
        if (!name || !phone) {
            return res.status(400).json({ error: 'Ad ve telefon alanları zorunludur' });
        }

        // Telefon numarası formatı kontrolü
        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: 'Geçersiz telefon numarası formatı' });
        }

        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Müşteri bulunamadı' });
        }

        // Müşteri bilgilerini güncelle
        customer.name = name;
        customer.phone = phone;
        customer.address = address || '';
        customer.notes = notes || '';
        
        // Bakiye ve son ödeme bilgilerini güncelle
        if (balance !== undefined) {
            customer.balance = parseFloat(balance) || 0;
        }
        if (lastPaymentDate) {
            customer.lastPaymentDate = new Date(lastPaymentDate);
        }
        if (lastPaymentAmount !== undefined) {
            customer.lastPaymentAmount = parseFloat(lastPaymentAmount) || 0;
        }

        await customer.save();
        res.json(customer);
    } catch (error) {
        console.error('Müşteri güncelleme hatası:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Müşteri güncellenirken bir hata oluştu' });
    }
});

// Müşteri sil
router.delete('/:id', auth, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Müşteri bulunamadı' });
        }

        // Müşteriye ait tüm işlemleri sil
        await Transaction.deleteMany({ customer: req.params.id });

        // Müşteriyi sil
        await Customer.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Müşteri ve tüm işlemleri başarıyla silindi' });
    } catch (error) {
        console.error('Müşteri silme hatası:', error);
        res.status(500).json({ error: 'Müşteri silinirken bir hata oluştu' });
    }
});

// Müşteriye işlem ekle
router.post('/:id/transactions', auth, async (req, res) => {
    try {
        const { type, amount, date, description } = req.body;
        const customer = await Customer.findById(req.params.id);
        
        if (!customer) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }

        // Bakiyeyi güncelle
        const parsedAmount = parseFloat(amount) || 0;
        if (type === 'gelen') {
            customer.balance += parsedAmount;
            customer.lastPaymentDate = new Date(date);
            customer.lastPaymentAmount = parsedAmount;
        } else {
            customer.balance -= parsedAmount;
        }

        // İşlemi ekle
        const transaction = new Transaction({
            customer: customer._id,
            type,
            amount: parsedAmount,
            date: new Date(date),
            description
        });

        await transaction.save();
        await customer.save();
        
        res.status(201).json({ customer, transaction });
    } catch (error) {
        console.error('İşlem ekleme hatası:', error);
        res.status(500).json({ message: 'İşlem eklenirken bir hata oluştu' });
    }
});

// İşlem güncelleme
router.put('/:customerId/transactions/:transactionId', auth, async (req, res) => {
    try {
        const { customerId, transactionId } = req.params;
        const { type, amount, date, description } = req.body;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'İşlem bulunamadı' });
        }

        // İşlemin müşteriye ait olduğunu kontrol et
        if (transaction.customer.toString() !== customerId) {
            return res.status(403).json({ message: 'Bu işlem bu müşteriye ait değil' });
        }

        // Eski işlemin tutarını bakiyeden çıkar
        if (transaction.type === 'gelen') {
            customer.balance -= transaction.amount;
        } else {
            customer.balance += transaction.amount;
        }

        // Yeni işlemin tutarını bakiyeye ekle
        const parsedAmount = parseFloat(amount) || 0;
        if (type === 'gelen') {
            customer.balance += parsedAmount;
        } else {
            customer.balance -= parsedAmount;
        }

        // İşlemi güncelle
        transaction.type = type;
        transaction.amount = parsedAmount;
        transaction.date = new Date(date);
        transaction.description = description;

        // Son ödeme bilgilerini güncelle
        if (type === 'gelen') {
            customer.lastPaymentDate = new Date(date);
            customer.lastPaymentAmount = parsedAmount;
        }

        await transaction.save();
        await customer.save();
        
        res.json({ customer, transaction });
    } catch (error) {
        console.error('İşlem güncelleme hatası:', error);
        res.status(500).json({ message: 'İşlem güncellenirken bir hata oluştu' });
    }
});

// İşlem silme
router.delete('/:customerId/transactions/:transactionId', auth, async (req, res) => {
    try {
        const { customerId, transactionId } = req.params;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'İşlem bulunamadı' });
        }

        // İşlemin tutarını bakiyeden çıkar
        if (transaction.type === 'gelen') {
            customer.balance -= transaction.amount;
        } else {
            customer.balance += transaction.amount;
        }

        // Son ödeme bilgilerini güncelle
        if (transaction.type === 'gelen') {
            const lastPayment = await Transaction.findOne({
                customer: customerId,
                type: 'gelen',
                _id: { $ne: transactionId }
            }).sort({ date: -1 });

            if (lastPayment) {
                customer.lastPaymentDate = lastPayment.date;
                customer.lastPaymentAmount = lastPayment.amount;
            } else {
                customer.lastPaymentDate = null;
                customer.lastPaymentAmount = 0;
            }
        }

        // İşlemi sil
        await Transaction.findByIdAndDelete(transactionId);
        await customer.save();
        
        res.json(customer);
    } catch (error) {
        console.error('İşlem silme hatası:', error);
        res.status(500).json({ message: 'İşlem silinirken bir hata oluştu' });
    }
});

// İşlem detaylarını getir
router.get('/:customerId/transactions/:transactionId', auth, async (req, res) => {
    try {
        const { customerId, transactionId } = req.params;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Müşteri bulunamadı' });
        }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'İşlem bulunamadı' });
        }

        // İşlemin müşteriye ait olduğunu kontrol et
        if (transaction.customer.toString() !== customerId) {
            return res.status(403).json({ message: 'Bu işlem bu müşteriye ait değil' });
        }

        res.json(transaction);
    } catch (error) {
        console.error('İşlem detay hatası:', error);
        res.status(500).json({ message: 'İşlem bilgileri alınırken bir hata oluştu' });
    }
});

module.exports = router; 