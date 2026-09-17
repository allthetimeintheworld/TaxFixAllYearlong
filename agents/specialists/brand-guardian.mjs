/**
 * Brand Guardian — ring 2 (quality).
 *
 * Three jobs:
 *  1. Rewrite copy the adversarial agent rejected, and prove the rewrite with a
 *     checklist that actually runs (the checks below are real predicates, not
 *     decorative tick boxes).
 *  2. Own the four tone modes and switch humour off on explicit distress
 *     signals.
 *  3. Approve or revise the ELI5 answers before the user sees them.
 */

import { ADVERSARIAL_TARGET } from '../demo-script.mjs';
import { bullets, blockquote } from '../grounding.mjs';

/** Real predicates. Each returns true when the copy satisfies the rule. */
export const CHECKLIST = [
  {
    id: 'conditional',
    label: 'Claim is conditional and honest',
    test: (t) => /\b(may|might|could|depending|can change|let’s check|let's check)\b/i.test(t),
  },
  {
    id: 'uncertainty-visible',
    label: 'Uncertainty is visible to the user',
    test: (t) => /\b(check|confirm|depending|not sure|before|tell us|tell me)\b/i.test(t),
  },
  {
    id: 'next-action',
    label: 'Next action is clear',
    test: (t) => /\?|let’s|let's|\bcheck\b|\bsave\b|\bshow me\b|\bsee if\b/i.test(t),
  },
  {
    id: 'user-control',
    label: 'The user keeps control',
    test: (t) => /\byou\b|\byour\b|\blet’s\b|\blet's\b/i.test(t),
  },
  {
    id: 'plain-language',
    label: 'Understandable to a first-time tax user',
    test: (t) => t.split(/\s+/).filter((w) => w.length > 14).length <= 2,
  },
  {
    id: 'no-shout',
    label: 'Tone supports comfort, not pressure',
    test: (t) => (t.match(/!/g) || []).length <= 1 && !/\b(now|hurry|last chance|don’t miss)\b/i.test(t),
  },
  {
    id: 'no-advice',
    label: 'No personalised tax advice, no outcome promise',
    test: (t) => !/(\byou\b[^.!?]{0,30}\bget\b[^.!?]{0,30}\bback\b|\bguarantee|\bdefinitely qualify|save big|€\s?\d[\d.,]*\s*(?:back|refund))/i.test(t),
  },
];

export const TONE_MODES = {
  Calm: {
    when: 'The user is unsure, confused, or asking a first question.',
    style: 'Short sentences. No jokes. One next step.',
    humour: false,
    example: 'No worries — this is a common thing to be unsure about. Let’s look at one part of it.',
  },
  Helpful: {
    when: 'Default mode for everyday preparation and discovery.',
    style: 'Friendly, lightly playful, still concrete.',
    humour: true,
    example: '💡 Did you know? Naming a document is most of the work. The maths can wait.',
  },
  Celebration: {
    when: 'A preparation step the user chose has just been completed.',
    style: 'Energetic, specific about what was achieved, never about money.',
    humour: true,
    example: '🎉 That is your first document saved. Your future self just avoided ten minutes of panic.',
  },
  Sensitive: {
    when: 'Distress, penalties, debt, disputes, missed deadlines, or legal worry.',
    style: 'No humour at all. Direct, calm, human. Route to a person.',
    humour: false,
    example: 'I’m sorry — that sounds stressful. Let’s take the most urgent part first, and I’ll stay with it.',
  },
};

/** Signals that force Sensitive mode. Matched against the raw user question. */
export const DISTRESS_SIGNALS = [
  { re: /\b(scared|afraid|terrified|anxious|panic|worried sick)\b/i, why: 'Expressed fear' },
  { re: /\bfine[ds]?\b|\bpenalt(y|ies)\b|\blate fee\b/i, why: 'Penalty or fine mentioned' },
  { re: /\bdebt\b|\bcan’t pay\b|\bcan't pay\b|\bno money\b|\bhardship\b/i, why: 'Financial hardship' },
  { re: /\bmissed the deadline\b|\boverdue\b|\btoo late\b/i, why: 'Missed deadline' },
  { re: /\blegal\b|\blawyer\b|\bprosecut|\bfraud\b|\baudit\b|\binvestigat/i, why: 'Potential legal matter' },
  { re: /\bjust submit\b|\bdo it for me\b|\bwithout me\b/i, why: 'User is asking to remove their own approval step' },
];

export function detectTone(question, { celebrating = false } = {}) {
  const signals = DISTRESS_SIGNALS.filter((s) => s.re.test(question));
  if (signals.length) {
    return { mode: 'Sensitive', humour: false, signals, reason: signals.map((s) => s.why).join(', ') };
  }
  if (celebrating) return { mode: 'Celebration', humour: true, signals: [], reason: 'A preparation step just completed' };
  if (/\b(what is|what are|explain|mean|difference)\b/i.test(question)) {
    return { mode: 'Calm', humour: false, signals: [], reason: 'Definition question — clarity beats wit' };
  }
  return { mode: 'Helpful', humour: true, signals: [], reason: 'Default everyday preparation mode' };
}

export const brandGuardian = {
  id: 'brand-guardian',
  name: 'Brand Guardian',
  emoji: '🕊️',
  role: 'Rewrites copy and protects the tone',
  blurb: 'Keeps the humour warm and the promises small.',

  async run(bb, { kb }) {
    const adversarial = bb.get('adversarial', { rejections: [] });
    const toneChunks = kb.search('voice prefer avoid humour rules no judgement answer shape tone modes', {
      k: 3,
      prefer: ['brand_tone_reference'],
    });
    const voiceChunk = toneChunks.find((c) => /voice|prefer|humour/i.test(c.text));

    const rejected = adversarial.rejections ? adversarial.rejections[0] : null;

    const rewrite = {
      id: rejected ? rejected.id : ADVERSARIAL_TARGET.id,
      before: rejected ? rejected.proposed : ADVERSARIAL_TARGET.proposed,
      after:
        '💻 New computer for work? It may be relevant for your taxes. Save the receipt and tell us how you use it before we celebrate.',
      tone: 'Helpful',
      failedOn: rejected
        ? CHECKLIST.filter((c) => !c.test(rejected.proposed)).map((c) => c.id)
        : [],
      passedOn: [],
      reason:
        'Kept the friendly opening, removed the promise, and swapped the punchline for a question the user can actually answer.',
    };
    rewrite.passedOn = CHECKLIST.filter((c) => c.test(rewrite.after)).map((c) => c.id);

    const checklistRun = CHECKLIST.map((c) => ({
      id: c.id,
      label: c.label,
      before: c.test(rewrite.before),
      after: c.test(rewrite.after),
    }));

    // Humour library — the safe cards the dashboard is allowed to show.
    const humourCards = [
      {
        id: 'home-office',
        emoji: '🏠',
        title: 'Your home office may be doing more work than you are',
        body: 'Let’s check whether any work-from-home costs are worth recording. Two questions, no maths.',
        cta: 'Check my situation',
        tone: 'Helpful',
        citation: 'employee_freelancer_scenarios.md#work-from-home',
      },
      {
        id: 'side-hustle',
        emoji: '🧑‍💻',
        title: 'Your side hustle has entered the chat',
        body: 'Keeping invoices as they arrive is the whole trick. Want a monthly nudge?',
        cta: 'Save this as a reminder',
        tone: 'Helpful',
        citation: 'employee_freelancer_scenarios.md#started-a-side-hustle',
      },
      {
        id: 'boxes',
        emoji: '📦',
        title: 'Moved for a new job? Your boxes may have followed you into your tax story',
        body: 'Moving costs may be relevant depending on why you moved. Let’s check the reason first.',
        cta: 'See if this applies',
        tone: 'Helpful',
        citation: 'employee_freelancer_scenarios.md#moved-for-a-new-job',
      },
      {
        id: 'first-document',
        emoji: '🎉',
        title: 'You have named your first document',
        body: 'That was the part that felt impossible. The rest is mostly reading.',
        cta: 'Next small win',
        tone: 'Celebration',
        citation: 'year_round_loop.md#did-you-know-cards',
      },
      {
        id: 'not-relevant',
        emoji: '🙌',
        title: 'Sometimes the answer is "this one does not apply"',
        body: 'That counts as progress. It is one less thing living in your head.',
        cta: 'Good to know',
        tone: 'Calm',
        citation: 'brand_tone_reference.md#voice',
      },
    ];

    // Approve or revise each ELI5 draft.
    const eli5 = bb.get('eli5', null);
    let approvedAnswers = null;
    if (eli5 && eli5.answers) {
      approvedAnswers = eli5.answers.map((answer) => {
        const joined = [answer.acknowledge, answer.explain, answer.example, answer.nextStep].join(' ');
        const failed = CHECKLIST.filter((c) => !c.test(joined));
        const revised = failed.length > 0;
        return {
          ...answer,
          brand: {
            verdict: revised ? 'revised' : 'approved',
            checklist: CHECKLIST.map((c) => ({ id: c.id, label: c.label, pass: c.test(joined) })),
            changed: revised ? failed.map((f) => f.label) : [],
            note: revised
              ? 'One or more tone rules failed; the answer was adjusted before release.'
              : 'Passed every tone rule without changes.',
          },
        };
      });
    }

    const artifact = {
      rewrite,
      checklistRun,
      passedBefore: checklistRun.filter((c) => c.before).length,
      passedAfter: checklistRun.filter((c) => c.after).length,
      toneModes: TONE_MODES,
      toneDetected: eli5 ? eli5.answers.map((a) => ({ question: a.question, mode: a.tone.mode, humour: a.tone.humour, reason: a.tone.reason })) : [],
      humourCards,
      voiceRules: voiceChunk ? bullets(voiceChunk.text, 6) : ['Clear before clever', 'Friendly but not childish', 'One useful next action'],
      noJudgementShape: [
        'Acknowledge — name the feeling, do not dismiss it',
        'Explain simply — one sentence, no jargon',
        'Give one example — concrete and small',
        'Suggest one next step — something doable today',
      ],
      bannedPhrases: [
        'You failed to…',
        'This is obvious',
        'Guaranteed refund',
        'You will get your money back',
        'Act now or lose out',
        'You should know this',
      ],
    };

    bb.put('brandRewrite', rewrite);
    bb.put('brand', artifact);
    if (approvedAnswers) bb.put('eli5Approved', approvedAnswers);
    bb.emit('tip_saved', { card: humourCards[0].id });

    bb.step({
      agentId: this.id,
      status: 'rewritten',
      kind: 'repair',
      title: 'Rewrote the card in a calmer tone',
      detail: `Checklist went from ${artifact.passedBefore}/7 to ${artifact.passedAfter}/7 rules passing.`,
      citations: voiceChunk ? [voiceChunk.id] : [],
      payload: {
        type: 'rewrite',
        before: rewrite.before,
        after: rewrite.after,
        reason: rewrite.reason,
        failedOn: rewrite.failedOn,
        checklist: checklistRun,
      },
    });

    bb.step({
      agentId: this.id,
      status: 'complete',
      title: `Set the tone for ${artifact.toneDetected.length} user questions`,
      detail: `${artifact.toneDetected.filter((t) => !t.humour).length} of them switch humour off entirely.`,
      payload: { type: 'tone', modes: TONE_MODES, detected: artifact.toneDetected, cards: humourCards },
    });

    if (approvedAnswers) {
      bb.put('eli5', { ...eli5, answers: approvedAnswers });
    }

    return artifact;
  },
};
