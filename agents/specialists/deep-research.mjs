/**
 * Deep Research Agent — ring 1 (product).
 *
 * Populates the synthetic knowledge base and turns it into target-group
 * research cards: insight → implication → product opportunity → confidence →
 * source. The "source" field is deliberately honest: it either names a public
 * report *type* that a human must verify, or admits it is a synthetic demo
 * assumption. An agent that fabricates citations is worse than one that admits
 * it has none.
 */

import { labelled, firstSentence, evidence } from '../grounding.mjs';

const REQUIRED_CARDS = 4;

/** Framing/instruction sections are not research findings. */
const FRAMING = /^(how to read|how to use|overview|introduction|index|summary|contents|about)/i;

export const deepResearch = {
  id: 'deep-research',
  name: 'Deep Research',
  emoji: '🔎',
  role: 'Researches the target group and fills the knowledge base',
  blurb: 'Turns public trends into product opportunities, with confidence levels.',

  async run(bb, { kb }) {
    const trendChunks = kb.chunks.filter(
      (c) =>
        c.file === 'target_group_trends.md' &&
        c.heading.toLowerCase() !== 'overview' &&
        !FRAMING.test(c.heading),
    );
    const signalChunks = kb.search(
      'target group behaviour avoidance procrastination multiple income streams mobile personalised trust',
      { k: 3, prefer: ['target_group_trends'] },
    );

    const pool = trendChunks.length ? trendChunks : signalChunks;
    const cards = pool.slice(0, Math.max(REQUIRED_CARDS, Math.min(8, pool.length))).map((c) => {
      const confidence = (labelled(c.text, 'Confidence') || 'medium').toLowerCase();
      return {
        id: c.id,
        trend: c.heading,
        insight: labelled(c.text, 'Insight') || firstSentence(c.text, 200),
        implication:
          labelled(c.text, 'Implication(?: for the target group)?') ||
          labelled(c.text, 'Implication for the target group') ||
          'This changes what the product must make obvious at first glance.',
        opportunity:
          labelled(c.text, 'Product opportunity') ||
          'Turn this into one visible, low-effort preparation action.',
        confidence: ['high', 'medium', 'low'].includes(confidence) ? confidence : 'medium',
        source: labelled(c.text, 'Source') || 'Synthetic demo assumption — verify before citing',
      };
    });

    const artifact = {
      cards,
      summary: `${cards.length} recurring preparation opportunities found for the target group`,
      evidence: evidence([...trendChunks.slice(0, 2), ...signalChunks]).slice(0, 4),
      honestyNote:
        'Confidence and source are shown to the user on purpose. Nothing here is presented as settled tax fact.',
    };

    bb.put('research', artifact);
    bb.emit('research_cards_created', { count: cards.length });

    bb.step({
      agentId: this.id,
      status: 'complete',
      title: `Found ${cards.length} recurring preparation opportunities`,
      detail: cards[0]
        ? `Strongest signal: ${cards[0].trend}.`
        : 'Trend pack loaded from the synthetic knowledge base.',
      citations: cards.slice(0, 3).map((c) => c.id),
      payload: { type: 'insights', cards },
    });

    return artifact;
  },
};
