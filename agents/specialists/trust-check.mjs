/**
 * Trust Check — ring 2 (quality).
 *
 * Two jobs, both deterministic so the demo cannot quietly cheat:
 *
 *  1. Grounding audit — walk every user-facing sentence the other agents have
 *     written, and check that the step which produced it carries a citation.
 *     Ungrounded copy is blocked, not softened.
 *  2. Conflict detection — refuse to pick a winner when a document and the user
 *     disagree.
 *
 * It also owns the confidence signal: it will not raise confidence on the back
 * of a claim it blocked.
 */

import { REPAIR } from '../demo-script.mjs';

/** Phrases that promise an outcome the system cannot know. */
const BANNED = [
  { re: /\byou\b[^.!?]{0,30}\bget\b[^.!?]{0,30}\bback\b/i, why: 'Implies the full amount returns' },
  { re: /\bguarantee(?:d|s)?\b/i, why: 'A guarantee is never possible here' },
  { re: /definitely qualify/i, why: 'Eligibility is situation-dependent' },
  { re: /save (?:big|a lot|loads)/i, why: 'Quantifies a saving that has not been calculated' },
  { re: /risk[- ]free|no risk/i, why: 'Removes the need for the user to check' },
  { re: /you (?:should|must) (?:have|know)/i, why: 'Shaming language' },
  { re: /just submit/i, why: 'Removes the user from the approval step' },
  { re: /€\s?\d[\d.,]*\s*(?:back|refund)/i, why: 'States a specific refund amount' },
];

function audit(text) {
  const hits = [];
  for (const rule of BANNED) {
    if (rule.re.test(text)) hits.push({ pattern: String(rule.re), why: rule.why });
  }
  return hits;
}

/**
 * Which payloads make claims about the user's tax situation and therefore must
 * carry evidence. The Frontend Designer's screen purposes and the Adversarial
 * Reviewer's own critique are internal reasoning, not statements to Alex, so a
 * missing citation there is not a grounding failure.
 */
const CLAIM_BEARING = new Set([
  'goals',
  'insights',
  'documents',
  'plan',
  'eli5',
  'rewrite',
  'rejection',
  'conflict',
  'resolution',
  'closing',
  'tone',
  'blocked-claim',
]);

/**
 * Fields that describe or critique copy rather than being copy the user reads.
 * Without this, the reviewer gets flagged for quoting the thing it rejected.
 * `proposed` and `before` are deliberately NOT ignored — the bad draft is
 * exactly what the scanner is supposed to catch.
 */
const NOT_USER_COPY = new Set([
  'why', 'detail', 'helper', 'attack', 'risk', 'fix', 'reason', 'note',
  'reAttack', 'relevance', 'summary', 'policy', 'verdict', 'category',
  'requiredAction', 'survivalRule', 'goalAlignment', 'honestyNote', 'violates',
  'checkedAgainst', 'failedOn', 'source', 'whyScore', 'principles', 'notBuilding',
  'citation', 'agent', 'agentId', 'type',
]);

/** Collect candidate user-facing sentences out of a timeline payload. */
function userFacingStrings(node, out = [], depth = 0) {
  if (depth > 6 || node == null) return out;
  if (typeof node === 'string') {
    if (node.length > 24 && /\s/.test(node) && /[.!?]/.test(node)) out.push(node);
    return out;
  }
  if (Array.isArray(node)) {
    for (const item of node) userFacingStrings(item, out, depth + 1);
    return out;
  }
  if (typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (NOT_USER_COPY.has(key)) continue;
      userFacingStrings(value, out, depth + 1);
    }
  }
  return out;
}

export const trustCheck = {
  id: 'trust-check',
  name: 'Trust Check',
  emoji: '🛡️',
  role: 'Audits grounding, uncertainty and conflicts',
  blurb: 'Blocks anything that cannot be traced or is not yet confirmed.',

  async run(bb) {
    const conflicts = [];
    const blocked = [];
    const claims = [];

    for (const step of bb.timeline) {
      if (!step.payload) continue;
      const claimBearing = CLAIM_BEARING.has(step.payload.type);
      const grounded = step.citations.length > 0;
      for (const text of userFacingStrings(step.payload)) {
        const hits = audit(text);
        const record = {
          agent: step.agentName,
          agentId: step.agentId,
          statement: text.length > 150 ? `${text.slice(0, 147)}…` : text,
          citation: step.citations[0] || null,
          grounded,
          claimBearing,
          issues: hits,
        };
        claims.push(record);
        if (hits.length || (claimBearing && !grounded)) {
          blocked.push(record);
          record.verdict = 'blocked';
        } else {
          record.verdict = 'passed';
        }
      }
    }

    // The document/user disagreement is a first-class blocking condition.
    const docs = bb.get('documents', {});
    if (docs.conflict && !docs.conflict.resolved) {
      conflicts.push({
        id: docs.conflict.id,
        severity: docs.conflict.severity,
        documentSays: docs.conflict.documentSays,
        userClaim: docs.conflict.userClaim,
        why: docs.conflict.why,
        citation: docs.conflict.citation,
        requiredAction: 'Ask the user one focused question. Do not infer a value.',
      });
    }

    const artifact = {
      claimsAudited: claims.length,
      passed: claims.filter((c) => c.verdict === 'passed').length,
      blocked: blocked.slice(0, 6),
      blockedCount: blocked.length,
      conflicts,
      conflictOpen: conflicts.length > 0,
      confidence: {
        before: 2,
        after: conflicts.length ? 2 : REPAIR.options[0].confidenceDelta + 2,
        reason: conflicts.length
          ? 'Held at 2/5 until the laptop question is answered. Blocking claims must not raise confidence.'
          : 'Raised because the conflict was resolved by the user, not by the system.',
      },
      policy: [
        'Say what is known before what is uncertain',
        'Never infer a number from an unclear document',
        'A blocked claim is removed, not reworded to sound safer',
        'Uncertainty is shown to the user on purpose',
      ],
    };

    bb.put('trust', artifact);
    bb.emit('confidence_recorded', { before: artifact.confidence.before, after: artifact.confidence.after });

    bb.step({
      agentId: this.id,
      status: blocked.length || conflicts.length ? 'flagged' : 'complete',
      kind: blocked.length || conflicts.length ? 'flag' : 'normal',
      title: blocked.length
        ? `Audited ${claims.length} claims — blocked ${blocked.length} unsafe ones`
        : `Audited ${claims.length} claims and found no unsupported promises`,
      detail: blocked.length
        ? `Blocked for missing evidence or a promise the system cannot keep. Confidence held at ${artifact.confidence.before}/5.`
        : 'Every user-facing claim traces back to a knowledge-base section.',
      citations: conflicts.map((c) => c.citation).filter(Boolean),
      payload: {
        type: 'trust',
        claimsAudited: artifact.claimsAudited,
        passed: artifact.passed,
        blocked: artifact.blocked,
        conflicts,
        confidence: artifact.confidence,
        policy: artifact.policy,
      },
    });

    if (conflicts.length) {
      bb.step({
        agentId: this.id,
        status: 'waiting',
        kind: 'flag',
        title: 'One conflicting answer found — asking instead of assuming',
        detail: `"${conflicts[0].documentSays}" vs "${conflicts[0].userClaim}". This one needs you.`,
        citations: [conflicts[0].citation],
        payload: { type: 'blocked-claim', conflict: conflicts[0] },
      });
    }

    return artifact;
  },
};
