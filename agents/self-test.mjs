/**
 * self-test.mjs — the acceptance test for the prototype.
 *
 * A hackathon demo that only works when the presenter is lucky is not a demo.
 * These checks assert the things the pitch claims out loud: a readiness score
 * that moves for a stated reason, a rejected unsafe message, a rewrite that
 * passes more rules than the original, and a knowledge base where every
 * citation actually resolves.
 */

import { runTeam } from './orchestrator.mjs';
import { KnowledgeBase } from './retrieval.mjs';

const BANNED_IN_FINAL_COPY = [
  /\byou\b[^.!?]{0,30}\bget\b[^.!?]{0,30}\bback\b/i,
  /\bguarantee/i,
  /definitely qualify/i,
  /save big bucks/i,
];

export async function selfTest(ragDir) {
  const checks = [];
  const add = (label, pass, detail = '') => checks.push({ label, pass: Boolean(pass), detail });

  let kb = null;
  try {
    kb = await KnowledgeBase.load(ragDir);
  } catch (err) {
    add('knowledge base loads', false, String(err.message));
    return { checks, failures: 1 };
  }

  add('knowledge base loads', kb.size > 0, `${kb.size} chunks`);
  add('knowledge base has enough retrievable chunks', kb.size >= 25, `${kb.size} chunks`);

  const requiredFiles = [
    'README.md',
    'target_group_trends.md',
    'product_goals.md',
    'tax_basics.md',
    'employee_freelancer_scenarios.md',
    'year_round_loop.md',
    'brand_tone_reference.md',
    'adversarial_test_cases.md',
    'demo_documents.md',
  ];
  const present = new Set(kb.chunks.map((c) => c.file));
  const missing = requiredFiles.filter((f) => !present.has(f));
  add('all nine RAG files present', missing.length === 0, missing.join(', ') || 'all present');

  const run = await runTeam({ ragDir });

  add('all nine agents produced work',
    run.team.length === 9 && run.team.every((t) => t.status !== 'queued'),
    run.team.filter((t) => t.status === 'queued').map((t) => t.name).join(', ') || '9/9 active');

  const dangling = run.timeline
    .flatMap((step) => step.citations)
    .filter((id) => id && !kb.canResolve(id));
  add('every citation resolves to a real knowledge-base chunk', dangling.length === 0,
    dangling.slice(0, 3).join(', ') || `${run.timeline.flatMap((s) => s.citations).filter(Boolean).length} citations verified`);

  add('readiness starts at the documented 62%', run.dashboard.readinessBefore === 62,
    `got ${run.dashboard.readinessBefore}%`);

  add('default repair path lands at 78%', run.dashboard.readinessAfter === 78,
    `got ${run.dashboard.readinessAfter}%`);

  add('confidence moves 2/5 → 4/5', run.dashboard.confidenceBefore === 2 && run.dashboard.confidenceAfter === 4,
    `${run.dashboard.confidenceBefore} → ${run.dashboard.confidenceAfter}`);

  add('every repair option increases readiness',
    run.repairLoop.options.every((o) => o.readiness.delta > 0),
    run.repairLoop.options.map((o) => `${o.id}:${o.readiness.delta >= 0 ? '+' : ''}${o.readiness.delta}`).join(' '));

  add('uncertainty is preserved in the "not sure" branch',
    run.repairLoop.options.some((o) => o.id === 'not-sure' && o.tasks.some((t) => /expert review/i.test(t.title))),
    'expert review offered');

  add('adversarial agent rejected unsafe copy', run.adversarial.rejectedCount >= 2,
    `${run.adversarial.rejectedCount} rejections`);

  add('rejected copy is a High-severity promise',
    run.adversarial.rejections.some((r) => r.severity === 'High' && /promise/i.test(r.category)),
    run.adversarial.rejections.map((r) => r.severity).join(', '));

  add('rewrite passes more checklist rules than the original',
    run.brand.passedAfter > run.brand.passedBefore,
    `${run.brand.passedBefore}/7 → ${run.brand.passedAfter}/7`);

  add('rewrite survives the second adversarial pass',
    run.adversarialVerify.verdict === 'accepted', run.adversarialVerify.verdict);

  for (const pattern of BANNED_IN_FINAL_COPY) {
    const offenders = [run.brandRewrite.after, ...run.eli5.answers.map((a) =>
      [a.acknowledge, a.explain, a.example, a.nextStep].join(' '))]
      .filter((text) => pattern.test(text));
    add(`final copy carries no unsafe promise (${pattern.source.slice(0, 28)}…)`, offenders.length === 0,
      offenders[0] || 'clean');
  }

  add('trust check audited a meaningful number of claims', run.trust.claimsAudited >= 8,
    `${run.trust.claimsAudited} claims`);

  add('the laptop conflict is raised, not silently resolved',
    run.documents.conflict && run.trust.conflicts.length === 1,
    run.documents.conflict ? run.documents.conflict.documentSays : 'no conflict found');

  add('confidence is held while the conflict is open',
    run.trust.confidence.after === 2 && /held/i.test(run.trust.confidence.reason),
    run.trust.confidence.reason);

  add('hero question is answered in the house shape',
    ['acknowledge', 'explain', 'example', 'nextStep'].every((k) => {
      const hero = run.eli5.answers.find((a) => a.hero);
      return hero && typeof hero[k] === 'string' && hero[k].length > 30;
    }), 'four layers present');

  add('hero answer breaks the situation into three life events',
    (run.eli5.answers.find((a) => a.hero).breakdown || []).length === 3,
    `${(run.eli5.answers.find((a) => a.hero).breakdown || []).length} parts`);

  add('humour is disabled for distress questions',
    run.eli5.answers.filter((a) => a.sensitive).length > 0 &&
      run.eli5.answers.filter((a) => a.sensitive).every((a) => a.tone.humour === false),
    run.eli5.answers.filter((a) => a.sensitive).map((a) => a.id).join(', '));

  add('the "just submit it" request preserves user approval',
    run.eli5.answers.some((a) => a.intent === 'delegation' && a.controlled === true),
    'delegation answer keeps the final button with the user');

  add('every research card carries a confidence level',
    run.research.cards.length >= 4 && run.research.cards.every((c) => ['high', 'medium', 'low'].includes(c.confidence)),
    `${run.research.cards.length} cards`);

  add('readiness is explained, not just displayed',
    Array.isArray(run.dashboard.whyScore) && run.dashboard.whyScore.length >= 3,
    `${(run.dashboard.whyScore || []).length} explanation lines`);

  add('telemetry covers the return loop',
    ['monthly_checkin_started', 'document_saved', 'confidence_recorded'].every((e) =>
      run.telemetry.some((t) => t.name === e)),
    `${run.telemetry.length} events`);

  const failures = checks.filter((c) => !c.pass).length;
  return { checks, failures, run };
}
