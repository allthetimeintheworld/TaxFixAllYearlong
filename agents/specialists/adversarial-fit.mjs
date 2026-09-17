/**
 * Adversarial Fit Agent — ring 2 (quality).
 *
 * The agent whose job is to make the product worse before the user sees it. It
 * runs twice in the pipeline:
 *
 *   attack()  — tries to break the concept and the draft copy
 *   verify()  — re-checks the rewrite, and is allowed to reject it again
 *
 * That second pass is the difference between theatre and governance: a rewrite
 * that has not been re-attacked is just a nicer sentence.
 */

import { ADVERSARIAL_TARGET } from '../demo-script.mjs';

const CONCEPT_ATTACKS = [
  {
    id: 'outside-season',
    question: 'Is this genuinely useful outside filing season?',
    risk: 'If the only real payoff is filing, this is a reminder app wearing a costume.',
    severity: 'High',
    fix: 'Every monthly check-in must end in a document, a note or a saved receipt — not a notification.',
    verdict: 'pass-with-fix',
  },
  {
    id: 'gamification-pressure',
    question: 'Does gamification create pressure?',
    risk: 'Streaks plus a deadline is a guilt machine. Losing a streak must never cost readiness.',
    severity: 'High',
    fix: 'Reward preparation and understanding only. No leaderboards, no countdowns, no streak loss penalty.',
    verdict: 'pass-with-fix',
  },
  {
    id: 'humour-safety',
    question: 'Does the humour feel safe?',
    risk: 'A joke lands as mockery when the user is already ashamed of not understanding.',
    severity: 'High',
    fix: 'Four tone modes with explicit distress triggers. Humour is disabled, not toned down, in Sensitive mode.',
    verdict: 'pass-with-fix',
  },
  {
    id: 'user-control',
    question: 'Does the user still feel in control?',
    risk: 'An agent that acts first and explains later reproduces exactly the powerlessness that causes the avoidance.',
    severity: 'High',
    fix: 'Nothing is submitted, and no value is recorded, without an explicit user approval step.',
    verdict: 'pass',
  },
  {
    id: 'real-multi-agent',
    question: 'Is this actually multi-agent, or one prompt in six hats?',
    risk: 'If every agent reads the same context and writes the same shape, the architecture is decoration.',
    severity: 'Medium',
    fix: 'Each agent must write a distinct artefact to the blackboard, and later agents must depend on it.',
    verdict: 'pass',
  },
  {
    id: 'anxiety',
    question: 'Could this increase anxiety?',
    risk: 'A readiness score that can go down is a new thing to fail at.',
    severity: 'Medium',
    fix: 'Readiness only counts completed items. It never decreases for inactivity, and open items are framed as optional.',
    verdict: 'pass-with-fix',
  },
  {
    id: 'eli5-generic',
    question: 'Is the ELI5 bot too generic?',
    risk: 'A bot that gives the same answer to everyone is a search engine with better manners.',
    severity: 'Medium',
    fix: 'Answers must reference the user’s own documents and end in the specific next action the Planner queued.',
    verdict: 'pass-with-fix',
  },
];

