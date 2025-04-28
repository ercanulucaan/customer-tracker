document.addEventListener('DOMContentLoaded', () => {
    // DOM Elementleri
    const customerList = document.getElementById('customerList');
    const addCustomerForm = document.getElementById('addCustomerForm');
    const editCustomerForm = document.getElementById('editCustomerForm');
    const addTransactionForm = document.getElementById('addTransactionForm');
    const saveCustomerBtn = document.getElementById('saveCustomerBtn');
    const updateCustomerBtn = document.getElementById('updateCustomerBtn');
    const saveTransactionBtn = document.getElementById('saveTransactionBtn');
    const deleteCustomerBtn = document.getElementById('deleteCustomerBtn');

    // Token kontrolü
    const token = window.TOKEN;
    if (!token) {
        window.location.href = '/login';
        return;
    }

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
                if (customerList) {
                    customerList.innerHTML = '';
                    customers.forEach(customer => {
                        const div = document.createElement('div');
                        div.className = 'col-md-6 col-lg-4';
                        div.innerHTML = `
                            <div class="customer-card" data-id="${customer._id}">
                                <h5 class="mb-3">${customer.name}</h5>
                                <p class="mb-2"><i class="bi bi-telephone"></i> ${customer.phone}</p>
                                <p class="mb-2"><i class="bi bi-geo-alt"></i> ${customer.address || '-'}</p>
                                <p class="mb-3"><i class="bi bi-cash"></i> ${formatCurrency(customer.balance)}</p>
                                <button class="btn btn-primary btn-sm" onclick="showCustomerDetail('${customer._id}')">
                                    Detaylar
                                </button>
                            </div>
                        `;
                        customerList.appendChild(div);
                    });
                }
            } else {
                console.error('Müşteri listesi yüklenirken hata:', await response.text());
            }
        } catch (error) {
            console.error('Müşteri listesi yükleme hatası:', error);
        }
    }

    // Sayfa yüklendiğinde müşteri listesini yükle
    loadCustomers();

    // Yeni müşteri kaydet
    saveCustomerBtn.addEventListener('click', async () => {
        const formData = new FormData(addCustomerForm);
        const customerData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            notes: formData.get('notes'),
            balance: parseFloat(formData.get('balance')) || 0,
            lastPaymentDate: formData.get('lastPaymentDate') || null,
            lastPaymentAmount: parseFloat(formData.get('lastPaymentAmount')) || 0
        };

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(customerData)
            });

            const data = await response.json();

            if (response.ok) {
                addCustomerToList(data);
                $('#addCustomerModal').modal('hide');
                addCustomerForm.reset();
            } else {
                alert(data.error || 'Müşteri eklenirken bir hata oluştu');
            }
        } catch (error) {
            console.error('Müşteri ekleme hatası:', error);
            alert('Bir hata oluştu');
        }
    });

    // Müşteri güncelle
    updateCustomerBtn.addEventListener('click', async () => {
        const formData = new FormData(editCustomerForm);
        const customerId = formData.get('id');
        
        if (!customerId) {
            alert('Müşteri ID bulunamadı');
            return;
        }

        const customerData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            notes: formData.get('notes'),
            balance: parseFloat(formData.get('balance')) || 0,
            lastPaymentDate: formData.get('lastPaymentDate') || null,
            lastPaymentAmount: parseFloat(formData.get('lastPaymentAmount')) || 0
        };

        try {
            const response = await fetch(`/api/customers/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(customerData)
            });

            const data = await response.json();

            if (response.ok) {
                updateCustomerInList(data);
                loadCustomerDetail(customerId); // Detayları yenile
                $('#editCustomerModal').modal('hide');
            } else {
                alert(data.error || 'Müşteri güncellenirken bir hata oluştu');
            }
        } catch (error) {
            console.error('Müşteri güncelleme hatası:', error);
            alert('Bir hata oluştu');
        }
    });

    // Müşteri sil
    deleteCustomerBtn.addEventListener('click', async () => {
        if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
            return;
        }

        const customerId = deleteCustomerBtn.dataset.customerId;
        
        if (!customerId) {
            alert('Müşteri ID bulunamadı');
            return;
        }

        try {
            const response = await fetch(`/api/customers/${customerId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                removeCustomerFromList(customerId);
                $('#customerDetailModal').modal('hide');
                $('#editCustomerModal').modal('hide');
            } else {
                const data = await response.json();
                alert(data.error || 'Müşteri silinirken bir hata oluştu');
            }
        } catch (error) {
            console.error('Müşteri silme hatası:', error);
            alert('Bir hata oluştu');
        }
    });

    // Müşteri detaylarını yükle
    async function loadCustomerDetail(customerId) {
        try {
            const response = await fetch(`/api/customers/${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                displayCustomerDetail(data);
            } else {
                const error = await response.json();
                alert(error.error || 'Müşteri detayları yüklenirken bir hata oluştu');
            }
        } catch (error) {
            console.error('Müşteri detay yükleme hatası:', error);
            alert('Bir hata oluştu');
        }
    }

    // Müşteri detaylarını görüntüle
    function displayCustomerDetail(data) {
        const { customer, recentTransactions } = data;

        // Müşteri bilgilerini doldur
        document.getElementById('detailName').textContent = customer.name;
        document.getElementById('detailPhone').textContent = customer.phone;
        document.getElementById('detailAddress').textContent = customer.address || '-';
        document.getElementById('detailNotes').textContent = customer.notes || '-';
        document.getElementById('detailBalance').textContent = formatCurrency(customer.balance);
        document.getElementById('detailLastPayment').textContent = customer.lastPaymentDate ? 
            `${new Date(customer.lastPaymentDate).toLocaleDateString()} - ${formatCurrency(customer.lastPaymentAmount)}` : 
            '-';

        // Son işlemleri doldur
        const transactionsList = document.getElementById('detailTransactions');
        transactionsList.innerHTML = '';

        if (recentTransactions.length === 0) {
            transactionsList.innerHTML = '<div class="text-center p-3">İşlem bulunamadı</div>';
            return;
        }

        recentTransactions.forEach(transaction => {
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center p-3 border-bottom';
            div.innerHTML = `
                <div>
                    <span class="${transaction.type === 'gelen' ? 'text-success' : 'text-danger'}">
                        ${transaction.type === 'gelen' ? '+' : '-'}${formatCurrency(transaction.amount)}
                    </span>
                    <div class="text-muted">
                        <small>${new Date(transaction.date).toLocaleDateString()}</small>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <div class="text-muted me-3">
                        <small>${transaction.description || ''}</small>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editTransaction('${transaction._id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteTransaction('${transaction._id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            transactionsList.appendChild(div);
        });
    }

    // Müşteri düzenleme modalını aç
    function openEditModal(customer) {
        const editForm = document.getElementById('editCustomerForm');
        if (editForm) {
            const formElements = editForm.elements;
            formElements.id.value = customer._id;
            formElements.name.value = customer.name;
            formElements.phone.value = customer.phone;
            formElements.address.value = customer.address || '';
            formElements.notes.value = customer.notes || '';
            formElements.balance.value = customer.balance || 0;
            formElements.lastPaymentDate.value = customer.lastPaymentDate ? 
                new Date(customer.lastPaymentDate).toISOString().split('T')[0] : '';
            formElements.lastPaymentAmount.value = customer.lastPaymentAmount || 0;
        }
    }

    // Müşteri listesine müşteri ekle
    function addCustomerToList(customer) {
        const div = document.createElement('div');
        div.className = 'col-md-6 col-lg-4';
        div.innerHTML = `
            <div class="customer-card" data-id="${customer._id}">
                <h5 class="mb-3">${customer.name}</h5>
                <p class="mb-2"><i class="bi bi-telephone"></i> ${customer.phone}</p>
                <p class="mb-2"><i class="bi bi-geo-alt"></i> ${customer.address || '-'}</p>
                <p class="mb-3"><i class="bi bi-cash"></i> ${formatCurrency(customer.balance)}</p>
                <button class="btn btn-primary btn-sm" onclick="showCustomerDetail('${customer._id}')">
                    Detaylar
                </button>
            </div>
        `;
        customerList.appendChild(div);
    }

    // Müşteri listesinde müşteriyi güncelle
    function updateCustomerInList(customer) {
        const card = document.querySelector(`.customer-card[data-id="${customer._id}"]`);
        if (card) {
            card.innerHTML = `
                <h5 class="mb-3">${customer.name}</h5>
                <p class="mb-2"><i class="bi bi-telephone"></i> ${customer.phone}</p>
                <p class="mb-2"><i class="bi bi-geo-alt"></i> ${customer.address || '-'}</p>
                <p class="mb-3"><i class="bi bi-cash"></i> ${formatCurrency(customer.balance)}</p>
                <button class="btn btn-primary btn-sm" onclick="showCustomerDetail('${customer._id}')">
                    Detaylar
                </button>
            `;
        }
    }

    // Müşteri listesinden müşteriyi kaldır
    function removeCustomerFromList(customerId) {
        const card = document.querySelector(`.customer-card[data-id="${customerId}"]`);
        if (card) {
            card.parentElement.remove();
        }
    }

    // Müşteri detaylarını göster
    window.showCustomerDetail = function(customerId) {
        // Silme butonuna müşteri ID'sini ekle
        deleteCustomerBtn.dataset.customerId = customerId;
        
        // Müşteri detaylarını yükle
        loadCustomerDetail(customerId);
        
        // Modalı göster
        $('#customerDetailModal').modal('show');
    };

    // Düzenleme butonuna tıklandığında
    document.querySelector('[data-bs-target="#editCustomerModal"]').addEventListener('click', function() {
        const customerId = deleteCustomerBtn.dataset.customerId;
        if (customerId) {
            fetch(`/api/customers/${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => response.json())
            .then(data => {
                openEditModal(data.customer);
                $('#editCustomerModal').modal('show');
            })
            .catch(error => {
                console.error('Müşteri bilgileri yüklenirken hata:', error);
                alert('Müşteri bilgileri yüklenirken bir hata oluştu');
            });
        }
    });

    // Para birimi formatı
    function formatCurrency(amount) {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    }

    // İşlem ekleme modalını aç
    function openTransactionModal(customerId) {
        const transactionForm = document.getElementById('addTransactionForm');
        if (transactionForm) {
            transactionForm.elements.customerId.value = customerId;
            transactionForm.elements.date.value = new Date().toISOString().split('T')[0];
        }
    }

    // İşlem ekleme butonuna tıklandığında
    document.querySelector('[data-bs-target="#addTransactionModal"]').addEventListener('click', function() {
        const customerId = deleteCustomerBtn.dataset.customerId;
        if (customerId) {
            openTransactionModal(customerId);
        }
    });

    // İşlem ekle
    saveTransactionBtn.addEventListener('click', async () => {
        const formData = new FormData(addTransactionForm);
        const customerId = formData.get('customerId');
        
        if (!customerId) {
            alert('Müşteri ID bulunamadı');
            return;
        }

        const transactionData = {
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')) || 0,
            date: formData.get('date'),
            description: formData.get('description')
        };

        try {
            const response = await fetch(`/api/customers/${customerId}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(transactionData)
            });

            const data = await response.json();

            if (response.ok) {
                loadCustomerDetail(customerId); // Müşteri detaylarını yenile
                $('#addTransactionModal').modal('hide');
                addTransactionForm.reset();
                // İşlem formunu tekrar hazırla
                openTransactionModal(customerId);
            } else {
                alert(data.error || 'İşlem eklenirken bir hata oluştu');
            }
        } catch (error) {
            console.error('İşlem ekleme hatası:', error);
            alert('Bir hata oluştu');
        }
    });

    // İşlem düzenle
    window.editTransaction = function(transactionId) {
        const customerId = deleteCustomerBtn.dataset.customerId;
        if (customerId) {
            fetch(`/api/customers/${customerId}/transactions/${transactionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('İşlem bilgileri alınamadı');
                }
                return response.json();
            })
            .then(transaction => {
                const editForm = document.getElementById('editTransactionForm');
                if (editForm) {
                    const formElements = editForm.elements;
                    formElements.id.value = transaction._id;
                    formElements.customerId.value = customerId;
                    formElements.type.value = transaction.type;
                    formElements.amount.value = transaction.amount;
                    formElements.date.value = new Date(transaction.date).toISOString().split('T')[0];
                    formElements.description.value = transaction.description || '';
                }
                $('#editTransactionModal').modal('show');
            })
            .catch(error => {
                console.error('İşlem bilgileri yüklenirken hata:', error);
                alert('İşlem bilgileri yüklenirken bir hata oluştu');
            });
        }
    };

    // İşlem sil
    window.deleteTransaction = function(transactionId) {
        if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
            return;
        }

        const customerId = deleteCustomerBtn.dataset.customerId;
        if (customerId) {
            fetch(`/api/customers/${customerId}/transactions/${transactionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (response.ok) {
                    loadCustomerDetail(customerId);
                } else {
                    throw new Error('İşlem silinirken bir hata oluştu');
                }
            })
            .catch(error => {
                console.error('İşlem silme hatası:', error);
                alert('İşlem silinirken bir hata oluştu');
            });
        }
    };

    // İşlem güncelleme butonuna tıklandığında
    document.getElementById('updateTransactionBtn').addEventListener('click', async () => {
        const formData = new FormData(document.getElementById('editTransactionForm'));
        const transactionId = formData.get('id');
        const customerId = formData.get('customerId');
        
        if (!transactionId || !customerId) {
            alert('İşlem veya müşteri ID bulunamadı');
            return;
        }

        const transactionData = {
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')) || 0,
            date: formData.get('date'),
            description: formData.get('description')
        };

        try {
            const response = await fetch(`/api/customers/${customerId}/transactions/${transactionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(transactionData)
            });

            if (response.ok) {
                loadCustomerDetail(customerId);
                $('#editTransactionModal').modal('hide');
            } else {
                const data = await response.json();
                alert(data.error || 'İşlem güncellenirken bir hata oluştu');
            }
        } catch (error) {
            console.error('İşlem güncelleme hatası:', error);
            alert('Bir hata oluştu');
        }
    });
}); 