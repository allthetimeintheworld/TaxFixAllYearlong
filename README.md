# Taxfix Loop

> **Feel ready before tax season arrives.**

A concept prototype: a calm, year-round tax *preparation* companion for someone who
is good with technology and avoids taxes because every document feels like evidence
of not knowing enough.

Nine specialist agents work over one shared blackboard, grounded in a synthetic
markdown knowledge base, and produce a three-screen experience. Every sentence the
user sees can be traced back to a source, and anything that cannot be traced is
blocked rather than softened.

---

## Quick start

```bash
make
```

That is the whole thing. It runs the agent team, starts the server, and opens
`http://127.0.0.1:5173` in your browser. Stop it with `make stop`.

No install. No dependencies. Node 18+ and `make`.

```
  Taxfix Loop is running at http://127.0.0.1:5173
  Deep links:  /?replay=1   /?answer=scared   /?repair=mostly-freelance
  Stop with:   make stop
```

| Command | What it does |
|---|---|
| `make` | **Run everything and open the browser** — the single command |
| `make check` | Run the **28 acceptance checks** (exits non-zero on failure) |
| `make live` | Re-run the team, paced at 400 ms per step, so you can watch it think |
| `make transcript` | Print the run as a readable timeline |
| `make data` | Re-run the agent team and rewrite `web/data/` |
| `make stop` | Stop the background server |
| `make clean` | Remove generated data and the server log |
| `make PORT=8080` | Run on a different port |
| `make help` | List every command |

`make` is idempotent — running it again reuses the server already on the port
rather than failing.

### Without make

```bash
node run-demo.mjs          # run the agent team, write web/data/
node serve.mjs             # → http://127.0.0.1:5173
```

You can also just open `web/index.html` directly — the run data is written as
`web/data/run.js` (a `window` assignment, not a fetch), so there is no CORS problem
and no server required. The `npm run …` scripts mirror the make targets.

### Presenting shortcuts

Deep links let you jump straight to a moment, so you never have to click around on stage:

```
#today  #team  #ask
?repair=mostly-freelance   # today screen, repair loop already answered
?answer=scared             # the sensitive-mode answer
?replay=1                  # the AI team replays its work
```

There are console helpers too:

```js
__taxfix.replay()                          // replay the agent timeline
__taxfix.answer('I am scared of a fine')   // route any question
__taxfix.choose('mostly-freelance')        // run the repair loop
```

---

## The agent team

Two rings plus a shared blackboard. Agents never call each other — they write
artefacts, and the orchestrator sequences them. That is what makes the "AI Team"
screen an honest rendering of what happened rather than a scripted animation.

**Product ring** — decides what to build and for whom

| Agent | Owns | Writes to the blackboard |
|---|---|---|
| 🎯 Product Expert | Target-user fit, goals, non-goals | `goals` |
| 🔎 Deep Research | Target-group trends → product opportunities | `research` |
| 🎨 Frontend Designer | Screen hierarchy, states, copy | `design` |

**Tax ring** — does the actual work for Alex

| Agent | Owns | Writes to the blackboard |
|---|---|---|
| 🔍 Document Detective | Identifying documents, marking what is unconfirmed | `documents` |
| 🗺️ Tax Planner | The readiness score and the single next action | `plan` |
| 💬 ELI5 Specialist | The user-facing answer, in four layers | `eli5` |

**Quality ring** — makes the product worse before Alex sees it

| Agent | Owns | Writes to the blackboard |
|---|---|---|
| ⚔️ Adversarial Reviewer | Attacks the concept **and the rewrites** | `adversarial`, `adversarialVerify` |
| 🛡️ Trust Check | Grounding audit, conflict detection, confidence | `trust` |
| 🕊️ Brand Guardian | Rewrites, the four tone modes, the checklist | `brandRewrite`, `brand` |

### Pipeline

```
Product Expert → Deep Research → Frontend Designer
      ↓
Document Detective → Tax Planner → ELI5 Specialist (draft)
      ↓
Adversarial Reviewer (attack) → Trust Check → Brand Guardian → Adversarial Reviewer (verify)
      ↓
User answers the one open question → readiness and confidence move
```

The Adversarial Reviewer deliberately runs **twice**. A rewrite that has not been
re-attacked is just a nicer sentence.

---

## What makes this more than five prompts in a trench coat

