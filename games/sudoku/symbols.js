// Symbol set: numbers 1-9 map to mythological icons.
// Grids smaller than 9 just use the first N symbols.

const SYMBOLS = {
  1: { name: "Chakra", svg: `
    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="5"/>
    <circle cx="50" cy="50" r="6" fill="currentColor"/>
    ${Array.from({length:8}).map((_,i)=>{
      const a = (i*45)*Math.PI/180;
      const x1 = 50+18*Math.cos(a), y1 = 50+18*Math.sin(a);
      const x2 = 50+30*Math.cos(a), y2 = 50+30*Math.sin(a);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`;
    }).join("")}
  `},
  2: { name: "Bow", svg: `
    <path d="M 30 20 Q 70 50 30 80" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    <line x1="30" y1="20" x2="30" y2="80" stroke="currentColor" stroke-width="3"/>
    <line x1="30" y1="50" x2="78" y2="50" stroke="currentColor" stroke-width="3"/>
    <path d="M 78 50 L 68 45 L 68 55 Z" fill="currentColor"/>
  `},
  3: { name: "Lotus", svg: `
    <path d="M50 75 C 30 65 25 45 35 30 C 40 45 45 55 50 60 C 55 55 60 45 65 30 C 75 45 70 65 50 75 Z" fill="currentColor"/>
    <path d="M50 75 C 40 60 42 45 50 35 C 58 45 60 60 50 75 Z" fill="none" stroke="currentColor" stroke-width="3"/>
    <ellipse cx="50" cy="78" rx="22" ry="6" fill="none" stroke="currentColor" stroke-width="4"/>
  `},
  4: { name: "Conch", svg: `
    <path d="M50 20 C 25 25 20 55 40 75 C 55 88 78 78 78 60 C 78 48 65 45 60 52 C 68 50 68 62 58 63 C 48 63 46 50 55 46 C 42 42 40 30 50 20 Z" fill="currentColor"/>
    <path d="M40 75 L 25 82" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
  `},
  5: { name: "Mace", svg: `
    <circle cx="50" cy="30" r="16" fill="none" stroke="currentColor" stroke-width="5"/>
    <line x1="50" y1="46" x2="50" y2="82" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
    <line x1="36" y1="82" x2="64" y2="82" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
  `},
  6: { name: "Crown", svg: `
    <path d="M22 70 L28 35 L42 55 L50 28 L58 55 L72 35 L78 70 Z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
    <line x1="20" y1="75" x2="80" y2="75" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
  `},
  7: { name: "Trishul", svg: `
    <line x1="50" y1="30" x2="50" y2="85" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    <path d="M50 30 L50 15" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    <path d="M30 40 Q 30 15 48 22" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    <path d="M70 40 Q 70 15 52 22" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
  `},
  8: { name: "Diya", svg: `
    <path d="M20 60 Q50 80 80 60 Q75 72 50 72 Q25 72 20 60 Z" fill="currentColor"/>
    <path d="M46 55 Q40 40 50 25 Q60 40 54 55 Z" fill="none" stroke="currentColor" stroke-width="4"/>
  `},
  9: { name: "Feather", svg: `
    <path d="M50 15 C 65 30 65 65 50 85 C 35 65 35 30 50 15 Z" fill="none" stroke="currentColor" stroke-width="4"/>
    <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" stroke-width="3"/>
    <circle cx="50" cy="45" r="8" fill="currentColor"/>
  `}
};

function symbolIcon(n, extraClass = "") {
  const s = SYMBOLS[n];
  if (!s) return "";
  return `<svg class="symbol-icon ${extraClass}" viewBox="0 0 100 100" aria-label="${s.name}">${s.svg}</svg>`;
}
