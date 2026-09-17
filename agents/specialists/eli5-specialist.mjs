/**
 * ELI5 Tax Specialist — the user-facing layer.
 *
 * This is not a fifth disconnected chatbot. It answers using the artefacts the
 * other agents already wrote to the blackboard, and every answer follows the
 * house shape: Acknowledge → Explain simply → Give one example → Suggest one
 * next step. It drafts; the Adversarial and Brand agents get the last word.
 */

import { firstSentence, bestParagraph, blockquote, bullets, labelled } from '../grounding.mjs';
import { detectTone } from './brand-guardian.mjs';
import { HERO_QUESTION, PRESET_QUESTIONS } from '../demo-script.mjs';

/** Classify what the user is actually asking for. */
function classify(question) {
  if (/\b(just submit|do it for me|without me|handle it)\b/i.test(question)) return 'delegation';
  if (/\b(scared|afraid|worried|fine[ds]?|penalt)/i.test(question)) return 'reassurance';
  if (/\b(can i get|money back|how much|will i get|save)\b/i.test(question)) return 'outcome-seek';
  if (/\b(what is|what are|explain|mean|difference)\b/i.test(question)) return 'definition';
  return 'situation';

}

function definitionAnswer(kb, question, topicHint) {
  const chunks = kb.search(`${question} ${topicHint}`, { k: 3, prefer: ['tax_basics'] });
  const chunk = chunks[0];
  const quote = chunk ? blockquote(chunk.text) : '';
  const paras = chunk ? bestParagraph(chunk.text) : '';

  return {
    acknowledge: 'Good question — and no, you are not expected to already know this.',
    explain: quote || firstSentence(paras, 220) || 'This is one of the words that makes tax feel harder than it is.',
    example:
      bullets(chunk ? chunk.text : '', 2).map((b) => b.replace(/^\d+\.\s*/, ''))[0] ||
      'Think of it as a label the tax office uses to decide how much tax is taken from your pay each month.',
    nextStep:
      'Say the word and I’ll show you where this shows up in your own documents — or save this as a tip and come back to it.',
    citations: chunks.map((c) => c.id),
  };
}