| Improvement | Where |
|---|---|
| Nine agents in two rings, not five flat personas | `agents/specialists/` |
| Adversarial review runs again on the rewrite, and can reject it | `adversarial-fit.mjs` → `verify()` |
| Trust Check is a real scanner that **blocks** copy, not a vibe | `trust-check.mjs` |
| The brand checklist is seven real predicates, not tick boxes | `brand-guardian.mjs` → `CHECKLIST` |
| Every claim carries a citation that must resolve to a real section | `retrieval.mjs` → `resolve()`, enforced by the self-test |
| The UI shows the actual source text behind a citation, not just a filename | `evidenceIndex` in `run.json` |
| Readiness weights sum to exactly 100 and are explained on screen | `readiness.mjs` |
| Confidence is **held** while a conflict is open — blocking claims cannot raise it | `trust-check.mjs` |
| Four repair branches, each with different tasks and different readiness | `demo-script.mjs` |
| Humour is switched off by six explicit distress signals | `brand-guardian.mjs` → `DISTRESS_SIGNALS` |
| Out-of-scope questions get "I don't know yet", not a confident guess | `web/app.js` → `answerFor()` |
| 28 automated acceptance checks | `agents/self-test.mjs` |

---

## The one workflow that is real

Everything else on screen can be static. This path is genuinely wired end to end:

```
Upload laptop receipt
   ↓  Document Detective reads the YAML record and names it
   ↓  It finds the receipt note ("work and private use") disagreeing with Alex's answer ("100% for freelance work")
   ↓  Trust Check refuses to average, prefer, or infer — and holds confidence at 2/5
   ↓  The ELI5 Specialist asks one neutral question
   ↓  Alex chooses one of four answers
   ↓  Readiness moves 62% → 78%, confidence 2/5 → 4/5, two new tasks appear
   ↓  The AI Team timeline gains four more steps
```

**62 → 78** is not decoration. `readiness.mjs` defines twelve weighted items summing
to 100; seven are already done (62 points) and the repair closes `laptop_use_clarified`
(10) and `laptop_work_share` (6). The UI's "Why 78%?" panel prints exactly that.

Not every branch lands on 78. Choosing *"mostly private use"* closes the conflict but
creates **no** expense claim — 72%. Saying *"I'm not sure"* routes to a human expert
instead of forcing an estimate, and switches humour off. A branch that always
rewarded the most aggressive answer would not be a prototype of this product.

---

## Criteria mapping

| Criterion | Where to look |
|---|---|
| **Comfort** | Calm Guide behaviour lives in the ELI5 Specialist: four-layer answers, `Calm` tone mode, no jargon |
| **Stress removal** | Exactly one next action is surfaced; the backlog stays behind the fold (`Tax Planner`) |
| **Outside filing season** | The three-minute monthly check-in and the readiness model are year-round, not deadline-driven |
| **Return-loop quality** | Telemetry events (`monthly_checkin_started`, `tip_saved`, `confidence_recorded`, `user_returned_within_30_days`) and the confidence before/after meter |
| **Buzz factor** | The AI Team replay: 15 steps, nine agents, live status changes, expandable artefacts |
| **Taxfix alignment** | `brand_tone_reference.md` + a checklist that runs on every rewrite; user control is a visible approval step |
| **User feels smart** | Every number is paired with the sentence that explains it; "Why 62%?" is one tap away |
| **Multi-agent proof** | document → explanation → planning → review → brand correction, all as separate blackboard artefacts |
| **Demo quality** | Three screens, synthetic data, visible telemetry, one repair loop |

---

## The 90-second demo script

**1 · Today (20s).** "Alex is good with technology and avoids taxes. This is what he
sees." Point at the ring: *62% ready — On track.* Tap **Why 62%?** — "that number is
seven completed preparation items, and it has nothing to do with refund size."

**2 · The one thing that needs him (25s).** Tap **Start — 2 minutes**. The receipt says
*work and private use*; Alex said *100% for freelance work*. "The system does not
average these and it does not pick the flattering one. It asks." Choose **Mostly for
freelance work** — readiness travels 62 → 78, confidence 2/5 → 4/5.

**3 · AI Team (25s).** Hit **Replay**. Let the timeline run. Stop on the two red steps:
the rejected copy. Expand it.

> **Proposed:** ~~💻 Your computer is getting slow… this year you get it back!~~
> **Rejected, High severity:** promises an outcome the system cannot know.
> **Rewrite:** 💻 New computer for work? It may be relevant for your taxes. Save the
> receipt and tell us how you use it before we celebrate.

