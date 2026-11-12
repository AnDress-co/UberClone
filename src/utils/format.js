import { toDate } from './dates.js';

export const formatCOP = (n) => {
  const v = Math.round(Number(n) || 0);
  const digits = Math.abs(v).toString().replace(/(\d)(?=(\d{3})+$)/g, '$1.');
  return `${v < 0 ? '-' : ''}$${digits}`;
};

export function formatDateTime(v) {
  const d = toDate(v);
  if (!d) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}