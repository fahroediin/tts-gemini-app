# Konstanta untuk proses refill
MIN_STOCK = 5       # Pemicu refill jika stok di bawah angka ini
TARGET_STOCK = 10   # Jumlah puzzle yang kita inginkan per kategori

def check_and_refill_stock():
    # Fungsi ini sengaja dibiarkan kosong.
    # Logika sebenarnya akan di-inject oleh app.py saat startup.
    # Ini untuk menghindari circular import.
    print("Placeholder for check_and_refill_stock")
    pass