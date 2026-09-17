/**
 * orchestrator.mjs — sequences the two agent rings over one shared blackboard.
 *
 * Pipeline (matches the criteria mapping in the brief):
 *
 *   product ring   Product Expert → Deep Research → Frontend Designer
 *   tax ring       Document Detective → Tax Planner → ELI5 Specialist
 *   quality ring   Trust Check → Adversarial Reviewer → Brand Guardian
 *   governance     Adversarial Reviewer re-attacks the rewrite
 *
 * The orchestrator does not let an agent call another agent directly. Everyone
 * writes to the blackboard, which is what makes the "AI Team" screen an honest
 * rendering of what actually happened rather than a scripted animation.
 */

import { join } from 'node:path';
import { KnowledgeBase } from './retrieval.mjs';
import { Blackboard } from './blackboard.mjs';
import { productExpert } from './specialists/product-expert.mjs';
import { deepResearch } from './specialists/deep-research.mjs';
import { frontendDesign } from './specialists/frontend-design.mjs';
import { documentDetective } from './specialists/document-detective.mjs';
import { taxPlanner } from './specialists/tax-planner.mjs';
import { eli5Specialist } from './specialists/eli5-specialist.mjs';
import { trustCheck } from './specialists/trust-check.mjs';
import { adversarialFit } from './specialists/adversarial-fit.mjs';
import { brandGuardian } from './specialists/brand-guardian.mjs';
import { complete, scoreOf, readinessLabel } from './readiness.mjs';
import { BRIEF, USER, REPAIR, HERO_QUESTION, PRESET_QUESTIONS } from './demo-script.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Run the whole agent team.
 * @param {{ragDir?: string, pace?: number}} [opts] `pace` is ms to wait between
 *   steps — only used by the live "watch it think" terminal mode.
 */
