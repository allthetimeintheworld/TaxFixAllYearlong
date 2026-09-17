/**
 * Tax Planner — ring 2 (tax).
 *
 * Owns the readiness score and the next best action. The Planner's discipline is
 * that it produces exactly ONE next best action, plus a small backlog. Ten
 * outstanding tasks is not a plan, it is a new source of anxiety.
 */

import { makeReadiness, scoreOf, readinessLabel, openItems } from '../readiness.mjs';
import { bullets, evidence } from '../grounding.mjs';
import { REPAIR } from '../demo-script.mjs';

export const taxPlanner = {
  id: 'tax-planner',
  name: 'Tax Planner',
  emoji: '🗺️',
  role: 'Turns findings into one next action and a year-round plan',
  blurb: 'Keeps the list short enough to actually finish.',

  async run(bb, { kb, query }) {
    const docs = bb.get('documents', { documents: [], conflict: null });
    const goals = bb.get('goals', {});
    const items = makeReadiness();
    const { score } = scoreOf(items);

    const loopChunks = kb.search(
      `monthly check-in year round loop readiness confidence streak reminders ${query}`,
      { k: 3, prefer: ['year_round_loop'] },
    );
    const checkinSource = loopChunks.find((c) => /check-?in/i.test(c.text));
    const checkin = checkinSource ? bullets(checkinSource.text, 5) : [];

    const scenarioChunks = kb.search(
      'got married bought a computer work from home side hustle life event',
      { k: 3, prefer: ['employee_freelancer_scenarios'] },
    );

    // The plan is derived from what the other agents already found, not invented.
    const plan = [
      {
        id: 'task_laptop_share',
        title: 'Confirm how the laptop is used',
        why: 'It is the only thing standing between you and a complete expense record.',
        agent: 'Document Detective',
        effort: '2 min',
        priority: 1,
        blocks: ['laptop_use_clarified', 'laptop_work_share'],
        status: 'next',
        citation: docs.conflict ? docs.conflict.citation : null,
      },
      {
        id: 'task_marriage_check',
        title: 'Run the marriage year check',
        why: 'A life event this year can change which tax class applies to you. Two questions, no maths.',
        agent: 'Tax Planner',
        effort: '3 min',
        priority: 2,
        blocks: ['marriage_check'],
        status: 'queued',
        citation: scenarioChunks[0] ? scenarioChunks[0].id : null,
      },
      {
        id: 'task_freelance_review',
        title: 'Put your freelance question in for review',
        why: 'One answer from a human removes the "am I allowed to do this?" worry for good.',
        agent: 'ELI5 Specialist',
        effort: '1 min',
        priority: 3,
        blocks: ['expert_review'],
        status: 'queued',
        citation: scenarioChunks[1] ? scenarioChunks[1].id : null,
      },
      {
        id: 'task_home_office',
        title: 'Note your home-office days so far',
        why: 'A rough count now is worth more than an exact guess in a hurry later.',
        agent: 'Tax Planner',
        effort: '3 min',
        priority: 4,
        blocks: ['home_office'],
        status: 'queued',
        citation: scenarioChunks[2] ? scenarioChunks[2].id : null,
      },
    ];

    const nextAction = plan[0];

    const artifact = {
      items,
      score,
      label: readinessLabel(score),
      nextAction,
      plan,
      remaining: openItems(items).length,
      checkin: checkin.length
        ? checkin
        : [
            'Did your job change?',
            'Did you start or stop freelancing?',
            'Did you move or work from home?',
            'Did you buy something mainly for work?',
            'Did you receive an important letter or document?',
          ],
      streak: 2,
      wins: [
        { icon: '📄', text: 'Saved your employment tax statement', when: 'this month' },
        { icon: '🧠', text: 'You can now explain what freelance income is', when: 'this month' },
        { icon: '🔥', text: 'Preparation streak: 2 months running', when: 'ongoing' },
      ],
      whyScore: [
        `${score} points come from ${items.filter((i) => i.done).length} completed preparation items`,
        'Nothing here is based on refund size or filing speed',
        `The next ${nextAction ? nextAction.effort : '2 min'} task adds ${items.find((i) => i.id === 'laptop_use_clarified').weight} points`,
      ],
      evidence: evidence(loopChunks),
      guardrail: 'One next action only. The backlog exists, but it stays behind the fold.',
    };

    bb.put('plan', artifact);
    bb.emit('monthly_checkin_started', { streak: artifact.streak });
    bb.emit('next_action_completed', { task: nextAction.id, pending: true });

    bb.step({
      agentId: this.id,
      status: 'complete',
      title: `Created ${plan.length} next steps — and surfaced only one`,
      detail: `Readiness is ${score}% (${artifact.label}). Next best action: ${nextAction.title.toLowerCase()}.`,
      citations: artifact.evidence.map((e) => e.id),
      payload: {
        type: 'plan',
        score,
        label: artifact.label,
        nextAction,
        plan: plan.map((p) => ({ id: p.id, title: p.title, effort: p.effort, status: p.status, why: p.why })),
        checkin: artifact.checkin,
        whyScore: artifact.whyScore,
      },
    });

    return artifact;
  },
};