export const eli5Specialist = {
  id: 'eli5-specialist',
  name: 'ELI5 Specialist',
  emoji: '💬',
  role: 'Explains anything, without judgement',
  blurb: 'Asks nothing of you except the question you already have.',

  async run(bb, { kb }) {
    const docs = bb.get('documents', { documents: [], conflict: null });
    const plan = bb.get('plan', { nextAction: null, plan: [] });
    const research = bb.get('research', { cards: [] });
    const goals = bb.get('goals', {});

    const answers = PRESET_QUESTIONS.map((preset) => {
      const tone = detectTone(preset.question);
      const intent = classify(preset.question);
      const base = {
        id: preset.id,
        label: preset.label,
        question: preset.question,
        hero: Boolean(preset.hero),
        intent,
        tone,
        citations: [],
        suggestions: [],
        relatedDocuments: [],
        agentTrace: [],
        draft: true,
      };

      if (intent === 'delegation') {
        return {
          ...base,
          acknowledge:
            'I can do almost all of it — but I will not press the final button, and that is deliberate.',
          explain:
            'Every value that goes into a tax return has to be confirmed by you. If I submit on your behalf, you lose the chance to catch the one number that is wrong.',
          example:
            'Your laptop receipt is the perfect case: I can read the date and the amount, but only you know how it was used.',
          nextStep:
            'Let’s do the two-minute laptop question now. After that, you review one summary screen and you press submit — with me standing next to you.',
          suggestions: [
            { label: 'Do the 2-minute question', action: 'repair' },
            { label: 'Show me the summary first', action: 'summary' },
          ],
          citations: docs.conflict ? [docs.conflict.citation] : [],
          controlled: true,
        };
      }

      if (intent === 'reassurance') {
        const chunks = kb.search('missed deadline penalty worried scared what to do uncertain', {
          k: 2,
          prefer: ['tax_basics', 'brand_tone_reference'],
        });
        return {
          ...base,
          acknowledge: 'I’m sorry — that sounds genuinely stressful, and it is a very common fear.',
          explain:
            'A lot of what people are frightened of turns out to be a letter asking for one document. That does not make the fear silly, but it does mean the first step is usually reading, not paying.',
          example:
            'We found a letter from the tax office in your documents. The first thing worth checking is whether it contains a date or just an information request.',
          nextStep:
            'Open that letter together, calmly, and I will tell you which of the two it is. If it turns out to be serious, we hand it to a human expert — I will not guess.',
          suggestions: [
            { label: 'Open the letter together', action: 'document' },
            { label: 'Talk to a human instead', action: 'expert' },
          ],
          citations: chunks.map((c) => c.id),
          sensitive: true,
          humourDisabled: true,
        };
      }

      if (preset.id === 'laptop') {
        return {
          ...base,
          acknowledge: 'Probably not the whole amount — but it is very likely worth recording.',
          explain:
            'A work expense usually reduces the income your tax is calculated on. It does not normally mean the purchase price comes back to you.',
          example:
            'We found your receipt: €1,249 from 14 September. What matters next is not the amount, it is how much of the laptop is used for work.',
          nextStep:
            'Tell me how you use it — freelance, employment, or a mix — and I will record it in the right place.',
          suggestions: [
            { label: 'Mostly freelance', action: 'repair:mostly-freelance' },
            { label: 'About half and half', action: 'repair:half-and-half' },
            { label: 'Mostly private', action: 'repair:mostly-private' },
          ],
          citations: [docs.conflict ? docs.conflict.citation : 'demo_documents.md#document-laptop-receipt'],
          relatedDocuments: docs.documents.filter((d) => d.type === 'computer_receipt').map((d) => d.id),
        };
      }

      if (preset.id === 'jargon') {
        return { ...base, ...definitionAnswer(kb, preset.question, 'tax class label monthly pay') };
      }

      // Hero question: the three life changes in one answer.
      const scenarioChunks = kb.search('got married started freelancing bought a computer life event', {
        k: 3,
        prefer: ['employee_freelancer_scenarios'],
      });
      return {
        ...base,
        acknowledge:
          'Probably not — and you are asking at exactly the right time. Three things changed this year, and none of them are mistakes.',
        explain:
          'Marriage, a work laptop and freelance income are all ordinary life events. Each one changes a question that has to be answered — not whether you did something wrong.',
        example:
          'People in your situation usually end up with three small jobs: confirm one date, confirm how the laptop is used, and list the freelance invoices you already have.',
        nextStep:
          'Start with the laptop. It is the only item where two of your answers disagree, so it is the one thing genuinely worth two minutes right now.',
        breakdown: [
          {
            emoji: '💍',
            title: 'You got married',
            status: 'one question',
            detail:
              'The date of the marriage is what matters, and whether you both had income this year. It can change which tax class applies to your pay.',
            cta: 'Answer 2 questions',
            action: 'plan:task_marriage_check',
            citation: scenarioChunks[0] ? scenarioChunks[0].id : 'employee_freelancer_scenarios.md#got-married-this-year',
          },
          {
            emoji: '💻',
            title: 'You bought a work laptop',
            status: 'needs you',
            detail:
              'The receipt says work and private use; your answer said 100% freelance. That is the one conflict in your file, and I will not guess it.',
            cta: 'Resolve in 2 min',
            action: 'repair',
            highlight: true,
            citation: docs.conflict ? docs.conflict.citation : null,
          },
          {
            emoji: '🧑‍💻',
            title: 'You started freelancing',
            status: 'mostly done',
            detail:
              'Your €1,800 invoice from Bluebird Studio is already recorded. What is missing is the expense side, which is cheaper to collect as you go.',
            cta: 'See the checklist',
            action: 'plan:task_freelance_review',
            citation: scenarioChunks[1] ? scenarioChunks[1].id : 'employee_freelancer_scenarios.md#started-a-side-hustle',
          },
        ],
        confidenceNote:
          'Your confidence usually moves once the open question is closed — not because the answer was good news, but because there is nothing left to hold in your head.',
        suggestions: [
          { label: 'Start with the laptop', action: 'repair' },
          { label: 'Show me the whole plan', action: 'plan' },
        ],
        citations: scenarioChunks.map((c) => c.id),
        relatedDocuments: docs.documents.map((d) => d.id),
      };
    });

    // A did-you-know card chosen from the research the Deep Research agent found.
    const didYouKnow = research.cards.length
      ? {
          emoji: '💡',
          title: 'Did you know?',
          body: `Because you freelance on the side, ${String(research.cards[0].opportunity || '').replace(/^Turn this into /, '')}`.trim(),
          cta: 'Save this tip',
          citation: research.cards[0].id,
          confidence: research.cards[0].confidence,
        }
      : {
          emoji: '💡',
          title: 'Did you know?',
          body: 'You do not need to understand every tax word before you start. Naming the document is most of the work.',
          cta: 'Save this tip',
          citation: 'year_round_loop.md#did-you-know-cards',
          confidence: 'medium',
        };

    // Trace that the UI renders under the hero answer, proving it is not a lone bot.
    const heroTrace = [
      { agent: 'ELI5 Specialist', action: 'Classified the question as a situation question, not a request for advice' },
      { agent: 'Deep Research', action: `Supplied ${research.cards.length} target-group insights about life-event triggers` },
      { agent: 'Document Detective', action: `Checked your ${docs.documents.length} documents and found the laptop conflict` },
      { agent: 'Tax Planner', action: `Created ${plan.plan ? plan.plan.length : 0} steps and promoted exactly one` },
      { agent: 'Trust Check', action: 'Held confidence at 2/5 while the conflict is open' },
      { agent: 'Adversarial Reviewer', action: 'Rejected two drafts that promised a saving' },
      { agent: 'Brand Guardian', action: 'Rewrote the card so the claim stays conditional' },
    ];

    const artifact = {
      answers,
      heroTrace,
      didYouKnow,
      goalAlignment: goals.success_metric
        ? `Every answer ends in one action, because the goal sheet defines success as: ${goals.success_metric}`
        : 'Every answer ends in one action.',
      houseShape: ['Acknowledge', 'Explain simply', 'Give one example', 'Suggest one next step'],
    };

    bb.put('eli5', artifact);
    bb.emit('tip_opened', { card: didYouKnow.citation });

    bb.step({
      agentId: this.id,
      status: 'complete',
      title: `Answered "${HERO_QUESTION.slice(0, 44)}…" in plain English`,
      detail: `${answers.length} questions drafted, ${answers.filter((a) => a.tone.humour === false).length} with humour switched off entirely.`,
      citations: answers.flatMap((a) => a.citations).slice(0, 3),
      payload: {
        type: 'eli5',
        hero: answers.find((a) => a.hero),
        questions: PRESET_QUESTIONS,
        didYouKnow,
        heroTrace,
      },
    });

    return artifact;
  },
};
