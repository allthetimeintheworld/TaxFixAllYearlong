# Product Goals — Taxfix Loop

Product Expert Agent output for the Taxfix Loop concept prototype. This document is a synthetic demo artefact. It defines what the product is trying to be, for whom, and what it refuses to do. It is not tax advice, and it does not describe an official Taxfix product.

## Machine-Readable Product Brief

This block is the canonical summary the other agents should read first. Everything else in the file expands on it.

The brief is intentionally short so it can be injected into every agent prompt without crowding out the conversation. Each agent reads the same fields and interprets them through its own lens: the Frontend Design Agent turns `desired_outcome` into visual states, the Brand Guardian enforces `tone_default` and `guardrail`, the Trust Check Agent watches `success_metric` for claims it cannot support, and the Adversarial Fit Agent attacks the `priority` list for gaps.

The brief is a demo artefact. It is not a product requirement document, and it is not tax advice. If a later section of this file appears to contradict the brief, the brief wins, and the contradiction should be raised rather than silently resolved.

```yaml
primary_user: "Alex, 31, employed software developer with occasional freelance UX and web income, tax-anxious, avoids tax admin"
core_problem: "Tax admin feels like one huge, jargon-heavy, high-stakes task, so it gets postponed until it becomes a crisis"
desired_outcome: "Feels calm, prepared, and in control all year - ready before tax season arrives"
priority:
  - "one understandable action per confusing moment"
  - "capture facts at the moment they happen"
  - "visible uncertainty instead of confident guesses"
  - "never promise a refund amount"
success_metric: "share of users who complete a check-in in four consecutive months and can name their next step"
guardrail: "no invented tax rules, no outcome promises, no pressure language, no judgement"
tone_default: "calm, warm, short sentences, everyday words, non-judgemental"
```

## Primary User Definition

The primary user is Alex: 31 years old, employed as a software developer, with occasional freelance work in UX and web design. He is comfortable with technology and expects digital tools to be fast and well designed. He is not comfortable with tax.

Alex has a main salary, a side income that appears a few times a year, and no accounting background. He does not want to become a tax expert. He wants to stop feeling behind. He has avoided previous tax tasks, and that avoidance now carries a small amount of shame that makes starting even harder.

Secondary users include pure employees with no side income, and freelancers with no employment. The product is designed for Alex first. When a design choice helps freelancers but confuses Alex, Alex wins. This keeps the prototype focused and honest about who it serves.

## Core Problem

The problem is not that tax is hard. It is that tax arrives as one enormous, unfamiliar, high-stakes task with no natural starting point.

For Alex, the task is bundled. Every question implies three more. The vocabulary is unfamiliar, the consequences of an error feel large, and the result is invisible until much later. That combination produces avoidance, and avoidance produces a last-minute scramble where memory is worst and stress is highest.

Crucially, the information needed to do tax well is generated *during the year*, not during filing: a purchase, a move, a new client, a week at home. The current experience only asks for that information months later, in a form, after it has been forgotten. Taxfix Loop attacks this mismatch directly. The core problem is a timing problem wrapped in a confidence problem.

## Desired Emotional Outcome

The target emotional outcome is described in one line: **"Feel ready before tax season arrives."**

Ready does not mean finished. It means Alex can open the app at any moment, see a short list of what is done and what is not, and know his next single step without dread. Calm, prepared, in control.

This outcome is deliberately emotional rather than financial. The product does not promise more money back, faster processing, or a better outcome than an expert. It promises that the experience of preparing stops being frightening and starts being ordinary.

Three feelings support that outcome: *orientation* ("I know where I am"), *progress* ("I did something today"), and *permission* ("It is fine that I do not know this yet"). Every screen should strengthen at least one of the three. A screen that does none of them does not belong in the product.

## Product Principles

1. **One action per moment.** Any confusing moment resolves to exactly one understandable next step. If two steps compete, the product chooses one.
2. **Year-round, not deadline-shaped.** Value is delivered in small pieces across the year. The product never depends on urgency to get attention.
3. **Capture beats recall.** Ask when the fact happens, not when the form demands it. Never rely on the user remembering a month in detail.
4. **Honest uncertainty is a feature.** "I'm not sure, here is what it depends on" is a complete, respectable answer. Confident guessing is a defect.
5. **Explain in everyday words.** The official term is a secondary label, never a prerequisite for progress.
6. **No promises about outcomes.** Deductions may reduce taxable income. They never guarantee a refund amount.
7. **The user stays in charge.** The product suggests, records, and explains. It does not submit, decide, or take over.

## Success Metrics

Leading metrics measure behaviour the product can influence this week. Lagging metrics measure whether the habit stuck.

Leading: monthly check-in completion rate; median time to complete a check-in; number of facts captured per user per month; share of sessions ending with a clear next step; share of uncertain answers where the user asked for clarification or escalation.

Lagging: four-month check-in streak retention; readiness score movement across a quarter; self-reported confidence change from the 1–5 pre/post prompt; share of users who say they know their next step; share of users who return after a life event.

Explicitly excluded from success: refund size, refund speed, and filing volume. The product must never be optimised toward a bigger or faster refund. A reduction in refund anxiety with unchanged refund size counts as success.

## Priority Feature List

The prototype builds these in order. Priority one ships first and everything else is optional for the demo.

**P1 — Monthly three-minute check-in.** Five plain questions, pausable, resumable, always ends with one next step.

**P1 — Readiness score (0–100).** Composed from preparation items only. Never from refund size or speed.

**P2 — Document capture with conflict detection.** Snap or log a document; the Trust Check Agent flags contradictions and asks the user rather than guessing.

**P2 — Did-you-know card library.** Short, calm cards targeted at beginner, employee with side income, freelancer, returning user, and life-event segments.

**P3 — Life-event entry points.** Marriage, move, child, new job, first invoice, letter from the tax office.

**P3 — Confidence tracking.** Optional 1–5 self-report before and after a check-in.

**P3 — Calm re-engagement.** Notification copy that invites rather than chases, with an easy way to say "not now".

## What We Will NOT Build

- No refund calculator that predicts an amount in euros.
- No auto-submission of a tax return on the user's behalf.
- No "you definitely qualify" indicator for any deduction.
- No urgency or countdown pressure by default, and no fear-based notification copy.
- No hidden assumption that a document means only one thing when the document is ambiguous.
- No fabricated rule, paragraph number, or threshold presented as fact.
- No judgemental phrasing about missed deadlines, undeclared income, or past mistakes.
- No social comparison, leaderboards, or public streaks.
- No collection of real personal data in this demo build.

## Non-Goals

Taxfix Loop is not an accountant, not a filing engine, and not a replacement for professional advice. It does not calculate final liabilities, does not represent the user before a tax office, and does not decide which deductions are legally valid for a specific person.

It is also not a generic budgeting app, not an investment or pension planner, and not a document vault for its own sake. Storage exists only to support preparation and to answer the user's own next question.

Finally, it is not a growth machine. The prototype does not chase daily active use. A calm monthly visit that leaves the user oriented is the intended pattern, and a user who skips a month should be welcomed back, not scored down.
