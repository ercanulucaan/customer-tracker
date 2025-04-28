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
# Backend bağımlılıkları
cd backend
npm install

# Frontend bağımlılıkları
cd ../frontend
npm install
```

3. Backend .env dosyasını oluşturun:
```env
# Backend/.env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/customer-tracker
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001 
NODE_ENV=development
```

4. Frontend .env dosyasını oluşturun:
```env
# Frontend/.env
PORT=3001
BACKEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/customer-tracker
SESSION_SECRET=your-secret-key
API_BASE_URL=/api 
```

5. Uygulamayı başlatın:
```bash
# Backend'i başlat
cd backend
npm start

# Frontend'i başlat (yeni bir terminal penceresinde)
cd frontend
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