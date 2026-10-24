import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Trash2, Upload, Volume2, VolumeX, X } from 'lucide-react';
import BottomSheet from './BottomSheet';
import Segmented from './Segmented';
import { parseBackup } from '../lib/backup';
import { formatLastBackup } from '../lib/backupReminder';
import { toDateKey } from '../lib/dates';
import { formatPeriod, getLeavePeriod } from '../lib/leave';
import { playSuccess, setSoundEnabled } from '../lib/sound';
import type { Backup, SaveResult } from '../lib/backup';
import type { Settings, ThemeMode } from '../types';

type Props = {
  open: boolean;
  settings: Settings;
  onThemeChange: (theme: ThemeMode) => void;
  onSoundChange: (enabled: boolean) => void;
  onLeaveChange: (patch: Partial<Pick<Settings, 'annualLeaveDays' | 'hireDate' | 'leaveCarryOver'>>) => void;
  onBackup: () => Promise<SaveResult>;
  onRestore: (backup: Backup) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  onClose: () => void;
};

export default function SettingsSheet({ open, ...rest }: Props) {
  return <AnimatePresence>{open && <SettingsContent {...rest} />}</AnimatePresence>;
}

type Confirm = { kind: 'restore'; backup: Backup } | { kind: 'delete' } | null;
type Message = { ok: boolean; text: string } | null;

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
  { value: 'system', label: 'Sistem' },
];

const DANGER = '#dc2626';