"That is seven tone rules, checked by code, going from 4/7 to 7/7."

**4 · Ask (20s).** Tap **Did I mess up?** — the hero question. Three life events, three
small jobs, one highlighted as genuinely urgent. Then tap **I'm scared** — watch the
pill flip to **Sensitive mode** and **Humour off**. "The jokes stop when they would
hurt. That is a rule in the code, not a judgement call on the day."

**Close:** *"Taxfix Loop: feel ready before tax season arrives."*

---

## Safety posture

This is a hackathon prototype and it says so, everywhere.

- **All data is synthetic.** Alex Morgan, Northwind Digital GmbH, Bluebird Studio and
  every amount are invented. The tax ID is literally `FAKE-DEMO-00-000-000-000`.
- **Not tax advice**, not an official Taxfix knowledge base, not a substitute for
  current German tax guidance. Every rule-shaped statement is phrased with *may*,
  *typically*, *depends on*.
- **No outcome promises.** A deduction usually reduces taxable income; it does not
  return the purchase price. Eight banned patterns are enforced in code.
- **Not a real product decision.** The visual language is *inspired by* publicly
  visible Taxfix.de communication. It is not an official brand guideline, and final
  wording would need to be checked against real design files.
- **The AI does not file anything.** The submit button is locked, and the approval
  checkbox is the user's.

---

## Verification

```bash
node run-demo.mjs --check     # 28 / 28
```

The acceptance test asserts the claims this README makes out loud, including:

- readiness starts at exactly 62% and the default repair lands at exactly 78%
- confidence moves 2/5 → 4/5, and is **held** while the conflict is open
- the adversarial agent rejects at least two unsafe messages, one High severity
- the rewrite passes more tone rules than the original, and survives a second attack
- no final user-facing copy carries a banned promise
- every citation in the timeline resolves to a real knowledge-base section
- humour is disabled for every distress question
- "just submit it for me" preserves the user's approval step

If you edit the RAG pack and a citation goes stale, `npm run check` fails. That is the
point.

---

## Layout

```
Makefile                     single-command launch: `make`
run-demo.mjs                 CLI: run the team, write web/data/, --check, --pace
serve.mjs                    zero-dependency static server
package.json

agents/
  orchestrator.mjs           sequences the two rings over one blackboard
  blackboard.mjs             shared run state; every write becomes a timeline entry
  retrieval.mjs              markdown chunker + keyword retriever + citation resolver
  grounding.mjs              YAML/bullet/blockquote extraction helpers
  readiness.mjs              the twelve weighted readiness items (sum = 100)
  demo-script.mjs            the fixed scenario: brief, conflict, questions, branches
  self-test.mjs              28 acceptance checks
  specialists/               the nine agents
    product-expert.mjs  deep-research.mjs  frontend-design.mjs
    document-detective.mjs  tax-planner.mjs  eli5-specialist.mjs
    adversarial-fit.mjs  trust-check.mjs  brand-guardian.mjs

taxfix_loop_rag/             synthetic knowledge base — 9 files, 94 retrievable chunks
  target_group_trends.md     Deep Research output: 10 target-group trend cards
  product_goals.md           Product Expert output: goals, principles, non-goals
  tax_basics.md              14 ELI5 explanations
  employee_freelancer_scenarios.md   9 life-event scenario cards
  year_round_loop.md         monthly check-in, return-loop events, score model
  brand_tone_reference.md    voice, tone modes, banned phrases, checklist
  adversarial_test_cases.md  12 adversarial cases with safe rewrites
  demo_documents.md          the synthetic documents and the intentional conflict

web/
  index.html  styles.css  app.js     the three-screen prototype
  data/run.json  data/run.js         generated by run-demo.mjs
```

---

## Known limitations

Honest, because a prototype that oversells itself is the thing this product exists to
avoid.

- **The agents are deterministic, not LLM-backed.** They retrieve real chunks and
  compose grounded output from templates. The seam for a model call is isolated, but
  nothing here requires an API key — which is why the demo cannot fail on stage.
- **The knowledge base is synthetic.** No German tax rule in it has been verified.
- **Readiness weights are invented.** They are internally consistent and explainable,
  which is what the demo needs; they are not validated.
- **The humour library and adversarial cases were written by hand**, not learned from
  user research.
- **The 2024-letter thread is a prop.** In a real product a letter with a response
  window would escalate immediately rather than sit in a card.
