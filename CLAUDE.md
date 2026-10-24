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

> **Durum:** Adım 1–12, 14 ve 18 tamamlandı; 13 bilerek ertelendi. 1–14 canlıda (https://cansenyurt30.github.io/mesai/); 18 push bekliyor.
> **Sıradaki adım:** 16 (sonra 17 → 15; 13 daha sonra). Kaldığın yeri anlamak için önce `PROJE_NOTLARI.md`'yi oku.

### Tamamlananlar (1–12)

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

### Yeni adımlar (11–18)

**Önemli: uygulama canlıda ve içinde gerçek veri var.**
- Veri modelini değiştiren adımlarda (13, 14, 16) mevcut kayıtlar ve ayarlar **kaybolmamalı, bozulmamalı**.
- Eski veriyi yeni şekle çeviren bir geçiş (migration) yaz. Bu geçiş uygulama açılışında, `db.ts` / `useSettings` içinde bir kez çalışsın.
- Eski sürümden alınmış yedekler (`version: 1`) yeni sürümde **geri yüklenebilmeli**. Yeni yedekler `version: 2` olsun.
- Bu adımların sonunda kullanıcıya şunu hatırlat: yeni sürümü yayınlamadan önce telefonda **Ayarlar → Yedekle** ile yedek alsın.

---

#### 11. Eski "0,5 adımlı" ifadelerini düzelt

Saat seçimi artık **tam saat (1–24)**. Eski ifadeleri temizle:
- `src/types/index.ts` içindeki `hours` yorumunu `// sadece 'mesai' için, tam saat (1–24)` yap.
- Projede `0.5`, `0,5`, `yarım saat` ve `adımlı` kelimelerini ara. Kodda ve yorumlarda kalan eski ifadeleri güncelle.
- Kalmasına izin verilenler:
  - `PROJE_NOTLARI.md` içindeki "yarım saati geri getirmek" tarifi.
  - Eski yarım saatli kayıtların takvimde gösterilmesi (`formatHours*`). Bu davranışa dokunma.

#### 12. README'yi repoya ekle

- `README.md` içeriğinin güncel olduğunu kontrol et:
  - canlı adres
  - iPhone'a kurulum (Safari → Paylaş → Ana Ekrana Ekle)
  - yedek alma hatırlatması
- `git add README.md` ve commit hazırla.
- **Push'u kullanıcı yapacak.** Komutu (`git push`) kullanıcıya göster, kendin push etme.
- `PROJE_NOTLARI.md` içindeki "Bekleyen: README" satırını güncelle.

#### 13. Ücret geçmişi (zamlar geçmişi bozmasın)

Sorun: Şu an toplam ücret, o anki tek saatlik ücretle hesaplanıyor. Ücret değişince geçmiş ayların kazancı da değişiyor.

- **Veri:** `Settings.hourlyRate: number` yerine şu alanı kullan:
  `rates: { from: 'YYYY-MM-DD'; rate: number }[]` (tarihe göre sıralı)
- **Geçiş:** Eski `hourlyRate > 0` ise `rates = [{ from: '2000-01-01', rate: hourlyRate }]` olsun. Böylece mevcut tüm kayıtlar aynı ücretle kalır.
- **Hesap:** Her mesai günü, o tarihte geçerli ücretle hesaplanır. Geçerli ücret, `from <= tarih` olan en son kayıttır.
  - `lib/summary.ts` toplam ücreti gün gün toplasın.
  - Kart çarpma işlemi (`saat × ücret`) yapmasın.
  - Hesap mantığını ayrı, saf fonksiyonlar halinde yaz (`lib/rates.ts`).
- **Özet kartı:**
  - "Saatlik ücret" satırı, seçili ayda geçerli ücreti gösterir.
  - Ay içinde ücret değiştiyse altında küçük bir not çıkar: "Bu ay 2 farklı ücret".
- **Ücret değiştirme:** Kalem ikonuyla yeni ücret girilince küçük bir seçim çıksın:
  - **"Bu aydan itibaren"** (varsayılan, seçili ayın 1'i)
  - **"Tarih seç"**
- **Ayarlar → Ücret geçmişi:** Listeyi göster, ekle, düzenle, sil. Örnek satır: `1 Ocak 2026'dan itibaren · 250,00 ₺`
  - **Gizlilik kuralı burada da geçerli:** Liste gizli başlar ve göz ikonuyla açılır. Arka plandan dönünce yeniden gizlenir.
- **Yedek:**
  - `version: 2` yedeğe `rates` girer.
  - `version: 1` yedek geri yüklenirken `hourlyRate`, yukarıdaki geçişle `rates`'e çevrilir.

#### 14. Yedek hatırlatıcısı

- **Veri:** `Settings`'e iki alan ekle:
  - `lastBackupAt?: string` (ISO tarih)
  - `backupSnoozeUntil?: string`
  - Bu ikisi yedek dosyasına **yazılmaz**. Geri yükleme de bu alanları değiştirmez.
- Yedekleme başarılı olunca (`shared` ya da `downloaded`) `lastBackupAt` güncellenir. `cancelled` olursa güncellenmez.
- **Ayarlar:** Yedekle butonunun altında durum yazısı gösterilir: "Son yedek: 12 gün önce" ya da "Henüz yedek alınmadı".
- **Hatırlatma kartı:** Özet kartının altında, ince ve sade bir uyarı.
  - Şu durumlarda görünür:
    - son yedek `BACKUP_REMIND_DAYS` (config, varsayılan **30**) günden eskiyse, ya da
    - hiç yedek yoksa ve ilk kayıt 7 günden eskiyse.
  - Yazı: "Son yedeğin 34 gün önce" + **[Yedekle]** butonu (doğrudan yedekler) + **[Sonra]** butonu.
  - "Sonra" uyarıyı `BACKUP_SNOOZE_DAYS` (varsayılan **7**) gün gizler.

#### 15. İstatistik ekranı

- Başlığa yeni bir ikon ekle (`BarChart3`). Dokununca tam yükseklikte bir bottom sheet açılır.
- Üstte yıl seçici: `‹ 2026 ›`
- **Aylık saat grafiği:** 12 ay için çubuk grafik.
  - **Ek paket kullanma.** Grafiği SVG ile elle çiz.
  - Renk `--accent`.
  - Çubuğa dokununca o ayın değeri gösterilsin. İkinci dokunuşta paneli kapatıp takvimi o aya götürsün.
- **Özet kutucukları:**
  - yıllık toplam saat
  - aylık ortalama
  - en çok mesai yapılan ay
  - toplam izin günü (tür kırılımıyla, adım 16'dan sonra)
- **Yıllık toplam kazanç:** Adım 13'teki hesapla, gün gün hesaplanır. Bu alan da **gizli başlar**, aynı göz ikonu kuralı geçerli.
- Veri olmayan yıl için sade bir boş durum göster: "Bu yıl için kayıt yok".

#### 16. İzin türleri ve yıllık izin hakkı

**Başlamadan kullanıcıya sor:**
1. Yıllık izin hakkı hangi döneme göre sayılsın? **Takvim yılı** (1 Ocak) mı, **işe giriş tarihi yıldönümü** mü?
2. Yıllık kaç gün hakkı var?
3. Önceki yıldan devreden gün olsun mu?

- **Veri:** `DayEntry`'ye `leaveType?: 'genel' | 'yillik' | 'rapor' | 'mazeret'` alanını ekle.
  - Türü olmayan eski izin kayıtları **`genel`** sayılır. `genel` haftalık ya da normal izin demektir.
- **Gün paneli:** "İzin" seçiliyken tür çipleri görünür: Genel · Yıllık · Rapor · Mazeret. Varsayılan Genel.
- **Takvim:** Tüm izinler `--leave` renginde kalır. Hücre etiketi türü gösterir: İzin / Yıllık / Rapor / Mazeret.
  - Etiket sığmazsa kısalt: Yıl. / Rap. / Maz.
- **Ayarlar:** "Yıllık izin hakkı (gün)" alanı ekle. Kullanıcının cevaplarına göre dönem başlangıcı ve devreden gün alanlarını da ekle.
- **Özet kartı:** "X gün izin" çipinin yanında bir çip daha göster: "Yıllık izin: 9 / 14 kaldı". Bu bilgi para değil, gizlenmez.
- **Uyarı:** Hak aşılırsa engelleme. Sadece nazik bir uyarı göster: "Yıllık izin hakkını 2 gün aştın".
- **Yedek:** `leaveType` ve yeni ayarlar yedeğe girer. Eski yedekte bu alanlar yoksa `genel` / varsayılan değerler kullanılır.

#### 17. Çoklu gün seçimi

- Takvim başlığına **"Seç"** butonu ekle. Dokununca seçim modu açılır.
  - Günlere dokunarak seç ya da seçimi kaldır. Seçili günler belirgin bir çerçeveyle görünür.
  - Seçim modunda swipe ile ay değiştirme kapalıdır, aylar oklarla geçilir. Aylar arası seçim korunur.
  - Mümkünse: bir güne uzun basıp sürükleyerek aralık seçme. Swipe ile çakışıyorsa bu özelliği atla ve kullanıcıya söyle.
- Altta sabit bir bar görünür: "5 gün seçildi" + **[İşaretle]** + **[Vazgeç]**
- **[İşaretle]** gün paneline benzeyen bir panel açar:
  - **Mesai** (saat çarkı) ya da **İzin** (tür çipleri). Seçim tüm günlere uygulanır.
  - Ayrıca **Temizle** seçeneği bulunur.
- Seçilen günlerde mevcut kayıt varsa onay iste: "3 günde zaten kayıt var. Üzerine yazılsın mı?"
- Yıllık izin hakkı aşılacaksa adım 16'daki uyarı burada da gösterilir.
- Kayıtları tek seferde yaz: `setMany`, tek bir state güncellemesi, tek ses.

#### 18. Küçük dokunuşlar

- **Notlu günler:** Notu olan günlerde, hücrenin alt köşesinde küçük bir nokta görünür.
- **Bugün butonu:** Takvim bugünün ayında değilse ay başlığının yanında küçük bir "Bugün" butonu çıkar. Dokununca bugünün ayına döner.
- **Ay raporunu paylaş:**
  - Özet kartında bir paylaş ikonu olur. Seçili ayın özetiyle bir **PNG** oluşturulur:
    - ay adı
    - toplam saat
    - izin günleri
    - mesai yapılan günlerin listesi
  - PNG'yi **canvas ile, ek paket kullanmadan** üret. Paylaşım menüsüyle gönder (`navigator.share`). Paylaşım olmazsa dosyayı indir.
  - Paylaşmadan önce sor: **"Ücret bilgisi eklensin mi?"** Varsayılan **hayır**.
- **Kayıt hatası bildirimi:** `useEntries` içinde IndexedDB yazımı başarısız olursa ekran eski haline dönsün. Kısa bir uyarı göster: "Kaydedilemedi, tekrar dene". Şu an hata sessizce yutuluyor.

---

### Her adımda

- `npm run build` hatasız tamamlanmalı.
- Kullanıcıya `npm run dev -- --host` ile aynı Wi-Fi ağındaki telefondan nasıl test edeceğini hatırlat.
- Değişen yapıyı, yeni ayarları ve yeni kararları `PROJE_NOTLARI.md`'ye işle. Özellikle "Veri modeli", "Yedek dosyası" ve "Şunu yapmak için nereye bakılır" bölümlerini güncelle.
- Adım bitince commit hazırla ve mesajı Türkçe ve kısa yaz. **Push'u kullanıcı onaylamadan yapma.** Push, canlıya yayın demektir.
- Bu dosyanın en üstündeki **Durum** satırını güncelle: hangi adımın bittiği ve sıradaki adım.

---

## Kabul Kriterleri

- [ ] Uygulama açılışında para alanları gizlidir. Göz ikonuna tek dokunuşla görünür.
- [ ] Arka plandan dönüldüğünde para alanları tekrar gizlenir.
- [ ] Bir güne dokunup mesai saati veya izin girilebilir, takvimde hemen görünür.
- [ ] Ay değiştirildiğinde özet kartı o ayın toplamlarını gösterir.
- [ ] Açık ve koyu tema düzgün çalışır.
- [ ] Ana ekrana eklendikten sonra internet olmadan açılır ve çalışır.
- [ ] Yedekle/geri yükle ile veriler kaybolmadan taşınabilir.

**Yeni adımlar için:**
- [x] Kodda ve yorumlarda eski "0,5 adımlı" ifadesi kalmadı.
- [x] README repoda ve güncel. (push sonrası canlı)
- [ ] Ücret değiştirildiğinde geçmiş ayların toplam ücreti değişmez.
- [ ] Eski (`version: 1`) bir yedek, yeni sürümde sorunsuz geri yüklenir.
- [ ] Güncellemeden sonra mevcut kayıtlar ve ücret olduğu gibi durur.
- [x] 30 günden eski yedekte hatırlatma çıkar. "Sonra" denince 7 gün görünmez.
- [ ] İstatistik ekranında yıllık grafik ve toplamlar doğru. Kazanç gizli başlar.
- [ ] İzin türü seçilebilir. Yıllık izin kalan günü doğru sayılır.
- [ ] Birden fazla gün tek seferde mesai ya da izin olarak işaretlenebilir.
- [x] Notlu günlerde nokta görünür, "Bugün" butonu çalışır, ay raporu paylaşılabilir. Ücret, paylaşılan rapora varsayılan olarak eklenmez.
