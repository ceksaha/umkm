# 🚀 WA Order Bot - Pro Version

Chatbot pemesanan WhatsApp yang sudah dilengkapi dengan Dashboard Admin real-time, manajemen pesanan, dan flow checkout yang matang.

## 🌟 Fitur Unggulan
1.  **WhatsApp Integration**: Terintegrasi menggunakan Baileys (cepat & tanpa ribet setup Cloud API).
2.  **Premium Dashboard**: Tampilan modern (Dark Mode, Glassmorphism, 100% Responsive) untuk memantau pesanan yang masuk.
3.  **Real-Time Updates**: Pesanan masuk langsung muncul di dashboard tanpa refresh (Socket.io).
4.  **Order Management**: Ubah status pesanan (Pending, Completed, Cancelled) langsung dari dashboard.
5.  **Simulation Mode**: Uji coba flow pemesanan tanpa HP/WhatsApp selama pengembangan.

## 🛠 Instalasi dan Persiapan

1.  Pastikan anda memiliki **MongoDB** dan **Git** (untuk Baileys) terinstall.
2.  Install all dependencies:
    ```bash
    npm install
    ```
3.  Konfigurasi `.env`:
    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/wa-order-bot
    ```

## 🚀 Menjalankan Server

1. **Isi data awal** (opsional):
   ```bash
   npm run seed
   ```
2. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```
3. **Login WhatsApp**: Buka terminal, scan QR Code yang muncul menggunakan WhatsApp di HP Anda.

## 🖥 Dashboard Admin
Setelah server jalan, buka:
`http://localhost:3000/dashboard`

## 🧪 Cara Test Tanpa WhatsApp (Simulator)
Jika Anda ingin mengetest alur pemesanan tanpa scan QR Code:
1. Pastikan server sedang berjalan (`npm run dev`).
2. Di terminal baru, jalankan:
   ```bash
   npm run simulate
   ```
3. Lihat pesanan baru muncul otomatis di dashboard!

## 📦 Deployment (Production)
Tersedia `Dockerfile` untuk kemudahan deploy ke VPS, Railway, atau Render.
Pastikan file `auth_info_baileys` dipersistentkan agar tidak perlu scan ulang setiap deploy.

---
Build with ❤️ for UMKM.
