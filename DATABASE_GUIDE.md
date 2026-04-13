# Panduan Setup Database Online (MongoDB Atlas)

Agar bot WhatsApp Anda bisa di-*deploy* ke server (Railway, Render, dll) dan berjalan 24 jam nonstop secara mandiri, Anda tidak bisa menggunakan URL MongoDB lokal (`mongodb://127.0.0.1:27017...`). Server di internet memerlukan akses ke database yang juga online 24 jam.

Untuk itu, kita akan menggunakan **MongoDB Atlas** (versi cloud dari MongoDB) yang menyediakan versi **GRATIS** selamanya dan sangat cukup untuk kebutuhan UMKM.

Berikut adalah langkah-langkah detailnya:

## Langkah 1: Buat Akun & Cluster Gratis
1. Buka website: [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Mendaftar menggunakan Email atau tombol Sign Up with Google.
3. Setelah login, Anda akan ditawari membuat Cluster. Pilih yang bertanda **"Shared"** atau **"M0 (Free)"**.
4. Di bagian lokasi server (Region), pilih yang terdekat dengan Indonesia (misalnya **Singapore `ap-southeast-1`**) agar bot merespon dengan cepat.
5. Biarkan pengaturan lainnya secara default, geser ke bawah, lalu klik **"Create Cluster"**.

## Langkah 2: Setup Keamanan & Pengguna Database
Setelah Cluster dibuat, MongoDB akan meminta Anda membuat user pelindung.

1. **Username & Password:** Buat Username (misal: `adminadmin`) dan Password.
   > ⚠️ **Sangat Penting:** Catat/copy password ini! Anda akan membutuhkannya di Langkah 4 nanti.
   Klik **"Create User"**.

2. **Network Access (Akses Jaringan):** Agar server aplikasi seperti Railway nanti bisa mengakses database ini, Anda perlu mengizinkan koneksi luar.
   - Di menu **"IP Address"**, klik tombol yang bertuliskan **"Allow Access from Anywhere"** (Ini akan menambahkan IP `0.0.0.0/0`).
   - Klik **"Finish and Close"**.
   - Anda akan diarahkan ke halaman utama Dashboard Atlas Anda.

## Langkah 3: Dapatkan Link Koneksi (Connection String)
1. Di Dashboard (halaman utama bertuliskan "Cluster0"), cari dan klik tombol **"Connect"**.
2. Akan muncul beberapa pilihan. Pilih bagian **"Drivers"** atau **"Connect your application"**.
3. Pastikan kolom "Driver" terpilih "Node.js".
4. Anda akan melihat sebuah link panjang (*Connection String*) yang mirip seperti ini:
   `mongodb+srv://adminadmin:<password>@cluster0.abcxyz.mongodb.net/?retryWrites=true&w=majority`
5. Copy (salin) seluruh link tersebut.

## Langkah 4: Sesuaikan di `.env` (atau di Railway Variables)
Link yang Anda salin tadi adalah *nyawa* penghubung bot Anda dengan database.

1. Jika Anda mencoba di laptop (untuk tes local), buka file `.env` di VSCode.
2. Jika Anda *deploy* ke Railway, buka tab **Variables**.
3. Masukkan/ganti nilai `MONGODB_URI` dengan link tadi, **namun pastikan untuk:**
   - Mengganti teks `<password>` dengan password yang Anda buat di Langkah 2.
   - (Opsional tapi disarankan) Tambahkan nama database spesifik sebelum tanda `?`, misal menambahkan `/wa_order_bot`, jadi seperti ini:
     `mongodb+srv://adminadmin:P4ssW0rdRahasiaKu@cluster0.abcxyz.mongodb.net/wa_order_bot?retryWrites=true&w=majority`

---

## Ringkasan untuk Deployment ke Railway.app

Jika Anda sudah punya URL MongoDB Atlas (`mongodb+srv://...`), tinggal selesaikan 4 langkah ini di Railway:

1. Di Project Railway Anda, klik **New** -> **GitHub Repo** -> Pilih `ceksaha/umkm`.
2. Buka tab **Variables** di Railway, tambahkan 3 baris ini:
   - `MONGODB_URI` = (Isi dengan URL panjang dari Langkah 4 di atas)
   - `JWT_SECRET` = (Isi dengan kalimat acak rahasia, misal: `rahasia_dashboard_umkm_2026`)
   - `PORT` = `3000`
3. Railway akan memulai proses *build* (instalasi).
4. Klik tab **View Logs** / **Deploy Logs**. 
   - Anda akan melihat bot menyala.
   - Log akan menampilkan QR CODE (dalam bentuk teks kotak-kotak).
   - Buka WhatsApp di HP Anda, masuk ke Perangkat Taut (Linked Devices), lalu **SCAN QR Code** yang ada di layar monitor Anda.

✅ Selesai! Bot WhatsApp Anda kini sudah mengudara secara mandiri. Laptop Anda kini bisa dimatikan dengan tenang.
