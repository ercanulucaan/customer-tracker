# Müşteri Takip Sistemi

Müşteri ve işlem takibi yapabilen, bakiye yönetimi sağlayan bir web uygulaması.

## Özellikler

- Müşteri ekleme, düzenleme, silme
- İşlem ekleme, düzenleme, silme
- Bakiye takibi
- Dashboard ile genel durum görüntüleme
- İki faktörlü kimlik doğrulama (2FA)

## Teknolojiler

- Backend: Node.js, Express.js
- Frontend: HTML, CSS, JavaScript, Bootstrap
- Veritabanı: MongoDB
- Kimlik Doğrulama: JWT, 2FA

## Kurulum

1. Repoyu klonlayın:
```bash
git clone https://github.com/KULLANICI_ADINIZ/customer-tracker.git
cd customer-tracker
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. .env dosyasını oluşturun:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/customer-tracker
JWT_SECRET=your-secret-key
```

4. Uygulamayı başlatın:
```bash
npm start
```

## API Endpoints

### Müşteriler
- GET /api/customers - Tüm müşterileri listele
- GET /api/customers/:id - Müşteri detaylarını getir
- POST /api/customers - Yeni müşteri ekle
- PUT /api/customers/:id - Müşteri güncelle
- DELETE /api/customers/:id - Müşteri sil

### İşlemler
- GET /api/customers/:id/transactions - Müşteri işlemlerini listele
- POST /api/customers/:id/transactions - Yeni işlem ekle
- PUT /api/customers/:id/transactions/:transactionId - İşlem güncelle
- DELETE /api/customers/:id/transactions/:transactionId - İşlem sil

### Dashboard
- GET /api/dashboard/summary - Dashboard özet bilgilerini getir

## Lisans

MIT 