/**
 * Product Expert Agent — ring 1 (product).
 *
 * Owns the product goal and target-user fit. Everything downstream is judged
 * against the artefact this agent writes to the blackboard: if an agent cannot
 * tie its output back to `goals.priority` or `goals.success_metric`, the
 * orchestrator is allowed to drop it.
 */

import { yamlBlock, bullets, evidence } from '../grounding.mjs';

export const productExpert = {
  id: 'product-expert',
  name: 'Product Expert',
  emoji: '🎯',
  role: 'Owns target-user fit, goals and non-goals',
  blurb: 'Defines who this is for and what "better" means for them.',

  async run(bb, { kb, query }) {
    const chunks = kb.search(
      `primary user core problem desired outcome priority success metric guardrail ${query}`,
      { k: 3, prefer: ['product_goals'] },
    );
    const goals = chunks.map((c) => yamlBlock(c.text)).find((g) => g.primary_user) || {};
    const principlesSource = chunks.find((c) => /principle|we will not|non-goal/i.test(c.text));

    const fallback = {
      primary_user: 'Tech-savvy employed person, 25–40, with occasional freelance income',
      core_problem: 'Tax anxiety and a lack of year-round preparation',
      desired_outcome: 'The user feels informed, prepared and in control',
      priority: 'Recurring tax readiness, not only annual filing',
      success_metric: 'The user completes one useful preparation action',
      guardrail: 'No guaranteed refunds, no judgement, the user approves every step',
      tone_default: 'Helpful',
    };

    const goals_ = { ...fallback, ...goals };
    const principles = principlesSource ? bullets(principlesSource.text, 7) : [];

    const artifact = {
      ...goals_,
      principles: principles.length
        ? principles
        : [
            'One understandable action at a time',
            'Explain why each step matters before asking for it',
            'The user stays in control and approves everything',
            'Reward preparation and understanding, never refund size',
            'Show uncertainty instead of hiding it',
          ],
      notBuilding: [
        'A leaderboard, streak-shaming or a countdown to the deadline',
        'Automatic submission without explicit human approval',
        'Any promise of a specific refund amount',
        'A generic chatbot disconnected from the user’s documents',
      ],
      metrics: {
        leading: 'Preparation actions completed per month',
        lagging: 'Self-reported confidence before / after a session',
        guardrail: 'Adversarial rejections resolved before the user sees copy',
      },
      evidence: evidence(chunks),
    };

    bb.put('goals', artifact);

    bb.step({
      agentId: this.id,
      status: 'complete',
      title: 'Defined the target user and the success criteria',
      detail: `${artifact.primary_user}. Priority: ${artifact.priority.toLowerCase()}.`,
      citations: artifact.evidence.map((e) => e.id),
      payload: {
        type: 'goals',
        headline: artifact.desired_outcome,
        rows: [
          ['Core problem', artifact.core_problem],
          ['Priority', artifact.priority],
          ['Success metric', artifact.success_metric],
          ['Guardrail', artifact.guardrail],
        ],
        principles: artifact.principles,
        notBuilding: artifact.notBuilding,
      },
    });

    return artifact;
  },
};
