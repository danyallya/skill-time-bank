'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { LuArchive, LuBookOpenCheck, LuDatabase, LuTrash2, LuWifiOff } from 'react-icons/lu';
import { localDatabase } from '@/client-db';
import {
  createSkillOffer,
  skillCategories,
  transitionOfferStatus,
  type OfferError,
  type OfferStatus,
  type SkillCategory,
  type SkillOfferInput,
  type SkillOfferRecord,
} from '@/domain/skill-offer';
import { projectInfo } from '@/project-info';

const categoryLabels: Record<SkillCategory, string> = {
  practical: 'Practical help',
  learning: 'Learning and tutoring',
  language: 'Language practice',
  creative: 'Creative skills',
  technology: 'Technology',
  other: 'Other',
};

const statusLabels: Record<OfferStatus, string> = {
  draft: 'Private draft',
  withdrawn: 'Withdrawn locally',
};

const emptyInput: SkillOfferInput = {
  title: '',
  category: 'practical',
  proposedHours: 1,
  availableUntil: '',
};

function localDate(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function messageForSaveState(state: 'idle' | 'unsaved' | 'saved' | 'error'): string {
  if (state === 'unsaved') return 'This form has unsaved changes.';
  if (state === 'saved') return 'Draft saved on this device.';
  if (state === 'error') return 'Could not save on this device. Keep this page open and try again.';
  return 'No unsaved form changes.';
}

export default function HomePage() {
  const [offers, setOffers] = useState<SkillOfferRecord[]>([]);
  const [input, setInput] = useState<SkillOfferInput>(emptyInput);
  const [errors, setErrors] = useState<OfferError[]>([]);
  const [storageState, setStorageState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saveState, setSaveState] = useState<'idle' | 'unsaved' | 'saved' | 'error'>('idle');
  const [busyRecord, setBusyRecord] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let active = true;
    localDatabase.exchangeDrafts
      .orderBy('updatedAt')
      .reverse()
      .toArray()
      .then((savedOffers) => {
        if (!active) return;
        setOffers(savedOffers);
        setStorageState('ready');
      })
      .catch(() => {
        if (!active) return;
        setStorageState('error');
      });
    return () => { active = false; };
  }, []);

  const errorsFor = (field: keyof SkillOfferInput) => errors.filter((error) => error.field === field);

  async function refreshOffers() {
    const savedOffers = await localDatabase.exchangeDrafts.orderBy('updatedAt').reverse().toArray();
    setOffers(savedOffers);
  }

  async function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError('');
    const result = createSkillOffer(input, {
      id: crypto.randomUUID(),
      now: new Date().toISOString(),
      today: localDate(),
    });
    if (!result.ok) {
      setErrors(result.errors);
      setSaveState('unsaved');
      return;
    }

    setErrors([]);
    setSaveState('unsaved');
    try {
      await localDatabase.exchangeDrafts.add(result.value);
      await refreshOffers();
      setInput(emptyInput);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  async function withdrawOffer(offer: SkillOfferRecord) {
    setActionError('');
    setBusyRecord(offer.id);
    const result = transitionOfferStatus(offer, 'withdrawn', new Date().toISOString());
    if (!result.ok) {
      setActionError(result.errors[0]?.message ?? 'That status change is not available.');
      setBusyRecord(null);
      return;
    }
    try {
      await localDatabase.exchangeDrafts.put(result.value);
      await refreshOffers();
      setSaveState('saved');
    } catch {
      setActionError('Could not update this draft on the device.');
    } finally {
      setBusyRecord(null);
    }
  }

  async function deleteOffer(offer: SkillOfferRecord) {
    if (!window.confirm(`Permanently delete “${offer.title}” from this device?`)) return;
    setActionError('');
    setBusyRecord(offer.id);
    try {
      await localDatabase.exchangeDrafts.delete(offer.id);
      await refreshOffers();
      setSaveState('saved');
    } catch {
      setActionError('Could not delete this draft from the device.');
    } finally {
      setBusyRecord(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-semibold text-sky-800">{projectInfo.scope}</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{projectInfo.title}</h1>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Private planning</span>
        </header>

        <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5" aria-labelledby="safety-heading">
          <h2 id="safety-heading" className="font-semibold text-amber-950">Drafts only — nothing is shared</h2>
          <p className="mt-2 text-sm leading-6 text-amber-950">
            Offers stay in this browser. There is no matching, publishing, direct request, acceptance or time-credit agreement. Hours are proposals, not a balance, debt or promise. Do not enter names, contact details, locations, health information or personal details. Moderation, identity and dispute paths are not designed yet.
          </p>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <LuBookOpenCheck className="text-sky-800" size={22} aria-hidden="true" />
              <div>
                <h2 className="text-xl font-semibold">Add a private skill draft</h2>
                <p className="mt-1 text-sm text-slate-600">This creates a note on this device only.</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={saveOffer} noValidate>
              <div>
                <label className="block text-sm font-medium" htmlFor="skill-title">Skill title</label>
                <input
                  id="skill-title"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-200"
                  value={input.title}
                  maxLength={80}
                  autoComplete="off"
                  aria-invalid={errorsFor('title').length > 0}
                  aria-describedby={errorsFor('title').length ? 'skill-title-error' : undefined}
                  onChange={(event) => {
                    setInput({ ...input, title: event.target.value });
                    setErrors(errors.filter((error) => error.field !== 'title'));
                    setSaveState('unsaved');
                  }}
                />
                {errorsFor('title').map((error) => <p id="skill-title-error" key={error.message} className="mt-1 text-sm text-red-700">{error.message}</p>)}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium" htmlFor="skill-category">Category</label>
                  <select
                    id="skill-category"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 focus:border-sky-700 focus:ring-2 focus:ring-sky-200"
                    value={input.category}
                    onChange={(event) => {
                      setInput({ ...input, category: event.target.value as SkillCategory });
                      setSaveState('unsaved');
                    }}
                  >
                    {skillCategories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
                  </select>
                  {errorsFor('category').map((error) => <p key={error.message} className="mt-1 text-sm text-red-700">{error.message}</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium" htmlFor="proposed-hours">Proposed hours <span className="font-normal text-slate-500">(not agreed)</span></label>
                  <input
                    id="proposed-hours"
                    type="number"
                    min={0.25}
                    max={12}
                    step={0.25}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-sky-700 focus:ring-2 focus:ring-sky-200"
                    value={input.proposedHours}
                    aria-invalid={errorsFor('proposedHours').length > 0}
                    onChange={(event) => {
                      setInput({ ...input, proposedHours: Number(event.target.value) });
                      setErrors(errors.filter((error) => error.field !== 'proposedHours'));
                      setSaveState('unsaved');
                    }}
                  />
                  {errorsFor('proposedHours').map((error) => <p key={error.message} className="mt-1 text-sm text-red-700">{error.message}</p>)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium" htmlFor="available-until">Draft end date <span className="font-normal text-slate-500">(optional)</span></label>
                <input
                  id="available-until"
                  type="date"
                  min={localDate()}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-sky-700 focus:ring-2 focus:ring-sky-200"
                  value={input.availableUntil}
                  aria-invalid={errorsFor('availableUntil').length > 0}
                  onChange={(event) => {
                    setInput({ ...input, availableUntil: event.target.value });
                    setErrors(errors.filter((error) => error.field !== 'availableUntil'));
                    setSaveState('unsaved');
                  }}
                />
                {errorsFor('availableUntil').map((error) => <p key={error.message} className="mt-1 text-sm text-red-700">{error.message}</p>)}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={storageState !== 'ready'}
                  className="rounded-lg bg-sky-900 px-4 py-2.5 font-medium text-white hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {storageState === 'loading' ? 'Opening local storage…' : 'Save private draft'}
                </button>
                <p className="text-sm text-slate-600" aria-live="polite">{messageForSaveState(saveState)}</p>
              </div>
            </form>

            {storageState === 'error' && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">Local storage is unavailable in this browser. Nothing was saved.</p>}
          </div>

          <section aria-labelledby="offers-heading">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 id="offers-heading" className="text-xl font-semibold">This device</h2>
                <p className="mt-1 text-sm text-slate-600">Private drafts saved in this browser</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                <LuWifiOff aria-hidden="true" /> Not synced
              </div>
            </div>

            <div className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              <LuDatabase className="mt-1 shrink-0" aria-hidden="true" />
              <p>Drafts stay in this browser&apos;s IndexedDB. They are not encrypted, backed up or sent to a server. Other users of this browser profile may be able to see them.</p>
            </div>

            {actionError && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{actionError}</p>}
            {storageState === 'loading' && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading local drafts…</p>}
            {storageState === 'ready' && offers.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <h3 className="font-semibold">No private drafts yet</h3>
                <p className="mt-2 text-sm text-slate-600">Create a draft above to keep a note on this device.</p>
              </div>
            )}

            <ul className="space-y-3">
              {offers.map((offer) => (
                <li key={offer.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{offer.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{categoryLabels[offer.category]} · {offer.proposedHours} proposed hours</p>
                      {offer.availableUntil && <p className="mt-1 text-sm text-slate-600">Draft end date: {offer.availableUntil}</p>}
                    </div>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900">{statusLabels[offer.status]}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {offer.status === 'draft' && <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50" disabled={busyRecord === offer.id} onClick={() => void withdrawOffer(offer)}><LuArchive className="mr-1 inline" aria-hidden="true" />Withdraw draft</button>}
                    <button className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-800 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50" disabled={busyRecord === offer.id} onClick={() => void deleteOffer(offer)}><LuTrash2 className="mr-1 inline" aria-hidden="true" />Delete from device</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-5 text-sm text-slate-500">
          <p>Offline support covers private drafts only. There is no account, matching, public offer, agreement, time balance, conflict handling or sync.</p>
        </footer>
      </div>
    </main>
  );
}
