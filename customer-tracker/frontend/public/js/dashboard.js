// Global token değişkeni
let token;

document.addEventListener('DOMContentLoaded', () => {
    // Token kontrolü
    token = window.TOKEN;
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Dashboard verilerini yükle
    loadDashboardData();

    // Her 5 dakikada bir verileri güncelle
    setInterval(loadDashboardData, 5 * 60 * 1000);
});

async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard/summary', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateDashboard(data);
        } else {
            const error = await response.json();
            console.error('Dashboard verisi alma hatası:', error);
        }
    } catch (error) {
        console.error('Dashboard verisi alma hatası:', error);
    }
}

function updateDashboard(data) {
    // İstatistik kartlarını güncelle
    document.getElementById('totalCustomers').textContent = data.totalCustomers;
    document.getElementById('totalBalance').textContent = formatCurrency(data.totalBalance);
    document.getElementById('monthlyIncome').textContent = formatCurrency(data.monthlyStats.income);
    document.getElementById('monthlyExpense').textContent = formatCurrency(data.monthlyStats.expense);

    // Son işlemleri güncelle
    const transactionsList = document.getElementById('recentTransactions');
    transactionsList.innerHTML = data.recentTransactions.map(transaction => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${transaction.customerName}</strong>
                <small class="d-block text-muted">${transaction.description || ''}</small>
            </div>
            <div class="text-end">
                <span class="${transaction.type === 'gelen' ? 'text-success' : 'text-danger'}">
                    ${transaction.type === 'gelen' ? '+' : '-'}${formatCurrency(transaction.amount)}
                </span>
                <small class="d-block text-muted">${new Date(transaction.date).toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');

    // En aktif müşterileri güncelle
    const topCustomersList = document.getElementById('topCustomers');
    topCustomersList.innerHTML = data.topCustomers.map(customer => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${customer.name}</strong>
                <small class="d-block text-muted">${customer.transactionCount} işlem</small>
            </div>
            <div class="text-end">
                <span>${formatCurrency(customer.totalAmount)}</span>
            </div>
        </div>
    `).join('');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
} 