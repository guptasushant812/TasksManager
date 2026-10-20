export const STANDARD_GIVEN_BY_LIST = [
  'Amit Nimbalkar Sir',
  'Anup Chavan Sir',
  'Department Work',
  'Dipesh Tare Sir',
  'Jitendra Chavan Sir',
  "Kshama Shukla Ma'am",
  'Lab Work',
  "Niyati Patel Ma'am",
  'Pankaj Shelar Sir',
  'Sachin Chaubey Sir',
  'Sachin Oak Sir',
  'Sajjan Lal Sir',
  "Shruti Kamble Ma'am",
  'Siddhesh Mane Sir',
  'Sudhakar Umale Sir',
  'Sushant Gupta [Me]',
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

const CLEAN_HONORIFICS = new Set([
  'sir',
  'maam',
  'mam',
  'dr',
  'prof',
  'mr',
  'mrs',
  'ms',
  'hod',
  'dyhod',
  'work',
]);

function cleanWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function tokenize(str: string): string[] {
  return str
    .split(/\s+/)
    .map(cleanWord)
    .filter(Boolean);
}

function formatWord(word: string): string {
  const clean = word.trim();
  if (!clean) return '';
  const lower = clean.toLowerCase();

  if (WORD_MAP[lower]) return WORD_MAP[lower];

  if (clean.includes('-')) return clean.split('-').map(formatWord).join('-');
  if (clean.includes("'")) return clean.split("'").map(formatWord).join("'");

  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

function matchStandard(input: string, list: readonly string[] = STANDARD_GIVEN_BY_LIST): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  if (/^(?:dept|department)(?:\s+work)?$/i.test(trimmed)) {
    return 'Department Work';
  }
  if (/^lab(?:\s+work)?$/i.test(trimmed)) {
    return 'Lab Work';
  }
  if (/^(?:\[me\]|\(me\)|me)$/i.test(trimmed)) {
    return 'Sushant Gupta [Me]';
  }

  const inputTokens = tokenize(trimmed);
  if (inputTokens.length === 0) return null;

  const inputSigTokens = inputTokens.filter((t) => !CLEAN_HONORIFICS.has(t) && t !== 'me');

  if (inputSigTokens.length === 0 && !inputTokens.includes('me')) {
    return null;
  }

  interface CandidateMatch {
    candidate: string;
    score: number;
    index: number;
  }

  const matches: CandidateMatch[] = [];

  for (let i = 0; i < list.length; i++) {
    const candidate = list[i];
    const candidateLower = candidate.toLowerCase();

    if (candidateLower === lower) {
      return candidate;
    }

    const candTokens = tokenize(candidate);
    const candSigTokens = candTokens.filter((t) => !CLEAN_HONORIFICS.has(t));

    const allSigFound = inputSigTokens.length > 0 && inputSigTokens.every((t) => candSigTokens.includes(t));
    const meMatched = inputTokens.includes('me') && candidate.includes('[Me]');

    if (allSigFound || meMatched) {
      let score = inputSigTokens.filter((t) => candSigTokens.includes(t)).length;

      // When only "sachin" is entered without a surname, prioritize Sachin Oak
      const isOnlySachin = inputSigTokens.length === 1 && inputSigTokens[0] === 'sachin';
      if (isOnlySachin && candidate.includes('Sachin Oak')) {
        score += 5;
      }

      matches.push({
        candidate,
        score,
        index: i,
      });
    }
  }

  if (matches.length === 0) return null;

  matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.index - b.index;
  });

  return matches[0].candidate;
}

function normalizeSingleEntity(value: string, list: readonly string[] = STANDARD_GIVEN_BY_LIST): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const matched = matchStandard(trimmed, list);
  if (matched) return matched;

  return trimmed
    .split(/\s+/)
    .map(formatWord)
    .filter(Boolean)
    .join(' ');
}

export function normalizeGivenBy(value?: string | null, list: readonly string[] = STANDARD_GIVEN_BY_LIST): string {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s*(?:&|\band\b|,)\s*/i);
  if (parts.length > 1) {
    const hasAmpersand = trimmed.includes('&');
    const hasAndWord = /\band\b/i.test(trimmed);
    const delimiter = (hasAmpersand || hasAndWord) ? ' & ' : ', ';
    return parts
      .map((part) => normalizeSingleEntity(part, list))
      .filter(Boolean)
      .join(delimiter);
  }

  return normalizeSingleEntity(trimmed, list);
}
