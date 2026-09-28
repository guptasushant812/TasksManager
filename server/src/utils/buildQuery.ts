import { ParsedQs } from 'qs';

export interface TaskQuery {
  filter: Record<string, unknown>;
  sort: Record<string, 1 | -1>;
  page: number;
  limit: number;
  skip: number;
}

function toDate(val: unknown): Date | null {
  if (!val || typeof val !== 'string') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ALLOWED_STATUSES = ['InProgress', 'Pending', 'Completed'];
const ALLOWED_PRIORITIES = ['High', 'Medium', 'Low'];

export function buildQuery(query: ParsedQs): TaskQuery {
  const filter: Record<string, unknown> = {};

  // ── Full-text search ──────────────────────────────────────────────────────
  if (query.search && typeof query.search === 'string' && query.search.trim()) {
    filter.$text = { $search: query.search.trim() };
  }

  // ── Work status filter ────────────────────────────────────────────────────
  if (query.status && typeof query.status === 'string' && ALLOWED_STATUSES.includes(query.status)) {
    filter.workStatus = query.status;
  }

  // ── Priority filter ───────────────────────────────────────────────────────
  if (query.priority && typeof query.priority === 'string' && ALLOWED_PRIORITIES.includes(query.priority)) {
    filter.priority = query.priority;
  }

  // ── Given By filter (properly regex-escaped to prevent ReDoS / injection) ──
  if (query.givenBy && typeof query.givenBy === 'string' && query.givenBy.trim()) {
    filter.givenBy = { $regex: escapeRegex(query.givenBy.trim()), $options: 'i' };
  }

  // ── Date range ────────────────────────────────────────────────────────────
  const dateFrom = toDate(query.dateFrom);
  const dateTo = toDate(query.dateTo);
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.$gte = dateFrom;
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setUTCHours(23, 59, 59, 999);
      dateFilter.$lte = endOfDay;
    }
    filter.date = dateFilter;
  }

  // ── Year filter ───────────────────────────────────────────────────────────
  if (query.year && typeof query.year === 'string' && !dateFrom && !dateTo) {
    const yr = parseInt(query.year, 10);
    if (!isNaN(yr)) {
      filter.date = {
        $gte: new Date(Date.UTC(yr, 0, 1)),
        $lte: new Date(Date.UTC(yr, 11, 31, 23, 59, 59, 999)),
      };
    }
  }

  // ── Month filter (must be combined with year) ─────────────────────────────
  if (
    query.month && typeof query.month === 'string' &&
    query.year && typeof query.year === 'string' &&
    !dateFrom && !dateTo
  ) {
    const yr = parseInt(query.year, 10);
    const mo = parseInt(query.month, 10); // 1-based
    if (!isNaN(yr) && !isNaN(mo)) {
      const start = new Date(Date.UTC(yr, mo - 1, 1));
      const end = new Date(Date.UTC(yr, mo, 0, 23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    }
  }

  // ── Week filter: weekStart (Monday) ──────────────────────────────────────
  if (query.weekStart && typeof query.weekStart === 'string' && !dateFrom && !dateTo) {
    const weekStartDate = toDate(query.weekStart);
    if (weekStartDate) {
      const weekEnd = new Date(weekStartDate);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 5); // Mon→Sat (6 days)
      weekEnd.setUTCHours(23, 59, 59, 999);
      filter.date = { $gte: weekStartDate, $lte: weekEnd };
    }
  }

  // ── Day filter ────────────────────────────────────────────────────────────
  if (query.day && typeof query.day === 'string' && !dateFrom && !dateTo) {
    const dayDate = toDate(query.day);
    if (dayDate) {
      const dayEnd = new Date(dayDate);
      dayEnd.setUTCHours(23, 59, 59, 999);
      filter.date = { $gte: dayDate, $lte: dayEnd };
    }
  }

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sortableFields = ['date', 'dueDate', 'title', 'priority', 'workStatus', 'createdAt'];
  const sortField = typeof query.sort === 'string' && sortableFields.includes(query.sort)
    ? query.sort
    : 'date';
  const sortOrder: 1 | -1 = query.order === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

  // ── Pagination ────────────────────────────────────────────────────────────
  const page = Math.max(1, parseInt((query.page as string) || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt((query.limit as string) || '50', 10)));
  const skip = (page - 1) * limit;

  return { filter, sort, page, limit, skip };
}
