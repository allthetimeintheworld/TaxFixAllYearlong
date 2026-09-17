/**
 * demo-script.mjs — the fixed scenario the 90-second demo runs on.
 *
 * Keeping the scenario in one file means the demo is reproducible: same brief,
 * same documents, same conflict, same adversarial rejection, every single run.
 * Nothing here is real personal data.
 */

export const BRIEF = [
  'Alex is good with technology but avoids taxes because every document feels',
  'like evidence of not knowing enough. Taxfix Loop turns each confusing moment',
  'into one understandable action. The agents do not take control away from',
  'Alex — they make Alex feel capable of taking it.',
].join(' ');

export const USER = {
  name: 'Alex Morgan',
  shortName: 'Alex',
  age: 31,
  role: 'Software developer at Northstar Software GmbH',
  sideIncome: 'Occasional UX and web freelance work',
  language: 'English',
  confidenceBefore: 2,
  confidenceAfter: 4,
};

/**
 * The single real workflow the prototype implements end to end:
 * upload → identify → explain → plan → review → clarify → dashboard updates.
 */
export const REPAIR = {
  item: 'laptop receipt',
  documentType: 'computer_receipt',
  conflict: {
    documentSays: 'work and private use',
    userClaim: '100% for freelance work',
    why: 'The receipt records mixed use, but Alex’s first answer claims full work use. The two cannot both be true, and the number changes what Alex may record.',
  },
  question: 'Quick check — how do you actually use the laptop?',
  subtext:
    'I found the receipt from 14 September (€1,249). Your earlier answer said 100% freelance. The receipt says work and private use. I will not guess which one is right.',
  options: [
    {
      id: 'mostly-freelance',
      label: 'Mostly for freelance work',
      helper: 'Roughly 80–90% of the time',
      tone: 'confident',
      completes: ['laptop_use_clarified', 'laptop_work_share'],
      confidenceDelta: 2,
      tasks: [
        {
          title: 'Record your work-use share for the laptop',
          why: 'The share is what makes the €1,249 relevant. Without it, nothing can be recorded.',
          agent: 'Tax Planner',
          effort: '2 min',
        },
        {
          title: 'Keep the receipt with your freelance records',
          why: 'A receipt without a purpose note is hard to defend later.',
          agent: 'Document Detective',
          effort: '1 min',
        },
      ],
      trustNote:
        'Recorded as mixed use with a stated work share. Still your estimate — you can change it any time.',
      plannerNote:
        'Because the laptop is used across both activities, the Planner split the record so employment and freelance each keep their own copy.',
    },
    {
      id: 'half-and-half',
      label: 'About half and half',
      helper: 'Work and private use are roughly equal',
      tone: 'measured',
      completes: ['laptop_use_clarified', 'laptop_work_share'],
      confidenceDelta: 2,
      tasks: [
        {
          title: 'Record a 50% work-use share',
          why: 'A rough split is still far better than a guess, and you can refine it later.',
          agent: 'Tax Planner',
          effort: '2 min',
        },
        {
          title: 'Add a one-line note about how you split it',
          why: 'Future you will not remember the reasoning. One line is enough.',
          agent: 'Document Detective',
          effort: '1 min',
        },
      ],
      trustNote:
        'Split use recorded. This is a reasonable estimate, not a verified figure — review it before anything is submitted.',
      plannerNote:
        'The Planner kept the claim modest to match the evidence, and added a note task so the reasoning survives.',
    },
    {
      id: 'mostly-private',
      label: 'Mostly private use',
      helper: 'Work is the smaller part',
      tone: 'calm',
      completes: ['laptop_use_clarified'],
      confidenceDelta: 1,
      tasks: [
        {
          title: 'Mark the laptop as mainly private use',
          why: 'Knowing something is not relevant is a real result. It removes a worry instead of adding one.',
          agent: 'Trust Check',
          effort: '1 min',
        },
      ],
      trustNote:
        'Marked as mainly private. The Planner will not build a claim on it unless you tell it otherwise.',
      plannerNote:
        'The Planner deliberately created no expense task. Saying "this one does not apply" is a valid, confidence-building outcome.',
    },
    {
      id: 'not-sure',
      label: 'I’m not sure',
      helper: 'That is a completely normal answer',
      tone: 'sensitive',
      completes: ['laptop_use_clarified'],
      confidenceDelta: 1,
      tasks: [
        {
          title: 'Send this one question to an expert review',
          why: 'You do not have to resolve an unclear case alone. That is what the review path is for.',
          agent: 'ELI5 Specialist',
          effort: '1 min',
        },
        {
          title: 'Note roughly when you used it for work',
          why: 'Even a rough memory gives the reviewer something to work with.',
          agent: 'Tax Planner',
          effort: '3 min',
        },
      ],
      trustNote:
        'Recorded as unresolved. The Planner will not guess, and humour is switched off for this answer.',
      plannerNote:
        'The Planner routed the open question to expert review instead of forcing an estimate.',
    },
  ],
};

/**
 * The adversarial agent's target: the joke that is *almost* safe. This is the
 * money moment of the demo — a real proposal, a real rejection, a real rewrite.
 */
export const ADVERSARIAL_TARGET = {
  id: 'slow-computer-joke',
  proposedBy: 'Growth copy draft',
  proposed:
    '💻 Your computer is getting slow… this year you get it back!',
  secondDraft:
    '💍 Get married this year? Save big bucks on your tax return!',
  attack:
    'Both drafts promise an outcome the system cannot know. "You get it back" implies the full purchase price returns; "save big bucks" implies marriage is a guaranteed lever. The user is anxious about being wrong — an unkept promise is the fastest way to confirm that fear.',
  severity: 'High',
  category: 'Unsupported financial promise',
  violates: [
    'Goal sheet guardrail: no guaranteed refunds',
    'Brand rule: claim must be conditional and honest',
    'Tone rule: humour must lower anxiety, not raise stakes',
  ],
  testCase: 'adversarial_test_cases.md#can-i-get-my-whole-laptop-back',
};

/** The user-facing question that ties the whole demo together. */
export const HERO_QUESTION =
  'I got married, bought a laptop, and started freelancing. Did I mess up my taxes?';

export const PRESET_QUESTIONS = [
  {
    id: 'hero',
    label: 'Did I mess up?',
    question: HERO_QUESTION,
    hero: true,
  },
  {
    id: 'laptop',
    label: 'Laptop money back?',
    question: 'I bought a laptop for work. Can I get the money back?',
  },
  {
    id: 'jargon',
    label: 'What is a tax class?',
    question: 'What is a tax class?',
  },
  {
    id: 'scared',
    label: 'I’m scared',
    question: 'I’m scared I’ll get fined.',
    sensitive: true,
  },
  {
    id: 'auto',
    label: 'Just do it for me',
    question: 'Just submit it for me.',
    sensitive: true,
  },
];
