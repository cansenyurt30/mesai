# Mesai

iPhone'da ana ekrana eklenerek kullanılan kişisel mesai (fazla çalışma) takip uygulaması.
Sunucu yok, hesap yok. Tüm veriler yalnızca telefonda saklanır.

**Canlı adres:** https://cansenyurt30.github.io/mesai/

## iPhone'a kurulum

1. iPhone'da **Safari**'yi aç (Chrome ile ana ekrana eklenemez) ve şu adrese git:
   `https://cansenyurt30.github.io/mesai/`
2. Alttaki **Paylaş** butonuna (yukarı oklu kare) dokun.
3. Listeyi aşağı kaydırıp **Ana Ekrana Ekle**'yi seç.
4. Adın "Mesai" olarak gelir, sağ üstten **Ekle**'ye dokun.
5. Ana ekrandaki **Mesai** ikonundan aç. Artık tam ekran, uygulama gibi çalışır.

Bir kez açıldıktan sonra **internet olmadan da çalışır**. Yeni sürüm yayınlandığında,
internete bağlıyken uygulamayı açman yeterlidir; kendiliğinden güncellenir.

## Kullanım

- **Gün ekle:** Takvimde güne dokun, **Mesai** ya da **İzin** seç. Mesaide saati kaydırarak seç, **Kaydet**'e bas.
- **Gün sil:** Güne dokun, **Temizle**.
- **Ay değiştir:** Üstteki oklar ya da takvimi yana kaydır.
- **Ücret:** Özet kartındaki göz ikonuna dokununca toplam ve saatlik ücret görünür.
  Kalem ikonuyla saatlik ücret girilir. Uygulamadan çıkınca ücretler tekrar gizlenir.
- **Renk paleti (sol üstteki palet ikonu):** 8 hazır renk paletinden birini seç, anında uygulanır.
- **Ayarlar (dişli):** Tema, kayıt sesleri, yedekle, geri yükle, tüm verileri sil.

## Verilerini koru

Veriler telefonun içinde saklanır, sunucuya gitmez. Bu yüzden:

- Uygulamayı silersen ya da telefonu sıfırlarsan veriler gider.
- Ara sıra **Ayarlar → Yedekle** ile `.json` yedeği alıp **Dosyalar**'a kaydet.
- Yeni telefona geçerken ya da bir sorun olursa **Ayarlar → Geri yükle** ile yedeği içe aktar.

## Geliştirme

Gereken: Node.js 22 veya üstü.

```bash
npm install
npm run dev -- --host
```

Terminalde çıkan `Network` adresinin sonuna `/mesai/` ekleyip aynı Wi-Fi'daki telefondan açabilirsin
(ör. `http://192.168.1.20:5173/mesai/`). Bu adres HTTPS olmadığı için çevrimdışı mod bu şekilde test edilemez.

```bash
npm run build     # üretim derlemesi (dist/)
npm run preview   # derlemeyi yerelde dene
```

## Yayınlama

`main` dalına her `git push` işleminde GitHub Actions uygulamayı derleyip GitHub Pages'e yayınlar
(`.github/workflows/deploy.yml`). Repo adı `mesai` olmalıdır; adres `base: '/mesai/'` ayarına bağlıdır.
Kurulum için GitHub'da **Settings → Pages → Source: GitHub Actions** seçili olmalıdır.

## Teknoloji

React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, lucide-react, date-fns,
IndexedDB (`idb-keyval`), vite-plugin-pwa.
