const PALETTE = [
  { h: 210, s: 65, l: 90 },
  { h: 340, s: 60, l: 91 },
  { h: 150, s: 55, l: 89 },
  { h: 45, s: 70, l: 89 },
  { h: 270, s: 50, l: 91 },
  { h: 15, s: 65, l: 91 },
  { h: 180, s: 50, l: 89 },
  { h: 0, s: 60, l: 91 },
  { h: 90, s: 50, l: 89 },
  { h: 300, s: 45, l: 91 },
  { h: 195, s: 60, l: 89 },
  { h: 30, s: 65, l: 90 },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 60) { r1 = c; g1 = x; }
  else if (h < 120) { r1 = x; g1 = c; }
  else if (h < 180) { g1 = c; b1 = x; }
  else if (h < 240) { g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

export interface TicketColorRgb {
  bgR: number; bgG: number; bgB: number;
  borderR: number; borderG: number; borderB: number;
  textR: number; textG: number; textB: number;
}

export function getTicketColorRgb(ticketId: string): TicketColorRgb {
  const idx = hashString(ticketId) % PALETTE.length;
  const { h, s, l } = PALETTE[idx];

  const [bgR, bgG, bgB] = hslToRgb(h, s, l);
  const [borderR, borderG, borderB] = hslToRgb(h, Math.round(s * 0.8), l - 18);
  const [textR, textG, textB] = hslToRgb(h, Math.round(s * 0.9), 30);

  return { bgR, bgG, bgB, borderR, borderG, borderB, textR, textG, textB };
}
