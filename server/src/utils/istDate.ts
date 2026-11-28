import { Schema, Document } from 'mongoose';

const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

export function formatToIST(dateVal?: Date | string | number | null): string | null {
  if (!dateVal) return null;
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return null;

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const parts = formatter.formatToParts(d);
  const day = parts.find(p => p.type === 'day')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const year = parts.find(p => p.type === 'year')?.value || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '';
  const minute = parts.find(p => p.type === 'minute')?.value || '';
  const second = parts.find(p => p.type === 'second')?.value || '00';
  const dayPeriod = (parts.find(p => p.type === 'dayPeriod')?.value || 'AM').toUpperCase();

  return `${day}-${month}-${year} ${hour}:${minute}:${second} ${dayPeriod} IST`;
}

export function toISTISOString(dateVal?: Date | string | number | null): string | null {
  if (!dateVal) return null;
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return null;

  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(d.getTime() + istOffsetMs);
  const iso = istTime.toISOString();
  return iso.replace('Z', '+05:30');
}

export function nowIST(): string {
  return formatToIST(new Date()) || '';
}

export function applyISTTimestamps(schema: Schema, additionalDateFields: string[] = []): void {
  const schemaFields: Record<string, any> = {
    createdAtIST: { type: String, default: null },
    updatedAtIST: { type: String, default: null },
  };

  for (const field of additionalDateFields) {
    schemaFields[`${field}IST`] = { type: String, default: null };
  }

  schema.add(schemaFields);

  schema.pre('save', function (next) {
    const doc = this as Document & Record<string, any>;
    const now = new Date();

    if (doc.isNew || !doc.createdAtIST) {
      doc.createdAtIST = formatToIST(doc.createdAt || now);
    }
    doc.updatedAtIST = formatToIST(doc.updatedAt || now);

    for (const field of additionalDateFields) {
      if (doc.isModified(field) || doc[`${field}IST`] === undefined || doc[`${field}IST`] === null) {
        doc[`${field}IST`] = formatToIST(doc[field]);
      }
    }
    next();
  });

  schema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function (next) {
    const update = this.getUpdate() as Record<string, any> | null;
    if (!update) return next();

    const now = new Date();
    if (!update.$set) {
      update.$set = {};
    }

    update.$set.updatedAtIST = formatToIST(now);

    for (const field of additionalDateFields) {
      if (update[field] !== undefined) {
        update.$set[`${field}IST`] = formatToIST(update[field]);
      } else if (update.$set && update.$set[field] !== undefined) {
        update.$set[`${field}IST`] = formatToIST(update.$set[field]);
      }
    }

    next();
  });

  schema.pre('insertMany', function (next, docs) {
    if (!Array.isArray(docs)) return next();
    const now = new Date();
    for (const doc of docs) {
      if (!doc.createdAtIST) {
        doc.createdAtIST = formatToIST(doc.createdAt || now);
      }
      doc.updatedAtIST = formatToIST(doc.updatedAt || now);
      for (const field of additionalDateFields) {
        if (doc[field] !== undefined) {
          doc[`${field}IST`] = formatToIST(doc[field]);
        }
      }
    }
    next();
  });
}
