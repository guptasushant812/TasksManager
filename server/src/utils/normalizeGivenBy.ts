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

interface AliasRule {
  regex: RegExp;
  canonical: string;
}

const ALIAS_RULES: AliasRule[] = [
  { regex: /\b(?:sushant(?:\s+gupta)?(?:\s*\[me\])?|\[me\])\b/i, canonical: 'Sushant Gupta [Me]' },
  { regex: /\bsudhakar(?:\s+umale)?(?:\s+sir)?\b/i, canonical: 'Sudhakar Umale Sir' },
  { regex: /\bsachin\s+chaubey(?:\s+sir)?\b/i, canonical: 'Sachin Chaubey Sir' },
  { regex: /\b(?:dr\.?\s*)?sachin(?:\s+oak)?(?:\s+sir)?\b/i, canonical: 'Sachin Oak Sir' },
  { regex: /\bsajjan(?:\s+lal)?(?:\s+sir)?\b/i, canonical: 'Sajjan Lal Sir' },
  { regex: /\bdipesh(?:\s+tare)?(?:\s+sir)?\b/i, canonical: 'Dipesh Tare Sir' },
  { regex: /\bjitendra(?:\s+chavan)?(?:\s+sir)?\b/i, canonical: 'Jitendra Chavan Sir' },
  { regex: /\bpankaj(?:\s+shelar)?(?:\s+sir)?\b/i, canonical: 'Pankaj Shelar Sir' },
  { regex: /\bkshama(?:\s+shukla)?(?:\s+(?:ma'am|mam|maam))?\b/i, canonical: "Kshama Shukla Ma'am" },
  { regex: /\bamit(?:\s+nimbalkar)?(?:\s+sir)?\b/i, canonical: 'Amit Nimbalkar Sir' },
  { regex: /\banup(?:\s+chavan)?(?:\s+sir)?\b/i, canonical: 'Anup Chavan Sir' },
  { regex: /\bsiddhesh(?:\s+mane)?(?:\s+sir)?\b/i, canonical: 'Siddhesh Mane Sir' },
  { regex: /\bniyati(?:\s+patel)?(?:\s+(?:ma'am|mam|maam))?\b/i, canonical: "Niyati Patel Ma'am" },
  { regex: /\bshruti(?:\s+kamble)?(?:\s+(?:ma'am|mam|maam))?\b/i, canonical: "Shruti Kamble Ma'am" },
  { regex: /^\s*department(?:\s+work)?\s*$/i, canonical: 'Department Work' },
  { regex: /^\s*lab(?:\s+work)?\s*$/i, canonical: 'Lab Work' },
];

function titleCaseWord(word: string): string {
  const lower = word.toLowerCase();
  if (lower === "ma'am" || lower === 'mam' || lower === 'maam') return "Ma'am";
  if (lower === 'sir') return 'Sir';
  if (lower === 'dr.' || lower === 'dr') return 'Dr.';
  if (lower === '[me]') return '[Me]';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function normalizeSingleEntity(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  for (const rule of ALIAS_RULES) {
    if (rule.regex.test(trimmed)) {
      return rule.canonical;
    }
  }

  return trimmed
    .split(/\s+/)
    .map(titleCaseWord)
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
