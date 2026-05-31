// Алфавит без визуально похожих символов (нет 0/O/1/I)
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Короткий код вида `XKZ-294` — 3 буквы/цифры, дефис, ещё 3.
 * Используется для шейринга Quick-комнат через ссылку или устно.
 */
export function generateAccessCode(): string {
  const part = (len: number) => {
    let s = "";
    for (let i = 0; i < len; i++) {
      s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return s;
  };
  return `${part(3)}-${part(3)}`;
}

/** TTL Quick-комнаты по умолчанию: 24 часа от создания. */
export const QUICK_ROOM_TTL_MS = 24 * 60 * 60 * 1000;

export function quickRoomExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + QUICK_ROOM_TTL_MS);
}

/** True если у Quick-комнаты истёк expiresAt. Lazy-cleanup проверка. */
export function isQuickRoomExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() < Date.now();
}

/** Нормализация ника: trim + лимиты длины. */
export function normalizeGuestNickname(raw: string): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (trimmed.length < 1 || trimmed.length > 32) return null;
  return trimmed;
}
