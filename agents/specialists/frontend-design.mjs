/**
 * Frontend Design Agent — ring 1 (product).
 *
 * Emits a UI specification, not code. It decides screen hierarchy, component
 * states and what must be legible in five seconds. The build in `web/` is the
 * implementation of this specification, so the agent's output is also the
 * demo's own documentation.
 */

export const frontendDesign = {
  id: 'frontend-design',
  name: 'Frontend Designer',
  emoji: '🎨',
  role: 'Turns product goals into the visual experience',
  blurb: 'Decides hierarchy, states and copy so the product reads in five seconds.',

  async run(bb) {
    const goals = bb.get('goals', {});
    const research = bb.get('research', { cards: [] });

    const screens = [
      {
        id: 'today',
        name: 'Today',
        purpose: 'Answer "am I okay?" in one glance.',
        blocks: [
          'Tax readiness score (0–100) with a plain-language label',
          'Three small wins from the last 30 days',
          'Next best action — exactly one, with a "why this matters" line',
          'AI team status strip: who is working, who is waiting for you',
          'A single "You’re in control" approval affordance',
        ],
      },
      {
        id: 'team',
        name: 'AI Team',
        purpose: 'Prove the work is coordinated, and show the repair loop.',
        blocks: [
          'Vertical agent timeline with Working → Waiting → Complete states',
          'Expandable artefacts: the goal sheet, the research cards, the plan',
          'Adversarial rejection rendered as a before/after diff',
          'Brand rewrite with the checklist it had to pass',
          'Evidence chips: every claim links to a knowledge-base section',
        ],
      },
      {
        id: 'ask',
        name: 'Ask',
        purpose: 'Remove the fear of asking a stupid question.',
        blocks: [
          'One question box, no jargon, no login pressure',
          'Answer in four labelled layers: Acknowledge → Explain → Example → Next step',
          'Tone-mode indicator (Calm / Helpful / Celebration / Sensitive)',
          'Confidence before and after the exchange',
          'Did-you-know cards with Save this tip',
        ],
      },
    ];

    const artifact = {
      screens,
      visualPrinciples: [
        'Warm off-white canvas, one deep-green anchor, one warm accent — no neon, no alarm red',
        'Large rounded cards with generous spacing; nothing shouts',
        'Progress is always shown as a position, never a countdown',
        'Every number is paired with a sentence that explains it',
        'Humour is a garnish on a calm sentence, never the sentence itself',
        'The approval button is always visible and always the user’s',
      ],
      states: ['queued', 'working', 'waiting', 'complete', 'flagged', 'rewritten'],
      heroMoment: 'Confidence 2/5 → 4/5 rendered as the same component changing state',
      rationale: goals.priority
        ? `Hierarchy follows the product priority: ${String(goals.priority).toLowerCase()}.`
        : 'Hierarchy follows the product priority: recurring readiness over one-off filing.',
      researchUsed: research.cards ? research.cards.length : 0,
    };

    bb.put('design', artifact);

    bb.step({
      agentId: this.id,
      status: 'complete',
      title: 'Designed the "Tax Readiness" dashboard and the AI Team view',
      detail: `${screens.length} screens specified. Hero moment: ${artifact.heroMoment.toLowerCase()}.`,
      payload: { type: 'design', screens, visualPrinciples: artifact.visualPrinciples },
    });

    return artifact;
  },
};
