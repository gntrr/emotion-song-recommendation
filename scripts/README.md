# Scripts

Utility scripts untuk keperluan development dan persiapan deployment.

---

## `export_onnx.py`

Mengkonversi model Mini-Xception dari format Keras H5 (`.h5`) ke ONNX (`.onnx`).

### Kenapa perlu dikonversi?

Backend produksi (Docker) menggunakan `onnxruntime` alih-alih TensorFlow karena:
- TensorFlow 2.10 dikompilasi dengan instruksi **SSE4.1/AVX** yang tidak tersedia di semua server
- `onnxruntime` tidak bergantung pada CPU extension tersebut — berjalan di x86, ARM, dan cloud VPS manapun
- Docker image jadi lebih ringan (tidak perlu install TensorFlow ~600 MB)

### Cara pakai

Jalankan **sekali** dari root repositori, menggunakan virtual environment backend:

```bash
cd backend
uv add --dev tf2onnx
uv run python ../scripts/export_onnx.py
```

Output yang diharapkan:

```
Loading weights from: /path/to/models/mini_xception_final.h5
  params: 57,264
ONNX saved → /path/to/models/mini_xception_final.onnx
```

Setelah selesai, hapus `tf2onnx` dari dev deps:

```bash
uv remove --dev tf2onnx
```

### Setelah konversi

1. Commit file `models/mini_xception_final.onnx` ke repositori
2. Push ke remote → Docker rebuild otomatis menggunakan ONNX Runtime
3. Backend akan memilih backend secara otomatis:
   - Jika `mini_xception_final.onnx` ada → **ONNX Runtime** (produksi)
   - Jika hanya `.h5` → **TensorFlow** (fallback, lokal saja)

### Prasyarat

| Tools | Versi |
|-------|-------|
| Python | 3.10 |
| TensorFlow | 2.10.x |
| tf2onnx | latest |
| uv | latest |

> `tf2onnx` hanya dibutuhkan saat menjalankan script ini, bukan di runtime produksi.
