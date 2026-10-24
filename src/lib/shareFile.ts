export type SaveResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Dosyayı kaydeder/paylaşır. Dokunmatik cihazlarda (iPhone) paylaşım menüsü açılır
 * ("Dosyalara Kaydet", "Mesajlar" vb.); olmazsa ya da masaüstünde doğrudan indirilir.
 * Paylaşım menüsü dokunuş anında açılmalı; bu yüzden bir tıklama işleyicisinden çağır.
 */
export async function shareOrDownload(file: File, title: string): Promise<SaveResult> {
  if (navigator.maxTouchPoints > 0 && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // Paylaşım başarısızsa indirmeye düş.
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
