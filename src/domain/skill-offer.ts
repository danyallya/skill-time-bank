export const skillCategories = [
  'practical',
  'learning',
  'language',
  'creative',
  'technology',
  'other',
] as const;

export type SkillCategory = (typeof skillCategories)[number];
export type OfferStatus = 'draft' | 'withdrawn';

export type SkillOfferInput = {
  title: string;
  category: SkillCategory;
  proposedHours: number;
  availableUntil: string;
};

export type OfferEvent = {
  status: OfferStatus;
  at: string;
};

export type SkillOfferRecord = {
  schemaVersion: 1;
  id: string;
  title: string;
  category: SkillCategory;
  proposedHours: number;
  availableUntil: string | null;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
  history: OfferEvent[];
};

export type OfferError = {
  field: keyof SkillOfferInput;
  message: string;
};

export type OfferResult =
  | { ok: true; value: SkillOfferRecord }
  | { ok: false; errors: OfferError[] };

export type CreateOfferOptions = {
  id: string;
  now: string;
  today: string;
};

const allowedTransitions: Record<OfferStatus, readonly OfferStatus[]> = {
  draft: ['withdrawn'],
  withdrawn: [],
};

export function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateOfferInput(input: SkillOfferInput, today: string): OfferError[] {
  const errors: OfferError[] = [];
  const title = input.title.trim();

  if (!title) {
    errors.push({ field: 'title', message: 'Enter a skill you can offer.' });
  } else if (title.length > 80) {
    errors.push({ field: 'title', message: 'Use 80 characters or fewer.' });
  }

  if (!skillCategories.includes(input.category)) {
    errors.push({ field: 'category', message: 'Choose a listed category.' });
  }

  const quarterHourUnits = input.proposedHours * 4;
  if (
    !Number.isFinite(input.proposedHours) ||
    input.proposedHours < 0.25 ||
    input.proposedHours > 12 ||
    !Number.isInteger(quarterHourUnits)
  ) {
    errors.push({ field: 'proposedHours', message: 'Use 0.25 to 12 hours in 0.25-hour increments.' });
  }

  if (!isDateOnly(today)) {
    errors.push({ field: 'availableUntil', message: 'The current date is invalid.' });
  }

  if (input.availableUntil) {
    if (!isDateOnly(input.availableUntil)) {
      errors.push({ field: 'availableUntil', message: 'Enter a valid calendar date.' });
    } else if (isDateOnly(today) && input.availableUntil < today) {
      errors.push({ field: 'availableUntil', message: 'Choose today or a later date.' });
    }
  }

  return errors;
}

export function createSkillOffer(
  input: SkillOfferInput,
  options: CreateOfferOptions,
): OfferResult {
  const errors = validateOfferInput(input, options.today);
  const timestamp = Date.parse(options.now);

  if (!Number.isFinite(timestamp)) {
    errors.push({ field: 'availableUntil', message: 'The record time is invalid.' });
  }
  if (!options.id.trim()) {
    errors.push({ field: 'title', message: 'A local record ID is required.' });
  }
  if (errors.length > 0) return { ok: false, errors };

  const createdAt = new Date(timestamp).toISOString();
  return {
    ok: true,
    value: {
      schemaVersion: 1,
      id: options.id,
      title: input.title.trim(),
      category: input.category,
      proposedHours: input.proposedHours,
      availableUntil: input.availableUntil || null,
      status: 'draft',
      createdAt,
      updatedAt: createdAt,
      history: [{ status: 'draft', at: createdAt }],
    },
  };
}

export function transitionOfferStatus(
  record: SkillOfferRecord,
  nextStatus: OfferStatus,
  at: string,
): OfferResult {
  const errors: OfferError[] = [];
  const timestamp = Date.parse(at);

  if (!Number.isFinite(timestamp)) {
    errors.push({ field: 'availableUntil', message: 'The change time is invalid.' });
  }
  if (!allowedTransitions[record.status].includes(nextStatus)) {
    errors.push({ field: 'title', message: `Cannot move a ${record.status} offer to ${nextStatus}.` });
  }
  const lastTimestamp = Date.parse(record.updatedAt);
  if (Number.isFinite(timestamp) && timestamp < lastTimestamp) {
    errors.push({ field: 'availableUntil', message: 'Changes must stay in chronological order.' });
  }
  if (errors.length > 0) return { ok: false, errors };

  const changedAt = new Date(timestamp).toISOString();
  return {
    ok: true,
    value: {
      ...record,
      status: nextStatus,
      updatedAt: changedAt,
      history: [...record.history, { status: nextStatus, at: changedAt }],
    },
  };
}

export function serializeSkillOffer(record: SkillOfferRecord): string {
  return JSON.stringify(record);
}

export function deserializeSkillOffer(value: string): SkillOfferRecord {
  const parsed: unknown = JSON.parse(value);
  if (!isSkillOfferRecord(parsed)) throw new Error('Invalid local skill offer.');
  return parsed;
}

function isSkillOfferRecord(value: unknown): value is SkillOfferRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<SkillOfferRecord>;
  if (
    record.schemaVersion !== 1 ||
    typeof record.id !== 'string' ||
    record.id.trim().length === 0 ||
    typeof record.title !== 'string' ||
    record.title.trim().length === 0 ||
    record.title.length > 80 ||
    !skillCategories.includes(record.category as SkillCategory) ||
    !Number.isFinite(record.proposedHours) ||
    (record.proposedHours ?? 0) < 0.25 ||
    (record.proposedHours ?? 13) > 12 ||
    !Number.isInteger((record.proposedHours ?? 0) * 4) ||
    !['draft', 'withdrawn'].includes(record.status ?? '') ||
    typeof record.createdAt !== 'string' ||
    typeof record.updatedAt !== 'string' ||
    !(record.availableUntil === null || (typeof record.availableUntil === 'string' && isDateOnly(record.availableUntil))) ||
    !Array.isArray(record.history) ||
    record.history.length === 0
  ) {
    return false;
  }

  let previousTime = Number.NEGATIVE_INFINITY;
  let previousStatus: OfferStatus | null = null;
  for (const event of record.history) {
    if (!event || !['draft', 'withdrawn'].includes(event.status)) return false;
    if (previousStatus === null ? event.status !== 'draft' : !allowedTransitions[previousStatus].includes(event.status)) return false;
    const eventTime = Date.parse(event.at);
    if (!Number.isFinite(eventTime) || eventTime < previousTime) return false;
    previousTime = eventTime;
    previousStatus = event.status;
  }

  return (
    record.history[0]?.status === 'draft' &&
    record.history[0]?.at === record.createdAt &&
    record.history.at(-1)?.status === record.status &&
    Date.parse(record.createdAt) <= Date.parse(record.updatedAt) &&
    record.history.at(-1)?.at === record.updatedAt
  );
}
