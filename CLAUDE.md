# Mesai Takip — iOS PWA

Kişisel kullanım için, iPhone'da ana ekrana eklenerek kullanılacak bir mesai (fazla çalışma) takip uygulaması.
Tek kullanıcı, sunucu yok, hesap yok. Tüm veriler cihazda saklanır.

> Claude için not: Bu projeyi **aşağıdaki adımlar sırasıyla** geliştir. Her adımın sonunda dur, ne yaptığını kısaca özetle ve kullanıcıdan onay al. Onay gelmeden bir sonraki adıma geçme. Arayüz metinlerinin hepsi **Türkçe** olacak.

---

## Teknoloji

| Katman | Seçim |
|---|---|
| Çatı | React 18 + TypeScript |
| Derleme | Vite |
| Stil | Tailwind CSS |
| Animasyon | Framer Motion (sadece hafif geçişler için) |
| İkonlar | lucide-react |
| Tarih | date-fns (`tr` locale) |
| Veri | IndexedDB, `idb-keyval` veya Dexie ile |
| PWA | vite-plugin-pwa (manifest + service worker, offline çalışma) |
| Yayın | GitHub Pages (ücretsiz, alan adı gerekmez) |

Kurallar:
- Ekstra bağımlılık ekleme. Yukarıdakilerin dışında bir paket gerekiyorsa önce sor.
- Backend, giriş sistemi ve analitik yok.
- Bundle küçük kalsın, uygulama anında açılsın.

---

## Ekranlar ve Özellikler

### 1. Üst Özet Kartı (ana ekranın en üstü)

Göze hoş gelen, modern bir kart: yumuşak gradient, yuvarlak köşeler (`rounded-3xl`), hafif gölge ve hafif cam efekti (glassmorphism).

İçerik (seçili **takvim ayı** için):
- **Toplam mesai saati.** Her zaman görünür. Örnek: `24,5 saat`
- **Toplam mesai ücreti (₺).** Varsayılan olarak **gizli**.
- **Saatlik mesai ücreti.** Varsayılan olarak **gizli**, düzenlenebilir.
- İzinli gün sayısı. Küçük bir etiket olarak gösterilir.

**Gizlilik:**
- Para ile ilgili alanlar (toplam ücret ve saatlik ücret) açılışta **her zaman gizli** olur. Gizliyken `••••• ₺` şeklinde ya da blur'lu görünür.
- Kartın köşesinde bir **göz ikonu** (`Eye` / `EyeOff`) bulunur. Tek dokunuşla açılır ve kapanır.
- "Açık" durumu **kaydedilmez**. Uygulama yeniden açıldığında ya da arka plandan döndüğünde (`visibilitychange`) para alanları otomatik olarak tekrar gizlenir.
- Saatlik ücret yalnızca alan açıkken düzenlenebilir. Düzenleme için kalem ikonuna dokunulur, sayısal klavye açılır (`inputMode="decimal"`), Türkçe ondalık virgülü kabul edilir.

**Hesaplama:** `toplam ücret = toplam mesai saati × saatlik ücret`. Tek ücret uygulanır, çarpan yoktur.
Para formatı: `Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })`.

### 2. Takvim

- Aylık görünüm, hafta **pazartesi** ile başlar, gün ve ay adları Türkçe.
- Üstte `‹ Ekim 2026 ›` şeklinde ay geçişi bulunur. Yatay kaydırma (swipe) ile de ay değiştirilebilir.
- Özet kartı her zaman takvimde seçili ayı gösterir.
- Bugünün tarihi belirgin bir halka ile işaretlenir.
- Gün hücreleri:
  - **Mesai girilmiş gün:** vurgu renginde dolgu ve küçük bir saat etiketi (ör. `3s`).
  - **İzinli gün:** farklı bir renk (ör. yeşil/teal tonu) ve "İzin" etiketi ya da ikonu.
  - **Boş gün:** sade görünüm.
- Takvimin altında küçük bir renk açıklaması (lejant) bulunur: Mesai / İzin.

### 3. Gün Düzenleme (Bottom Sheet)

Bir güne dokununca alttan yukarı kayan bir panel (bottom sheet) açılır. Başlığında tarih yazar, ör. "Pazar, 25 Ekim".

Panelde iki seçenekli bir sekme (segmented control) bulunur: **Mesai | İzin**

- **Mesai seçiliyse:**
  - Dikey kaydırmalı saat seçici (iOS tarzı çark): 1 – 24 saat, tam saatler. Butonlara tek tek basmadan kaydırarak seçilir.
  - İsteğe bağlı kısa not alanı
- **İzin seçiliyse:**
  - O gün izinli olarak işaretlenir. Bir gün aynı anda hem mesai hem izin olamaz.
- Alt butonlar: **Kaydet** ve **Temizle** (günün kaydını siler).
- Panel, arka plana dokunarak ya da aşağı kaydırarak kapatılabilir.
- Kayıt **"Kaydet" butonuyla** yapılır: gün → saati kaydırarak seç → Kaydet. Otomatik kayıt şimdilik yok.
- Kodu, ileride otomatik kayda kolayca geçilebilecek şekilde yaz. Örneğin `AUTO_SAVE` adında bir sabit `false` olarak tanımlansın; `true` yapıldığında seçicideki bir saate dokunmak kaydı yapıp paneli kapatsın.

