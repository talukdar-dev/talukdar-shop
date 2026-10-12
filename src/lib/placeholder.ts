// SVG placeholder image generator (data URI) — used in demo mode when no
// Cloudinary/Supabase images are configured. Zero external requests.

const COLORS: [string, string][] = [
  ['#ef4a23', '#b32d0e'],
  ['#1a73e8', '#0d47a1'],
  ['#0f9d58', '#046c39'],
  ['#7b1fa2', '#4a0072'],
  ['#ef6c00', '#b53d00'],
  ['#00838f', '#005662'],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function placeholder(text: string, w = 800, h = 800): string {
  const [c1, c2] = COLORS[hash(text) % COLORS.length];
  const short =
    text.length > 34 ? text.slice(0, 32).trimEnd() + '…' : text;
  // wrap into lines of ~18 chars
  const words = short.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > 20) {
      lines.push(line.trim());
      line = word;
    } else {
      line += ' ' + word;
    }
  }
  if (line.trim()) lines.push(line.trim());
  const shown = lines.slice(0, 4);
  const tspans = shown
    .map(
      (ln, i) =>
        `<text x="400" y="${360 + i * 52}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="40" font-weight="bold" fill="#ffffff">${escapeXml(ln)}</text>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="800" height="800" fill="url(#g)"/><circle cx="400" cy="220" r="86" fill="#ffffff" opacity="0.18"/><text x="400" y="252" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="72" font-weight="bold" fill="#ffffff" opacity="0.9">TS</text>${tspans}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