export const adversarialFit = {
  id: 'adversarial-fit',
  name: 'Adversarial Reviewer',
  emoji: '⚔️',
  role: 'Attacks the concept, the copy and the rewrites',
  blurb: 'Finds the promise the user will be hurt by, before they read it.',

  /**
   * @param {import('../blackboard.mjs').Blackboard} bb
   * @param {{phase?: 'attack'|'verify'}} ctx
   */
  async run(bb, ctx = {}) {
    const phase = ctx.phase || 'attack';

    if (phase === 'verify') return this.verify(bb);
    return this.attack(bb);
  },

  async attack(bb) {
    const rejections = [
      {
        id: ADVERSARIAL_TARGET.id,
        proposed: ADVERSARIAL_TARGET.proposed,
        proposedBy: ADVERSARIAL_TARGET.proposedBy,
        attack: ADVERSARIAL_TARGET.attack,
        severity: ADVERSARIAL_TARGET.severity,
        category: ADVERSARIAL_TARGET.category,
        violates: ADVERSARIAL_TARGET.violates,
        citation: ADVERSARIAL_TARGET.testCase,
        verdict: 'rejected',
      },
      {
        id: 'marriage-savings-joke',
        proposed: ADVERSARIAL_TARGET.secondDraft,
        proposedBy: 'Growth copy draft',
        attack:
          'Marriage is treated as a savings lever. It changes which tax class may apply, which is a question to ask — not a jackpot to announce.',
        severity: 'High',
        category: 'Unsupported financial promise',
        violates: ADVERSARIAL_TARGET.violates,
        citation: 'adversarial_test_cases.md#i-got-married-will-i-save-big-bucks',
        verdict: 'rejected',
      },
    ];

    const artifact = {
      conceptAttacks: CONCEPT_ATTACKS,
      rejections,
      rejectedCount: rejections.length,
      fixCount: CONCEPT_ATTACKS.filter((a) => a.verdict === 'pass-with-fix').length,
      summary: `${rejections.length} unsafe messages rejected, ${CONCEPT_ATTACKS.filter((a) => a.verdict === 'pass-with-fix').length} concept risks given mandatory fixes`,
      survivalRule:
        'A concept survives only if its fix is implemented, not noted. Unfixed risks fail the prototype.',
    };

    bb.put('adversarial', artifact);
    bb.emit('adversarial_rejection', { count: rejections.length });

    for (const rejection of rejections) {
      bb.step({
        agentId: this.id,
        status: 'flagged',
        kind: 'flag',
        title: `Rejected: "${rejection.proposed.slice(0, 52)}${rejection.proposed.length > 52 ? '…' : ''}"`,
        detail: `${rejection.severity} severity — ${rejection.category.toLowerCase()}. ${rejection.attack.split('.')[0]}.`,
        citations: [rejection.citation],
        payload: { type: 'rejection', rejection },
      });
    }

    const conceptStep = bb.step({
      agentId: this.id,
      status: 'complete',
      title: `Stress-tested the concept on ${CONCEPT_ATTACKS.length} fronts`,
      detail: `${CONCEPT_ATTACKS.filter((a) => a.verdict === 'pass-with-fix').length} require a mandatory fix before the prototype counts as safe.`,
      payload: { type: 'concept-attacks', attacks: CONCEPT_ATTACKS },
    });

    return artifact;
  },

  /** Re-attack the rewrite. This pass can — and does — fail. */
  async verify(bb) {
    const rewrite = bb.get('brandRewrite', null);
    const candidate = rewrite ? rewrite.after : null;

    const stillPromising = candidate
      ? /\b(will|guaranteed|definitely|save big|get .* back)\b/i.test(candidate)
      : true;

    const result = {
      candidate,
      verdict: candidate && !stillPromising ? 'accepted' : 'rejected',
      checkedAgainst: rewrite ? rewrite.failedOn || [] : [],
      note:
        candidate && !stillPromising
          ? 'The rewrite is conditional, names the uncertainty and ends in a question rather than a promise. Accepted.'
          : 'Rewrite still carries an outcome promise. Sent back.',
      reAttack:
        'Second pass: does "may be relevant" quietly become "is relevant" once the user is told they can save money? The card must keep the question open until the user answers.',
    };

    bb.put('adversarialVerify', result);

    bb.step({
      agentId: this.id,
      status: result.verdict === 'accepted' ? 'complete' : 'flagged',
      kind: result.verdict === 'accepted' ? 'approve' : 'flag',
      title:
        result.verdict === 'accepted'
          ? 'Re-attacked the rewrite: it survives'
          : 'Rewrite rejected again — still promising an outcome',
      detail: result.note,
      payload: { type: 'verify', result },
    });

    return result;
  },
};