### 4. Ayarlar (küçük dişli ikonu)

- **Tema:** Açık / Koyu / Sistem. Seçim kaydedilir.
- **Yedekle:** Tüm verileri `.json` dosyası olarak indirir.
- **Geri yükle:** Yedek `.json` dosyasını içe aktarır.
- **Tüm verileri sil:** Onay ister.
- **Renk paleti:** Başlığın solundaki palet ikonu. 8 hazır palet (`src/lib/palettes.ts`), dokununca anında uygulanır, seçim kaydedilir ve yedeğe girer.
- **Ses:** Yalnızca kayıt/temizle sırasında çok hafif, ince bir ses. Ayarlardan kapatılabilir.

---

## Veri Modeli

```ts
type DayEntry = {
  date: string;        // 'YYYY-MM-DD'
  type: 'mesai' | 'izin';
  hours?: number;      // sadece 'mesai' için, tam saat (1–24)
  note?: string;
};

type Settings = {
  hourlyRate: number;  // ₺
  theme: 'light' | 'dark' | 'system';
};
```

- Kayıtlar IndexedDB'de `date` anahtarıyla tutulur.
- Uygulama ilk açılışta `navigator.storage.persist()` çağırarak kalıcı depolama izni ister.
- Toplamlar her seferinde kayıtlardan hesaplanır, ayrıca saklanmaz.

---

## Tasarım Kuralları

- Mobil öncelikli, iPhone ekranına göre tasarlanır (`max-w-md mx-auto`).
- Çentik ve home çubuğu için `env(safe-area-inset-*)` kullanılır, `viewport-fit=cover` ayarlanır.
- Font: sistem fontu (`-apple-system`, SF Pro). Sayılarda `tabular-nums` kullanılır.
- Açık ve koyu temanın her ikisi de özenle tasarlanır. Renkler CSS değişkenleri ile tanımlanır, Tailwind `dark:` sınıfları kullanılır.
- Dokunma alanları en az 44×44 px olur. Yanlışlıkla zoom olmaması için input font-size en az 16px olur.
- Geçişler kısa tutulur (150–250 ms). Ağır animasyon kullanılmaz.
- iOS PWA meta etiketleri eklenir: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon` (180×180), tema rengi.
- Uygulama adı: **Mesai**. İkon: sade, saat temalı bir ikon (SVG'den PNG'ler üretilir).

---

## Geliştirme Adımları

1. **Kurulum:** Vite + React + TS + Tailwind projesini oluştur, klasör yapısını kur, boş ana ekranı göster.
2. **Veri katmanı:** IndexedDB kayıt/okuma, `DayEntry` ve `Settings` için hook'lar (`useEntries`, `useSettings`).
3. **Takvim:** Aylık görünüm, ay geçişi, swipe, gün durum renkleri.
4. **Gün düzenleme paneli:** Bottom sheet, Mesai/İzin seçimi, kaydırmalı saat seçici, kaydet/temizle.
5. **Özet kartı:** Toplamlar, göz ikonuyla gizleme, saatlik ücret düzenleme, otomatik yeniden gizleme.
6. **Tema ve ayarlar:** Açık/koyu/sistem, yedekle/geri yükle, verileri sil.
7. **PWA:** Manifest, ikonlar, service worker, offline test, iOS meta etiketleri.
8. **Yayın:** GitHub Pages'e deploy (`vite.config.ts` içinde `base: '/mesai/'`, GitHub Actions workflow). Kullanıcıya adım adım şunları anlat: GitHub reposu oluşturma, push etme, Pages'i açma.
9. **iPhone'a kurulum rehberi:** README'ye yaz. Safari'de adresi aç → Paylaş → "Ana Ekrana Ekle".
10. **Proje notları:** Her şey bittikten sonra `PROJE_NOTLARI.md` oluştur. Gelecekte değişiklik yapmak için: proje yapısı, her dosyanın görevi, alınan kararlar ve nedenleri, ayarlanabilir sabitler (`src/lib/config.ts`), veri modeli ve yedek formatı, bilinen sınırlar, "şunu eklemek/çıkarmak için nereye bakılır" tarifleri, sık komutlar.

Her adımda:
- `npm run build` hatasız tamamlanmalı.
- Kullanıcıya `npm run dev -- --host` ile aynı Wi-Fi ağındaki telefondan nasıl test edeceğini hatırlat.

---

## Kabul Kriterleri

- [ ] Uygulama açılışında para alanları gizlidir. Göz ikonuna tek dokunuşla görünür.
- [ ] Arka plandan dönüldüğünde para alanları tekrar gizlenir.
- [ ] Bir güne dokunup mesai saati veya izin girilebilir, takvimde hemen görünür.
- [ ] Ay değiştirildiğinde özet kartı o ayın toplamlarını gösterir.
- [ ] Açık ve koyu tema düzgün çalışır.
- [ ] Ana ekrana eklendikten sonra internet olmadan açılır ve çalışır.
- [ ] Yedekle/geri yükle ile veriler kaybolmadan taşınabilir.