export async function runTeam(opts = {}) {
  const ragDir = opts.ragDir || join(process.cwd(), 'taxfix_loop_rag');
  const pace = opts.pace || 0;

  const kb = await KnowledgeBase.load(ragDir);
  const bb = new Blackboard({ brief: BRIEF });

  for (const agent of [
    productExpert,
    deepResearch,
    frontendDesign,
    documentDetective,
    taxPlanner,
    eli5Specialist,
    trustCheck,
    adversarialFit,
    brandGuardian,
  ]) {
    bb.register(agent);
  }

  const ctx = { kb, query: BRIEF };
  const pause = async () => {
    if (pace) await sleep(pace);
  };

  bb.emit('session_started', { ragChunks: kb.size, agents: bb.listAgents().length });

  // ── Ring 1: product ────────────────────────────────────────────────────────
  await productExpert.run(bb, ctx);
  await pause();
  bb.emit('goals_defined', { priority: bb.get('goals').priority });
  await deepResearch.run(bb, ctx);
  await pause();
  await frontendDesign.run(bb, ctx);
  await pause();

  // ── Ring 2: documents, plan, and the user-facing answer draft ─────────────
  await documentDetective.run(bb, ctx);
  await pause();
  await taxPlanner.run(bb, ctx);
  await pause();
  await eli5Specialist.run(bb, ctx);
  await pause();

  // ── Quality ring ──────────────────────────────────────────────────────────
  // Adversarial runs first so that Trust Check audits the rejected drafts too:
  // the reviewer surfaces the bad copy, the auditor confirms it is unsafe, and
  // only then is Brand allowed to rewrite it.
  await adversarialFit.run(bb, { ...ctx, phase: 'attack' });
  await pause();
  await trustCheck.run(bb, ctx);
  await pause();
  await brandGuardian.run(bb, ctx);
  await pause();
  await adversarialFit.run(bb, { ...ctx, phase: 'verify' });
  await pause();

  // ── The repair loop ───────────────────────────────────────────────────────
  // Precompute every branch so the demo can be driven live from the browser
  // without a server: the user clicks an answer, the UI applies the delta.
  const baseItems = bb.get('plan').items;
  const readinessBefore = scoreOf(baseItems).score;

  const repairOptions = REPAIR.options.map((option) => {
    const simulated = baseItems.map((i) => ({ ...i }));
    const result = complete(simulated, option.completes);
    const opens = simulated.filter((i) => !i.done).length;

    return {
      id: option.id,
      label: option.label,
      helper: option.helper,
      tone: option.tone,
      trustNote: option.trustNote,
      plannerNote: option.plannerNote,
      tasks: option.tasks,
      confidence: {
        before: USER.confidenceBefore,
        after: Math.min(5, USER.confidenceBefore + option.confidenceDelta),
        delta: option.confidenceDelta,
      },
      readiness: {
        before: result.before.score,
        after: result.after.score,
        delta: result.delta,
        labelBefore: readinessLabel(result.before.score),
        labelAfter: readinessLabel(result.after.score),
      },
      completedItems: simulated.filter((i) => i.done).map((i) => i.id),
      openItems: simulated.filter((i) => !i.done).map((i) => ({ id: i.id, label: i.label })),
      remaining: opens,
      events: [
        'confidence_recorded',
        'next_action_completed',
        'document_saved',
        'user_returned_within_30_days',
      ],
      // Steps appended to the AI Team timeline after the user answers.
      steps: [
        {
          agentId: 'trust-check',
          agentName: 'Trust Check',
          emoji: '🛡️',
          role: 'Audits grounding, uncertainty and conflicts',
          status: 'complete',
          kind: 'approve',
          title: 'Conflict resolved by the user — not by the system',
          detail: option.trustNote,
          citations: ['demo_documents.md#document-laptop-receipt'],
          payload: { type: 'resolution', option: option.id },
        },
        {
          agentId: 'tax-planner',
          agentName: 'Tax Planner',
          emoji: '🗺️',
          role: 'Turns findings into one next action and a year-round plan',
          status: 'complete',
          kind: 'normal',
          title: `Readiness moved ${result.before.score}% → ${result.after.score}%`,
          detail: option.plannerNote,
          citations: [],
          payload: {
            type: 'readiness-change',
            before: result.before.score,
            after: result.after.score,
            delta: result.delta,
          },
        },
        {
          agentId: 'brand-guardian',
          agentName: 'Brand Guardian',
          emoji: '🕊️',
          role: 'Rewrites copy and protects the tone',
          status: 'complete',
          kind: 'normal',
          title:
            option.tone === 'sensitive'
              ? 'Kept humour switched off for this answer'
              : 'Kept the celebration about preparation, not money',
          detail:
            option.tone === 'sensitive'
              ? 'Not-sure is a vulnerable answer. No jokes, no streak pressure, one expert review instead.'
              : 'The win is a completed preparation step. The copy never mentions an amount.',
          citations: [],
          payload: { type: 'tone-hold', tone: option.tone },
        },
        {
          agentId: 'eli5-specialist',
          agentName: 'ELI5 Specialist',
          emoji: '💬',
          role: 'Explains anything, without judgement',
          status: 'complete',
          kind: 'normal',
          title: 'Closed the loop with one sentence and one next step',
          detail: `New next best action: ${option.tasks[0] ? option.tasks[0].title.toLowerCase() : 'review your summary'}.`,
          citations: [],
          payload: { type: 'closing', tasks: option.tasks },
        },
      ],
    };
  });

  const defaultPath = repairOptions[0];

  const snapshot = bb.snapshot();

  // Citation index: lets the UI show the actual source text behind a citation
  // instead of just naming a file. This is the visible proof of grounding.
  const evidenceIndex = {};
  for (const chunk of kb.chunks) {
    evidenceIndex[chunk.id] = {
      id: chunk.id,
      file: chunk.file,
      doc: chunk.doc,
      heading: chunk.heading,
      snippet: chunk.text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/^[#>\-*\s]+/gm, '')
        .replace(/\*\*/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 420),
    };
  }

  const run = {
    meta: {
      version: '1.0.0',
      runId: snapshot.runId,
      generatedAt: new Date().toISOString(),
      durationMs: snapshot.durationMs,
      mode: 'deterministic-grounded',
      ragChunks: kb.size,
      ragFiles: [...new Set(kb.chunks.map((c) => c.file))].sort(),
      agentCount: bb.listAgents().length,
      note:
        'Every agent runs locally against the synthetic markdown pack. No network, no API key, same result every time.',
    },
    user: USER,
    brief: BRIEF,
    heroQuestion: HERO_QUESTION,
    presetQuestions: PRESET_QUESTIONS,
    evidenceIndex,
    goals: snapshot.goals,
    research: snapshot.research,
    design: snapshot.design,
    documents: snapshot.documents,
    plan: snapshot.plan,
    trust: snapshot.trust,
    adversarial: snapshot.adversarial,
    adversarialVerify: snapshot.adversarialVerify,
    brand: snapshot.brand,
    brandRewrite: snapshot.brandRewrite,
    eli5: snapshot.eli5,
    team: snapshot.team,
    timeline: snapshot.timeline,
    telemetry: snapshot.telemetry,
    repairLoop: {
      item: REPAIR.item,
      question: REPAIR.question,
      subtext: REPAIR.subtext,
      conflict: snapshot.documents ? snapshot.documents.conflict : null,
      options: repairOptions,
      defaultOptionId: defaultPath.id,
    },
    dashboard: {
      readinessBefore: readinessBefore,
      readinessAfter: defaultPath.readiness.after,
      labelBefore: readinessLabel(readinessBefore),
      labelAfter: defaultPath.readiness.labelAfter,
      confidenceBefore: USER.confidenceBefore,
      confidenceAfter: defaultPath.confidence.after,
      wins: snapshot.plan.wins,
      nextAction: snapshot.plan.nextAction,
      plan: snapshot.plan.plan,
      checkin: snapshot.plan.checkin,
      whyScore: snapshot.plan.whyScore,
      streak: snapshot.plan.streak,
    },
    metrics: {
      claimsAudited: snapshot.trust.claimsAudited,
      claimsBlocked: snapshot.trust.blockedCount,
      unsafeMessagesRejected: snapshot.adversarial.rejectedCount,
      conceptRisksFixed: snapshot.adversarial.fixCount,
      checklistBefore: snapshot.brand.passedBefore,
      checklistAfter: snapshot.brand.passedAfter,
      documentsIdentified: snapshot.documents.documents.length,
      preparationMinutesSaved: snapshot.documents.documents.length * 4,
      confidenceGain: defaultPath.confidence.after - USER.confidenceBefore,
      readinessGain: defaultPath.readiness.delta,
    },
  };

  bb.emit('session_completed', { readiness: defaultPath.readiness.after });
  run.telemetry = bb.telemetry;

  return run;
}
