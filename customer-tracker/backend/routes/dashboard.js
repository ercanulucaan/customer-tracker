const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Dashboard özet bilgileri
router.get('/summary', auth, async (req, res) => {
    try {
        // Toplam müşteri sayısı
        const totalCustomers = await Customer.countDocuments();
        
        // Toplam bakiye
        const customers = await Customer.find();
        const totalBalance = customers.reduce((sum, customer) => sum + (customer.balance || 0), 0);
        
        // Son 30 gündeki işlemler
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentTransactions = await Transaction.find({
            date: { $gte: thirtyDaysAgo }
        })
        .sort({ date: -1 })
        .limit(10)
        .populate('customer', 'name');
        
        // Son 30 günün istatistikleri
        const monthlyTransactions = await Transaction.find({
            date: { $gte: thirtyDaysAgo }
        });
        
        const totalIncome = monthlyTransactions
            .filter(t => t.type === 'gelen')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpense = monthlyTransactions
            .filter(t => t.type === 'giden')
            .reduce((sum, t) => sum + t.amount, 0);
        
        // En çok işlem yapılan müşteriler
        const customerStats = await Transaction.aggregate([
            {
                $group: {
                    _id: '$customer',
                    transactionCount: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            {
                $sort: { transactionCount: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            {
                $unwind: '$customer'
            },
            {
                $project: {
                    id: '$_id',
                    name: '$customer.name',
                    transactionCount: 1,
                    totalAmount: 1
                }
            }
        ]);
        
        res.json({
            totalCustomers,
            totalBalance,
            monthlyStats: {
                income: totalIncome,
                expense: totalExpense,
                netProfit: totalIncome - totalExpense
            },
            recentTransactions: recentTransactions.map(t => ({
                customerName: t.customer.name,
                type: t.type,
                amount: t.amount,
                date: t.date,
                description: t.description
            })),
            topCustomers: customerStats
        });
    } catch (error) {
        console.error('Dashboard verisi alma hatası:', error);
        res.status(500).json({ message: 'Dashboard verisi alınırken bir hata oluştu' });
    }
});

module.exports = router; 