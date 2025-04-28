document.addEventListener('DOMContentLoaded', () => {
    // DOM Elementleri
    const filterForm = document.getElementById('filterForm');
    const dateRange = document.getElementById('dateRange');
    const customerFilter = document.getElementById('customerFilter');
    const transactionType = document.getElementById('transactionType');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const transactionsList = document.getElementById('transactionsList');
    const totalIncome = document.getElementById('totalIncome');
    const totalExpense = document.getElementById('totalExpense');
    const netProfit = document.getElementById('netProfit');

    // Token kontrolü
    const token = window.TOKEN;
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Tarih seçici ayarları
    $(dateRange).daterangepicker({
        startDate: moment().startOf('day'),
        endDate: moment().endOf('day'),
        locale: {
            format: 'DD.MM.YYYY',
            applyLabel: 'Uygula',
            cancelLabel: 'İptal',
            fromLabel: 'Dan',
            toLabel: 'a',
            customRangeLabel: 'Özel',
            daysOfWeek: ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'],
            monthNames: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
        }
    });

    // Müşteri listesini yükle
    loadCustomers();

    // Sayfa yüklendiğinde bugünün işlemlerini getir
    loadTransactions();

    // Filtre formu submit
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loadTransactions();
    });

    // Filtreleri sıfırla
    resetFiltersBtn.addEventListener('click', () => {
        $(dateRange).data('daterangepicker').setStartDate(moment().startOf('day'));
        $(dateRange).data('daterangepicker').setEndDate(moment().endOf('day'));
        customerFilter.value = '';
        transactionType.value = '';
        loadTransactions();
    });

    // Müşteri listesini yükle
    async function loadCustomers() {
        try {
            const response = await fetch('/api/customers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const customers = await response.json();
                customers.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer._id;
                    option.textContent = customer.name;
                    customerFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Müşteri listesi yükleme hatası:', error);
        }
    }

    // İşlemleri yükle
    async function loadTransactions() {
        try {
            const dateRangeValue = $(dateRange).data('daterangepicker');
            const startDate = dateRangeValue.startDate.format('YYYY-MM-DD');
            const endDate = dateRangeValue.endDate.format('YYYY-MM-DD');
            const customerId = customerFilter.value;
            const type = transactionType.value;

            let url = `/api/transactions?startDate=${startDate}&endDate=${endDate}`;
            if (customerId) url += `&customerId=${customerId}`;
            if (type) url += `&type=${type}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                displayTransactions(data.transactions);
                updateStatistics(data.statistics);
            }
        } catch (error) {
            console.error('İşlem yükleme hatası:', error);
        }
    }

    // İşlemleri görüntüle
    function displayTransactions(transactions) {
        transactionsList.innerHTML = '';
        
        if (transactions.length === 0) {
            transactionsList.innerHTML = '<div class="text-center p-3">İşlem bulunamadı</div>';
            return;
        }

        transactions.forEach(transaction => {
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center p-3 border-bottom';
            div.innerHTML = `
                <div>
                    <h6 class="mb-1">${transaction.customer.name}</h6>
                    <small class="text-muted">${transaction.description || ''}</small>
                </div>
                <div class="text-end">
                    <span class="${transaction.type === 'gelen' ? 'text-success' : 'text-danger'}">
                        ${transaction.type === 'gelen' ? '+' : '-'}${formatCurrency(transaction.amount)}
                    </span>
                    <div class="text-muted">
                        <small>${new Date(transaction.date).toLocaleDateString()}</small>
                    </div>
                </div>
            `;
            transactionsList.appendChild(div);
        });
    }

    // İstatistikleri güncelle
    function updateStatistics(stats) {
        totalIncome.textContent = formatCurrency(stats.totalIncome);
        totalExpense.textContent = formatCurrency(stats.totalExpense);
        netProfit.textContent = formatCurrency(stats.netProfit);
    }

    // Para birimi formatı
    function formatCurrency(amount) {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    }
}); 