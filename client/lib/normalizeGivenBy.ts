export const STANDARD_GIVEN_BY_LIST = [
  'Sudhakar Umale Sir',
  'Sachin Oak Sir',
  'Sajjan Lal Sir',
  'Dipesh Tare Sir',
  'Jitendra Chavan Sir',
  'Pankaj Shelar Sir',
  'Kshama Shukla Ma\'am',
  'Amit Nimbalkar Sir',
  'Anup Chavan Sir',
  'Siddhesh Mane Sir',
  'Niyati Patel Ma\'am',
  'Sachin Chaubey Sir',
  'Shruti Kamble Ma\'am',
  'Sushant Gupta [Me]',
  'Department Work',
  'Lab Work',
] as const;

const WORD_MAP: Record<string, string> = {
  sir: 'Sir',
  "ma'am": "Ma'am",
  maam: "Ma'am",
  mam: "Ma'am",
  dr: 'Dr.',
  'dr.': 'Dr.',
  prof: 'Prof.',
  'prof.': 'Prof.',
  mr: 'Mr.',
  'mr.': 'Mr.',
  mrs: 'Mrs.',
  'mrs.': 'Mrs.',
  ms: 'Ms.',
  'ms.': 'Ms.',
  hod: 'HOD',
  dyhod: 'DyHOD',
  'dy.hod': 'DyHOD',
  iqac: 'IQAC',
  '[me]': '[Me]',
  '(me)': '[Me]',
};

function formatWord(word: string): string {
  const clean = word.trim();
  if (!clean) return '';
  const lower = clean.toLowerCase();

  if (WORD_MAP[lower]) return WORD_MAP[lower];

  if (clean.includes('-')) return clean.split('-').map(formatWord).join('-');
  if (clean.includes("'")) return clean.split("'").map(formatWord).join("'");

  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

function normalizeSingleEntity(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^\s*department(?:\s+work)?\s*$/i.test(trimmed)) return 'Department Work';
  if (/^\s*lab(?:\s+work)?\s*$/i.test(trimmed)) return 'Lab Work';

  return trimmed
    .split(/\s+/)
    .map(formatWord)
    .filter(Boolean)
    .join(' ');
}

export function normalizeGivenBy(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s*(?:&|\band\b|,)\s*/i);
  if (parts.length > 1) {
    const hasAmpersand = trimmed.includes('&');
    const hasAndWord = /\band\b/i.test(trimmed);
    const delimiter = (hasAmpersand || hasAndWord) ? ' & ' : ', ';
    return parts
      .map((part) => normalizeSingleEntity(part))
      .filter(Boolean)
      .join(delimiter);
  }

  return normalizeSingleEntity(trimmed);
}
