# Sağlıklı Yaşam Uygulaması - Kurulum

## 1. Gerekli Araçları Kur

### Node.js (bir kez kurulur)
Terminal'i aç ve çalıştır:
```bash
# Homebrew ile (önerilen)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node

# Veya doğrudan: https://nodejs.org → "LTS" versiyonu indir
```

### iPhone'una Expo Go uygulamasını kur
App Store'dan **"Expo Go"** uygulamasını indir (ücretsiz).

---

## 2. Projeyi Çalıştır

Terminal'de şu klasöre gel:
```bash
cd ~/Desktop/saglikli_yasam_app
```

Bağımlılıkları yükle (sadece ilk kez):
```bash
npm install
```

Uygulamayı başlat:
```bash
npx expo start
```

---

## 3. iPhone'da Aç

1. Expo Go uygulamasını aç
2. **"Scan QR Code"** seçeneğine bas
3. Terminal'de gözüken QR kodu tara
4. Uygulama iPhone'unda açılır! 🎉

> **Not:** Mac ve iPhone aynı Wi-Fi'ya bağlı olmalı.

---

## Uygulama Özellikleri

### Bugün Sekmesi
- Her aktiviteyi **bir kez tıklayarak** işaretle (tam puan)
- **Uzun bas** → kısmi puan gir (örn: %50 ile vitamin içildi)
- Yürüyüş için km gir
- Sosyal medya süresini seç veya yaz
- Üstte anlık puanın gösterilir

### Puan Sistemi
| Puan | Kategori |
|------|----------|
| 100+ | 🏆 Mükemmel |
| 85-100 | 🙂 Daha İyi Olabilirsin |
| 70-85 | 😐 Vasat |
| <70 | 😞 Berbat |

### Sabah (maks 50 puan - haftaiçi, 40 haftasonu)
- 🧘 Yoga — 10 puan
- 💪 Mekik + Squat — 10 puan
- 💊 Vitamin — 10 puan
- 🦷 Diş Fırçala — 10 puan
- 📖 İngilizce (hafta içi) — 10 puan

### Akşam (maks 50 puan - haftaiçi, 30 haftasonu)
- 💊 Vitamin — 10 puan
- 💪 Mekik + Squat — 10 puan
- 🦷 Diş Fırçala — 10 puan
- 📚 İngilizce Kitap (hafta içi) — 10 puan
- 💼 Mesleki Çalışma — 10 puan

### Günlük Bonus
- 🏋️ Spor — 20 puan
- 🚶 Yürüyüş — 10 puan/km
- 💧 Su — 2 puan/bardak
- 📕 Kitap — 1 puan/sayfa
- 📱 Sosyal medya — (50 - dakika) × 0.167 puan

### Geçmiş Sekmesi
- Aylık takvim görünümü
- Renk kodlu puanlar
- Günlük aktivite özeti

### İstatistik Sekmesi
- Bu ay ve yıllık ortalama
- 10.000 km yürüyüş hedef takibi
- Günlük puan grafiği
- Aylık ortalama bar chart
- Sabah/akşam aktivite başarı oranları

---

## Kısmi Puan Kullanımı

Bir aktiviteyi **uzun basarak** açılan modalda:
- Yüzde değeri gir (0-100)
- Hızlı butonlar: %25, %50, %75, %100
- Örn: Vitaminlerin 1/3'ünü içtiysen → **33%** yaz

Su ve kitap sayfası için direkt sayı girilir.
