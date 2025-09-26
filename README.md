# Qrossword - Teka Teki Quiz Cerdas

![Tampilan Gameplay Qrossword](https://github.com/fahroediin/tts-gemini-app/blob/main/demo/demo.png)

Sebuah web app Teka-Teki Silang (TTS) modern yang kontennya dihasilkan secara dinamis oleh AI (Google Gemini). Proyek ini dirancang dengan fokus pada pengalaman pengguna yang cepat dan interaktif, menggunakan mekanisme caching di latar belakang untuk menghilangkan waktu tunggu saat membuat puzzle baru.

## ✨ Fitur Utama

*   ✅ **Konten Dinamis oleh AI:** Setiap puzzle unik dan dibuat oleh Google Gemini API berdasarkan tema yang dipilih.
*   ⚡ **Pemuatan Instan:** Mekanisme caching di latar belakang membuat stok puzzle di database, sehingga pengguna mendapatkan puzzle baru secara instan tanpa menunggu AI.
*   📊 **Dashboard Admin:** Halaman admin yang dilindungi password untuk memonitor penggunaan aplikasi, melihat saran dari pengguna, dan menganalisis popularitas tema.
*   🖥️ **Dashboard Interaktif:** Layout *side-by-side* yang modern menampilkan grid dan petunjuk secara bersamaan, menghilangkan kebutuhan untuk menggulir (scroll).
*   🔦 **Highlighting Cerdas:** Mengklik sel di grid akan menyorot kata dan petunjuk yang relevan, dan sebaliknya.
*   ⌨️ **Navigasi Penuh:** Dukungan penuh untuk navigasi keyboard (tombol panah) dan auto-advance saat mengetik.
*   🎨 **Umpan Balik Visual:** Pengecekan jawaban secara instan dengan umpan balik visual tanpa berpindah halaman.
*   🏆 **Sistem Skor yang Adil:** Skor dihitung berdasarkan akurasi, bonus penyelesaian, dan bonus kecepatan.
*   🔔 **Notifikasi Modern:** Menggunakan SweetAlert2 untuk dialog konfirmasi dan notifikasi yang elegan.
*   🦕 **Generator Nama Acak:** Fitur kecil yang menyenangkan untuk pengguna yang tidak ingin memasukkan nama.
*   📱 **Desain Responsif:** Tampilan beradaptasi dengan baik untuk pengalaman bermain di perangkat desktop maupun mobile.

## 🛠️ Tumpukan Teknologi (Tech Stack)

| Kategori | Teknologi |
| :--- | :--- |
| **Backend** | Python, Flask, APScheduler, **Flask-Login** |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **AI Model** | Google Gemini API |
| **Database** | SQLite |
| **UI Library** | SweetAlert2, Font Awesome, **Chart.js** |

## 🏛️ Cara Kerja Arsitektur

Proyek ini menggunakan arsitektur hibrida yang cerdas untuk memisahkan proses yang lambat (pembuatan oleh AI) dari pengalaman pengguna yang cepat.

**Proses Latar Belakang (Otomatis oleh Scheduler):**
```
[Scheduler] -> [Worker Latar Belakang] -> [Panggil Gemini API] -> [Susun Grid] -> [Simpan ke Database Cache]
```

**Proses Pengguna (Instan):**
```
[Pengguna Meminta Puzzle] -> [Flask App] -> [Ambil Puzzle dari Cache] -> [Tampilkan ke Pengguna]
```

## 🚀 Panduan Instalasi dan Menjalankan

Ikuti langkah-langkah ini untuk menjalankan proyek di mesin lokal Anda.

### 1. Prasyarat
*   Python 3.8 atau lebih tinggi
*   `pip` (Python package installer)

### 2. Kloning Repositori
```bash
git clone https://github.com/fahroediin/tts-gemini-app.git
cd tts-gemini-app
```

### 3. Siapkan Lingkungan Virtual (Direkomendasikan)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 4. Instal Dependensi
```bash
pip install -r requirements.txt
```

### 5. Konfigurasi Kunci API & Password Admin

#### a. Konfigurasi Kunci API Gemini
1.  Dapatkan API Key Anda dari [Google AI Studio](https://aistudio.google.com/).
2.  Buat file baru di folder utama proyek bernama `.env`.
3.  Salin dan tempel konten berikut ke dalam file `.env`, ganti dengan API Key Anda:
    ```
    GEMINI_API_KEY="MASUKKAN_API_KEY_ANDA_DI_SINI"
    ```

#### b. Konfigurasi Password Admin
1.  Jalankan skrip `create_admin.py` untuk membuat password hash yang aman:
    ```bash
    python create_admin.py
    ```
    *(Anda bisa mengubah password di dalam file `create_admin.py` sebelum menjalankannya)*
2.  Skrip akan menghasilkan sebuah string hash. **Salin seluruh string tersebut.**
3.  Buka file `app.py` dan tempel hash yang baru saja Anda salin ke dalam `app.config['ADMIN_PASSWORD_HASH']`.

### 6. Jalankan Aplikasi
1.  Hapus file `crossword.db` jika ada untuk memulai dari awal yang bersih.
2.  Gunakan perintah `flask run`:
    ```bash
    flask run
    ```
3.  **Penting:** Saat pertama kali dijalankan, perhatikan terminal. Aplikasi akan mulai mengisi stok puzzle di latar belakang. Proses ini mungkin memakan waktu beberapa menit. Biarkan berjalan hingga Anda melihat pesan `* Running on http://127.0.0.1:5000`.
4.  Buka browser Anda dan kunjungi:
    *   **Halaman Game:** `http://127.0.0.1:5000`
    *   **Halaman Login Admin:** `http://127.0.0.1:5000/login`

## 📊 Dashboard Admin

Aplikasi ini dilengkapi dengan dashboard admin yang dilindungi untuk memonitor aktivitas.

*   **Akses:** `http://127.0.0.1:5000/dashboard` (akan dialihkan ke halaman login jika belum masuk).
*   **Username Default:** `admin`
*   **Password:** Password yang Anda atur pada langkah 5b.

**Fitur Dashboard:**
*   **Popularitas Tema:** Diagram lingkaran yang menunjukkan tema mana yang paling sering dimainkan.
*   **Saran & Masukan:** Tabel berisi semua saran yang dikirimkan oleh pengguna, diurutkan dari yang terbaru.
*   **Log Akses Terakhir:** Melihat siapa saja yang memulai permainan baru, tema apa yang mereka pilih, dan kapan.

## 📁 Struktur Proyek

```
qrossword-app/
├── app.py              # File utama Flask, routing, dan logika inti
├── create_admin.py     # Skrip untuk membuat password hash admin
├── modules/
│   ├── ai_generator.py   # Logika untuk memanggil Gemini API
│   ├── background_generator.py # Logika untuk memeriksa & mengisi stok puzzle
│   ├── database.py       # Fungsi untuk interaksi dengan database SQLite
│   ├── grid_builder.py   # Algoritma untuk menyusun kata menjadi grid TTS
│   ├── name_generator.py # Fungsi untuk membuat nama dinosaurus random
│   └── user.py           # Model User untuk Flask-Login
├── static/
│   ├── css/
│   │   ├── dashboard.css # Styling khusus untuk dashboard
│   │   └── style.css     # Styling utama untuk game
│   └── js/
│       ├── dashboard.js  # Logika frontend untuk dashboard
│       ├── main.js       # Logika frontend utama (versi modular)
│       └── modules/      # Modul-modul JavaScript
├── templates/
│   ├── dashboard.html  # Halaman dashboard admin
│   ├── index.html      # Halaman utama game
│   └── login.html      # Halaman login admin
├── .env                  # (File yang Anda buat) Menyimpan API Key
├── crossword.db        # File database SQLite (dibuat otomatis)
└── requirements.txt      # Daftar library Python yang dibutuhkan
```

## 🔮 Potensi Peningkatan

*   **Manajemen User:** Dashboard untuk menambah atau mengubah akun admin.
*   **Analitik Lanjutan:** Grafik tren harian/mingguan untuk jumlah pemain.
*   **Manajemen Cache:** Tombol di dashboard untuk memaksa pengisian ulang stok puzzle.
*   **PWA (Progressive Web App):** Membuat aplikasi dapat diinstal di perangkat dan dimainkan secara offline.