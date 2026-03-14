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

export function getTicketColor(ticketId: string) {
  const idx = hashString(ticketId) % PALETTE.length;
  const { h, s, l } = PALETTE[idx];

  return {
    bg: `hsl(${h}, ${s}%, ${l}%)`,
    darkBg: `hsl(${h}, ${Math.round(s * 0.6)}%, 22%)`,
    border: `hsl(${h}, ${Math.round(s * 0.8)}%, ${l - 18}%)`,
    darkBorder: `hsl(${h}, ${Math.round(s * 0.6)}%, 35%)`,
    text: `hsl(${h}, ${Math.round(s * 0.9)}%, 30%)`,
    darkText: `hsl(${h}, ${Math.round(s * 0.7)}%, 80%)`,
  };
}