function SettingsContent({
  settings,
  onThemeChange,
  onSoundChange,
  onLeaveChange,
  onBackup,
  onRestore,
  onDeleteAll,
  onClose,
}: Omit<Props, 'open'>) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [message, setMessage] = useState<Message>(null);
  const [busy, setBusy] = useState(false);

  const handleBackup = async () => {
    setMessage(null);
    const result = await onBackup();
    if (result === 'downloaded') setMessage({ ok: true, text: 'Yedek dosyası indirildi.' });
    if (result === 'shared') setMessage({ ok: true, text: 'Yedek dosyası paylaşıldı.' });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    try {
      const backup = parseBackup(await file.text());
      setConfirm({ kind: 'restore', backup });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Dosya okunamadı.' });
    }
  };

  const runConfirmed = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'restore') {
        await onRestore(confirm.backup);
        setMessage({ ok: true, text: `${confirm.backup.entries.length} kayıt geri yüklendi.` });
      } else {
        await onDeleteAll();
        setMessage({ ok: true, text: 'Tüm veriler silindi.' });
      }
    } catch {
      setMessage({ ok: false, text: 'İşlem tamamlanamadı. Lütfen tekrar dene.' });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <BottomSheet title="Ayarlar" onClose={onClose}>
      <SectionLabel>Tema</SectionLabel>
      <Segmented
        label="Tema"
        options={THEME_OPTIONS}
        value={settings.theme}
        onChange={onThemeChange}
      />

      <SectionLabel>Ses</SectionLabel>
      <button
        type="button"
        role="switch"
        aria-checked={settings.sound}
        onClick={() => {
          const next = !settings.sound;
          onSoundChange(next);
          if (next) {
            setSoundEnabled(true); // ayar state'i güncellenmeden önce de çalsın
            playSuccess();
          }
        }}
        className="flex h-12 w-full items-center justify-between rounded-2xl px-4 text-left font-medium"
        style={{ background: 'var(--bg)', color: 'var(--text)' }}
      >
        <span className="flex items-center gap-3">
          {settings.sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
          Kayıt sesleri
        </span>
        <span
          aria-hidden
          className="relative h-7 w-12 rounded-full transition-colors"
          style={{ background: settings.sound ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          <motion.span
            className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow"
            animate={{ x: settings.sound ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          />
        </span>
      </button>

      <SectionLabel>Yıllık izin</SectionLabel>
      <div className="rounded-2xl" style={{ background: 'var(--bg)' }}>
        <FieldRow label="Yıllık hak (gün)">
          <DayCountInput
            label="Yıllık izin hakkı (gün)"
            value={settings.annualLeaveDays}
            onCommit={(annualLeaveDays) => onLeaveChange({ annualLeaveDays })}
          />
        </FieldRow>
        <FieldRow label="Devreden gün" divider>
          <DayCountInput
            label="Önceki dönemden devreden gün"
            value={settings.leaveCarryOver}
            onCommit={(leaveCarryOver) => onLeaveChange({ leaveCarryOver })}
          />
        </FieldRow>
        <FieldRow label="İşe giriş tarihi" divider>
          <div className="flex items-center gap-1">
            {settings.hireDate && (
              <button
                type="button"
                onClick={() => onLeaveChange({ hireDate: undefined })}
                aria-label="İşe giriş tarihini temizle"
                className="flex h-11 w-9 items-center justify-center rounded-full"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            )}
            <input
              type="date"
              aria-label="İşe giriş tarihi"
              value={settings.hireDate ?? ''}
              max={toDateKey(new Date())}
              onChange={(e) => onLeaveChange({ hireDate: e.target.value || undefined })}
              className="h-10 rounded-xl px-2 outline-none"
              style={{ background: 'var(--surface)', color: 'var(--text)' }}
            />
          </div>
        </FieldRow>
      </div>
      <p className="mt-2 px-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        {settings.hireDate ? 'Dönem' : 'Dönem (işe giriş tarihi girilmediği için takvim yılı)'}:{' '}
        {formatPeriod(getLeavePeriod(new Date(), settings.hireDate))}. Devreden gün yalnızca
        bu döneme eklenir; yeni dönemde güncelle.
      </p>

      <SectionLabel>Veriler</SectionLabel>
      <div className="space-y-2">
        <ActionButton icon={<Download size={20} />} onClick={handleBackup}>
          Yedekle
        </ActionButton>
        <p className="px-4 pb-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatLastBackup(settings.lastBackupAt)}
        </p>
        <ActionButton icon={<Upload size={20} />} onClick={() => fileInput.current?.click()}>
          Geri yükle
        </ActionButton>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = ''; // aynı dosya tekrar seçilebilsin
          }}
        />
        <ActionButton
          icon={<Trash2 size={20} />}
          color={DANGER}
          onClick={() => {
            setMessage(null);
            setConfirm({ kind: 'delete' });
          }}
        >
          Tüm verileri sil
        </ActionButton>
      </div>

      {confirm && (
        <motion.div
          role="alertdialog"
          className="mt-3 rounded-2xl p-4"
          style={{ background: 'var(--bg)' }}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm">
            {confirm.kind === 'restore'
              ? `Yedekte ${confirm.backup.entries.length} kayıt var. Mevcut tüm veriler bu yedekle değiştirilecek.`
              : 'Tüm mesai kayıtları ve ayarlar silinecek. Bu işlem geri alınamaz.'}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfirm(null)}
              disabled={busy}
              className="h-11 rounded-xl font-semibold"
              style={{ background: 'var(--surface)', color: 'var(--text)' }}
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => void runConfirmed()}
              disabled={busy}
              className="h-11 rounded-xl font-semibold text-white disabled:opacity-60"
              style={{ background: confirm.kind === 'delete' ? DANGER : 'var(--accent)', color: confirm.kind === 'delete' ? '#fff' : 'var(--on-fill)' }}
            >
              {confirm.kind === 'restore' ? 'Geri yükle' : 'Evet, sil'}
            </button>
          </div>
        </motion.div>
      )}

      {message && (
        <motion.p
          key={message.text}
          role="status"
          className="mt-3 text-center text-sm"
          style={{ color: message.ok ? 'var(--leave)' : DANGER }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {message.text}
        </motion.p>
      )}
    </BottomSheet>
  );
}

function FieldRow({
  label,
  divider,
  children,
}: {
  label: string;
  divider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-12 items-center justify-between gap-3 px-4"
      style={divider ? { borderTop: '1px solid color-mix(in srgb, var(--text-muted) 18%, transparent)' } : undefined}
    >
      <span className="text-[15px]">{label}</span>
      {children}
    </div>
  );
}

/** 0–366 arası tam gün sayısı girişi; odaktan çıkınca kaydedilir, geçersizse eski değere döner. */
function DayCountInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const n = Number(draft);
    if (draft.trim() !== '' && Number.isInteger(n) && n >= 0 && n <= 366) {
      if (n !== value) onCommit(n);
    } else {
      setDraft(String(value));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={draft}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="h-10 w-20 rounded-xl px-3 text-right outline-none"
      style={{ background: 'var(--surface)', color: 'var(--text)' }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2 mt-4 px-1 text-xs font-semibold uppercase tracking-wide first:mt-0"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </p>
  );
}

function ActionButton({
  icon,
  color,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left font-medium transition-opacity active:opacity-70"
      style={{ background: 'var(--bg)', color: color ?? 'var(--text)' }}
    >
      {icon}
      {children}
    </button>
  );
}
