# 🚀 Panduan Deployment Ke VPS/Cloud (24 Jam Online)

Dokumen ini menjelaskan cara memindahkan aplikasi dari laptop ke server (VPS) agar bot bisa berjalan terus menerus tanpa tergantung koneksi internet di laptop Anda.

---

## 1. Persiapan Server (VPS)
Gunakan VPS dengan OS **Ubuntu 22.04 LTS** atau versi terbaru. Rekomendasi spek minimum:
- CPU: 1 Core
- RAM: 1 GB - 2 GB
- Storage: 20 GB SSD

### Langkah 1: Install Docker & Docker Compose
Jalankan perintah ini di terminal VPS Anda:
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y
```

---

## 2. Memindahkan Kode ke VPS
Pilih salah satu cara:

### Opsi A: Menggunakan Git (Direkomendasikan)
1. Push kode Anda ke GitHub/Gitlab.
2. Di VPS, clone repositori tersebut:
   ```bash
   git clone https://github.com/username/wa-order-bot.git
   cd wa-order-bot
   ```

### Opsi B: Menggunakan SCP/WinSCP
Copy folder project Anda ke VPS (kecuali `node_modules`).

---

## 3. Konfigurasi Environment
Buat file `.env` di dalam folder project di VPS:
```bash
nano .env
```
Isi dengan data produksi:
```env
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/wa_bot?retryWrites=true&w=majority
JWT_SECRET=BUAT_KODE_ACAK_YANG_SANGAT_PANJANG_DAN_RAHASIA
NODE_ENV=production

# TAMBAHKAN INI JIKA TIDAK MAU SCAN QR:
PAIRING_NUMBER=62812xxxxxx 
```
> [!TIP]
> **PAIRING_NUMBER**: Masukkan nomor WhatsApp Anda (dengan kode negara, contoh: 62812xxx). Jika diisi, bot akan memberikan **kode 8 digit** di terminal daripada QR Code.

---

## 4. Menjalankan Aplikasi (Docker)
Kita akan menggunakan Docker agar aplikasi otomatis restart jika server mati/reboot.

### Langkah 1: Build & Jalankan
```bash
sudo docker-compose up -d --build
```

### Langkah 2: Monitoring Log & Login
Untuk melihat QR Code atau **Pairing Code**:
```bash
sudo docker logs -f wa-order-bot
```
- **Jika via QR**: Scan langsung dari terminal.
- **Jika via Pairing Code**: Buka WhatsApp HP > Settings > Linked Devices > Link with phone number > Masukkan kode 8 digit yang muncul di log.

---

## 5. Setup Reverse Proxy & SSL (Optional tapi Penting)
Agar akses Dashboard menggunakan HTTPS (Contoh: `https://bot.tokoanda.com`), gunakan Nginx.

### Install Nginx
```bash
sudo apt install nginx -y
```

### Konfigurasi Nginx
`sudo nano /etc/nginx/sites-available/bot`
```nginx
server {
    listen 80;
    server_name bot.tokoanda.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Aktifkan config:
```bash
sudo ln -s /etc/nginx/sites-available/bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Install SSL (Certbot)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d bot.tokoanda.com
```

---

## 🛠 Maintenance & Tips
- **Persistensi Sesi**: Docker Compose sudah dikonfigurasi untuk menyimpan folder `auth_info_baileys` di VPS. Anda tidak perlu scan ulang setiap kali update kode.
- **Update Kode**: Jika ada perubahan kode, jalankan:
  ```bash
  git pull
  sudo docker-compose up -d --build
  ```
- **Backup**: Selalu backup folder `auth_info_baileys` jika ingin pindah server.

---
**Status:** Siap dideploy! 🚀
