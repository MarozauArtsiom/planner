export interface SpScaleEntry {
  value: number;
  label: string;
  durationDays: number;
}

export const DEFAULT_SP_SCALE: SpScaleEntry[] = [
  { value: 0, label: "Не требует усилий", durationDays: 1 },
  { value: 1, label: "Меньше дня работы", durationDays: 2 },
  { value: 2, label: "Полспринта", durationDays: 3 },
  { value: 3, label: "Полная неделя", durationDays: 5 },
  { value: 5, label: "Крупная задача", durationDays: 8 },
  { value: 8, label: "Очень крупная задача", durationDays: 13 },
  { value: 13, label: "Эпик", durationDays: 20 },
];

export function getSpDurationDays(
  sp: number,
  scale: SpScaleEntry[],
  coefficient: number = 1.0,
): number {
  const entry = scale.find((s) => s.value === sp);
  const baseDays = entry?.durationDays ?? fallbackDuration(sp);
  return Math.max(1, Math.ceil(baseDays * coefficient));
}

function fallbackDuration(sp: number): number {
  if (sp <= 0) return 1;
  if (sp <= 1) return 2;
  if (sp <= 2) return 3;
  if (sp <= 3) return 5;
  return 8;
}
