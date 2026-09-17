# Taxfix Loop — Synthetic RAG Pack (Demo Only)

This folder is the retrieval knowledge base for **Taxfix Loop**, a hackathon concept prototype. It is a *synthetic demo pack*: every person, amount, document, and scenario inside it is invented for a live demo. Nothing here is real personal data.

This is **not** an official Taxfix knowledge base, **not** legal or tax advice, and **not** a source of German tax law. Any rule-shaped statement is deliberately phrased as "may", "typically", or "depends on" and must be verified with a qualified human before it is relied on. Treat the whole pack as a script for a prototype, not as a reference work.

## Retrieval Metadata Convention

Every retrievable chunk carries the same logical metadata. The parser should attach these to each H2 section it extracts.

```yaml
pack: taxfix_loop_rag
topic: "derived from the H2 heading"
audience: [alex_persona, product_agents, demo_presenter]
tax_year: 2025
jurisdiction: Germany (illustrative only)
confidence: demo-only
advice_status: not_tax_advice
contains_real_personal_data: false
```

`confidence: demo-only` means the content is safe to *explain* but must never be presented as a settled fact. When a consuming agent cannot ground an answer in this pack, it must say so, ask the user a clarifying question, or suggest a human expert.

## Chunking Contract

The parser splits on `## ` headings. Each H2 section is one self-contained chunk of roughly 60–220 words. H1 is the document title and carries no retrieval content. H3 headings stay inside their parent chunk. Fenced blocks hold structured demo records, and `> ` blockquotes hold example user-facing copy.

A chunk must make sense on its own, because retrieval may return it without its neighbours. That means no dangling references like "as mentioned above". Each chunk should name its own subject, state its own caveat, and be safe to read in isolation. If a chunk needs a neighbour to be understood, it is too small or too vague and should be merged or rewritten.

Fenced blocks are data, not prose. A parser may index them or skip them, so never hide a required caveat inside a fence. Put the human-readable caveat in the surrounding paragraph where a reader and a retriever will both find it.

## How an Agent Should Cite This

Cite as `file#section-heading`, for example `tax_basics.md#what-is-a-tax-deduction`, or `demo_documents.md#laptop-receipt-with-an-intentional-conflict`. The heading should be lowercased and hyphenated, matching the H2 text.

Always repeat the demo disclaimer in the same answer, because the citation may be read out of context. Never cite this pack as an authority on German tax law, and never present a chunk as a settled rule. When a chunk carries `confidence: demo-only`, the citing agent should say so out loud: "this is demo content, not advice".

If a needed answer is not in any chunk, the honest output is that it is not in the pack, followed by one clarifying question or an escalation to a human expert. An uncited answer is treated as a failure, not as a bonus.

## The Eight Content Files

- `target_group_trends.md` — Deep Research cards on how the target group behaves, feels, and decides about taxes.
- `product_goals.md` — Product Expert definition of the user, the problem, principles, metrics, and non-goals.
- `tax_basics.md` — ELI5 explanations of the core tax words the product will ever need to say out loud.
- `employee_freelancer_scenarios.md` — life-event cards for an employee who sometimes freelances.
- `year_round_loop.md` — the monthly check-in engine, readiness score, streaks, and re-engagement copy.
- `brand_tone_reference.md` — unofficial Taxfix-inspired tone guide, banned phrases, and review checklist.
- `adversarial_test_cases.md` — red-team cases where a naive answer would harm or mislead the user.
- `demo_documents.md` — synthetic documents for Alex Morgan, including one intentional data conflict.
