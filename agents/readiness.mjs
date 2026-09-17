/**
 * readiness.mjs — the "Tax Readiness" score.
 *
 * Product rule (from the goal sheet): readiness is earned by *preparation and
 * understanding*, never by refund size, filing speed, or how much money the
 * user claims. Every point is attached to a named, checkable item so the UI can
 * always answer "why is it 62 and not 70?".
 *
 * The weights sum to 100. The demo starts at exactly 62.
 */

export const READINESS_ITEMS = [
  { id: 'profile_complete', label: 'Profile and tax ID confirmed', weight: 6, done: true },
  { id: 'employment_statement', label: 'Employment tax statement saved', weight: 15, done: true },
  { id: 'freelance_income', label: 'Freelance income recorded', weight: 12, done: true },
  { id: 'receipts_organised', label: 'Work receipts organised', weight: 10, done: true },
  { id: 'monthly_streak', label: 'Two monthly check-ins completed', weight: 8, done: true },
  { id: 'tax_office_letter', label: 'Tax office letter reviewed', weight: 6, done: true },
  { id: 'deadline_tracker', label: 'Preparation reminders switched on', weight: 5, done: true },

  // Everything below is still open when the demo starts.
  { id: 'laptop_use_clarified', label: 'Laptop work-use confirmed', weight: 10, done: false },
  { id: 'laptop_work_share', label: 'Laptop work-use share recorded', weight: 6, done: false },
  { id: 'marriage_check', label: 'Marriage year check completed', weight: 8, done: false },
  { id: 'home_office', label: 'Home-office days recorded', weight: 9, done: false },
  { id: 'expert_review', label: 'Freelance question sent for expert review', weight: 5, done: false },
];

export function scoreOf(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  const earned = items.filter((i) => i.done).reduce((s, i) => s + i.weight, 0);
  return { earned, total, score: Math.round((earned / total) * 100) };
}

export function readinessLabel(score) {
  if (score >= 90) return 'Ready';
  if (score >= 75) return 'Nearly ready';
  if (score >= 50) return 'On track';
  if (score >= 25) return 'Getting there';
  return 'Just starting';
}

export function makeReadiness() {
  return READINESS_ITEMS.map((i) => ({ ...i }));
}

/** Apply a set of item ids as completed and return the before/after score. */
export function complete(items, ids) {
  const before = scoreOf(items);
  for (const item of items) {
    if (ids.includes(item.id)) item.done = true;
  }
  const after = scoreOf(items);
  return { before, after, delta: after.score - before.score };
}

export function openItems(items) {
  return items.filter((i) => !i.done);
}
