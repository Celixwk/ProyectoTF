export const PALETA_AREAS = [
  { bg: 'bg-emerald-100/80', text: 'text-emerald-800', border: 'border-emerald-200', hex: 'FFD1FAE5' },
  { bg: 'bg-blue-100/80', text: 'text-blue-800', border: 'border-blue-200', hex: 'FFDBEAFE' },
  { bg: 'bg-amber-100/80', text: 'text-amber-800', border: 'border-amber-200', hex: 'FFFEF3C7' },
  { bg: 'bg-purple-100/80', text: 'text-purple-800', border: 'border-purple-200', hex: 'FFF3E8FF' },
  { bg: 'bg-pink-100/80', text: 'text-pink-800', border: 'border-pink-200', hex: 'FFFCE7F3' },
  { bg: 'bg-rose-100/80', text: 'text-rose-800', border: 'border-rose-200', hex: 'FFFFE4E6' },
  { bg: 'bg-cyan-100/80', text: 'text-cyan-800', border: 'border-cyan-200', hex: 'FFCFFAFE' },
  { bg: 'bg-lime-100/80', text: 'text-lime-800', border: 'border-lime-200', hex: 'FFECFCCB' },
  { bg: 'bg-fuchsia-100/80', text: 'text-fuchsia-800', border: 'border-fuchsia-200', hex: 'FFFAEAFF' },
  { bg: 'bg-orange-100/80', text: 'text-orange-800', border: 'border-orange-200', hex: 'FFFFEDD5' },
  { bg: 'bg-teal-100/80', text: 'text-teal-800', border: 'border-teal-200', hex: 'FFCCFBF1' },
  { bg: 'bg-indigo-100/80', text: 'text-indigo-800', border: 'border-indigo-200', hex: 'FFE0E7FF' },
];

export function getAreaColor(idArea: number) {
  if (!idArea) return PALETA_AREAS[0];
  return PALETA_AREAS[idArea % PALETA_AREAS.length];
}
