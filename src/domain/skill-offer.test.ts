import { describe, expect, it } from 'vitest';
import {
  createSkillOffer,
  deserializeSkillOffer,
  isDateOnly,
  serializeSkillOffer,
  transitionOfferStatus,
  validateOfferInput,
  type SkillOfferInput,
} from './skill-offer';

const today = '2026-10-28';
const now = '2026-10-28T09:00:00.000Z';
const validInput: SkillOfferInput = {
  title: 'Conversational English practice',
  category: 'language',
  proposedHours: 1,
  availableUntil: today,
};

describe('skill offer validation', () => {
  it('accepts inclusive title, hour and date boundaries', () => {
    expect(validateOfferInput({
      ...validInput,
      title: 'S'.repeat(80),
      proposedHours: 12,
      availableUntil: today,
    }, today)).toEqual([]);
    expect(validateOfferInput({ ...validInput, proposedHours: 0.25 }, today)).toEqual([]);
    expect(isDateOnly('2024-02-29')).toBe(true);
  });

  it('rejects blank or overlong titles, invalid categories and non-quarter-hour values', () => {
    const errors = validateOfferInput({
      ...validInput,
      title: ' ',
      category: 'unsafe' as SkillOfferInput['category'],
      proposedHours: 0.3,
    }, today);
    expect(errors.map((error) => error.field)).toEqual(['title', 'category', 'proposedHours']);
    expect(validateOfferInput({ ...validInput, title: 'S'.repeat(81) }, today)[0]?.message).toContain('80');
    expect(validateOfferInput({ ...validInput, proposedHours: 0 }, today)[0]?.field).toBe('proposedHours');
    expect(validateOfferInput({ ...validInput, proposedHours: 12.25 }, today)[0]?.field).toBe('proposedHours');
    expect(validateOfferInput({ ...validInput, proposedHours: Number.NaN }, today)[0]?.field).toBe('proposedHours');
  });

  it('allows today and an empty end date but rejects past and invalid calendar dates', () => {
    expect(validateOfferInput({ ...validInput, availableUntil: today }, today)).toEqual([]);
    expect(validateOfferInput({ ...validInput, availableUntil: '' }, today)).toEqual([]);
    expect(validateOfferInput({ ...validInput, availableUntil: '2026-10-27' }, today)[0]?.field).toBe('availableUntil');
    expect(validateOfferInput({ ...validInput, availableUntil: '2026-02-29' }, today)[0]?.field).toBe('availableUntil');
    expect(isDateOnly('2026-02-29')).toBe(false);
  });
});

describe('private draft lifecycle', () => {
  it('creates a local proposal without identity, agreement, balance or messaging fields', () => {
    const created = createSkillOffer(validInput, { id: 'local-1', now, today });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.status).toBe('draft');
    expect(created.value.proposedHours).toBe(1);
    expect(created.value.history).toEqual([{ status: 'draft', at: now }]);
    expect(created.value).not.toHaveProperty('person');
    expect(created.value).not.toHaveProperty('contact');
    expect(created.value).not.toHaveProperty('agreedHours');
    expect(created.value).not.toHaveProperty('balance');
  });

  it('withdraws a draft, permits equal timestamps and prevents restoring it', () => {
    const created = createSkillOffer(validInput, { id: 'local-2', now, today });
    if (!created.ok) throw new Error('expected valid offer');
    const withdrawn = transitionOfferStatus(created.value, 'withdrawn', now);
    expect(withdrawn.ok).toBe(true);
    if (!withdrawn.ok) return;
    expect(withdrawn.value.history).toHaveLength(2);
    expect(transitionOfferStatus(withdrawn.value, 'draft', now).ok).toBe(false);
  });

  it('rejects invalid timestamps and out-of-order changes', () => {
    const created = createSkillOffer(validInput, { id: 'local-3', now, today });
    if (!created.ok) throw new Error('expected valid offer');
    expect(transitionOfferStatus(created.value, 'withdrawn', 'not-a-timestamp').ok).toBe(false);
    expect(transitionOfferStatus(created.value, 'withdrawn', '2026-10-28T08:59:59.000Z').ok).toBe(false);
  });

  it('round-trips JSON and rejects malformed records', () => {
    const created = createSkillOffer(validInput, { id: 'local-4', now, today });
    if (!created.ok) throw new Error('expected valid offer');
    expect(deserializeSkillOffer(serializeSkillOffer(created.value))).toEqual(created.value);
    expect(() => deserializeSkillOffer('{')).toThrow();
    expect(() => deserializeSkillOffer('{"id":"not-an-offer"}')).toThrow('Invalid local skill offer');
    const invalidHistory = transitionOfferStatus(created.value, 'withdrawn', now);
    if (!invalidHistory.ok) throw new Error('expected valid withdrawal');
    const reopened = { ...invalidHistory.value, status: 'draft' as const, history: [...invalidHistory.value.history, { status: 'draft' as const, at: now }] };
    expect(() => deserializeSkillOffer(serializeSkillOffer(reopened))).toThrow('Invalid local skill offer');
  });
});
