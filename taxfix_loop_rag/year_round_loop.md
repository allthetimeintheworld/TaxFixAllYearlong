# Year-Round Loop — Recurring Engine Design

Design spec for the Taxfix Loop demo engine. This is a product concept, not tax advice. The loop exists to move the user from avoidance to a calm monthly habit. Every number in this file is a demo design choice, not a validated model.

## The Loop in One Paragraph

The engine has four beats. **Capture** happens whenever the user mentions something small. **Check in** happens once a month, for three minutes. **Reflect** shows the user what changed since last time. **Return** invites the user back at a moment that is relevant to them, never on a guilt schedule.

The loop is deliberately not a filing flow. Filing is the end of a year of small captures, not the start of a stressful week. If the user never files inside the prototype, the loop has still done its job, because the user is oriented and knows their next step.

Everything the loop produces is marked as demo content, unverified, and revisable. The engine never presents a captured fact as a final tax position, and it never converts captures into a predicted refund.

## The Three-Minute Monthly Check-In

The check-in is five questions, asked one at a time, in plain words. Target completion time is under three minutes. It is pausable at any point and resumes exactly where it stopped.

1. **Did anything change this month?** Job, address, family, or how you work.
2. **Did you earn money outside your main job?** Any invoice, platform payout, or small sale.
3. **Did you buy or pay for anything for work?** Tools, travel, training, a desk, a course.
4. **Did you get any official letters or documents?** Anything that looked important.
5. **Is there one thing about taxes you would like explained?** Any question, however small.

The order is intentional. Life first, money second, paperwork third, curiosity last. Nothing is mandatory. "Nothing to report" is a complete and celebrated answer, because a skipped month of nothing is still a month of staying oriented.

```yaml
check_in:
  duration_target_seconds: 180
  questions: 5
  order: [life_change, outside_income, work_costs, documents, curiosity]
  pausable: true
  allow_skip_each: true
  ends_with: "exactly one next step"
  scoring_impact: "participation only - never amount of money"
```

## Did-You-Know Card Library

Cards are short, calm, and self-contained. Each card teaches one idea and asks for nothing. They are the product's voice at rest: useful even when the user does not act.

Cards are selected by segment, not by campaign. A beginner should never receive a freelancer card, because irrelevant knowledge reads as noise and quietly teaches the user that the product does not know them. The segment is inferred from what the user has already told the product, and it can change at any time — a beginner who mentions an invoice becomes an employee with side income.

Each card must stand alone, use plain words, and avoid any promise. A card that says "you can claim this" is a defect; a card that says "this may be relevant" is correct. Cards never ask the user to do anything, which is what makes them safe to show at any moment, including a moment when the user is already overwhelmed and cannot take on one more task.

```yaml
card_library:
  beginner:
    - "A deduction lowers the income your tax is based on. It is not a cash refund of the same size."
    - "Your wage statement is the backbone of your return if you are employed."
  employee_with_side_income:
    - "Money you earn outside your job usually has no tax taken out along the way."
    - "Small side projects still deserve a note, even if they feel like a hobby."
  freelancer:
    - "An invoice is proof that income happened. Keep the date, client, amount, and payment status."
    - "Some expensive equipment is spread across years instead of taken at once."
  returning_user:
    - "Nothing you entered last month is final. You can change any answer."
    - "Skipping a month does not undo your progress."
  life_event_triggered:
    - "Marriage, a move, or a new child may change which questions matter."
    - "A letter from the tax office deserves a calm read, not a panic."
```

## Return-Loop Events

These are the moments the engine may surface something. Each trigger maps to one card or one question, never to a notification storm.

The list is a ceiling, not a quota. Most months should fire only the first trigger and nothing else. A month where the engine says nothing at all is a good month, because the product is meant to be quiet when there is nothing worth saying. Frequency caps matter more than clever targeting: one nudge per month, never two in a row without a response, and an always-available "not now" that snoozes without penalty.

Two triggers deserve special care. `conflict_detected` must always surface and must never auto-resolve, because silent resolution is the exact failure the Trust Check Agent exists to prevent. `seasonal_public_milestone` is the riskiest trigger for tone, so it must be framed as preparation, never as a warning, and it must never name a countdown.

```text
RETURN-LOOP EVENT LIST (demo design)
1.  month_rolled_over            -> open the monthly check-in
2.  life_event_mentioned         -> offer the matching scenario card
3.  document_captured            -> ask one clarifying question if ambiguous
4.  conflict_detected            -> surface the conflict, ask, never auto-resolve
5.  question_left_unanswered     -> offer a plain-language explanation
6.  streak_at_risk               -> soft invitation only, no guilt copy
7.  quarter_completed            -> show readiness movement, no score shaming
8.  seasonal_public_milestone    -> calm heads-up framed as preparation, not alarm
9.  user_returned_after_absence  -> welcome back, resume exactly where left off
10. confidence_drop_detected     -> offer a smaller step, not more information
```

## The Readiness Score Model

The readiness score is a 0–100 number that answers one question: *how prepared is this user's information?* It measures preparation only.

```yaml
readiness_score:
  total: 100
  components:
    profile_basics_complete: 10
    income_sources_recorded: 20
    documents_captured_with_metadata: 20
    work_related_costs_logged: 15
    life_events_flagged_and_reviewed: 10
    open_questions_resolved_or_escalated: 10
    monthly_check_ins_completed: 10
    conflicts_resolved_with_user: 5
  explicitly_excluded:
    - refund_size
    - refund_speed
    - filing_date
    - amount_of_money_claimed
```

The exclusions are the point. A user who claims nothing but has recorded everything scores high. A user who claims a large amount with missing evidence does not gain points for the amount. The score must never fall as a punishment for skipping a month; it holds steady. Progress is shown as movement, never as a grade.

## Confidence Tracking

Confidence is captured with one optional question before and after each check-in: *how confident do you feel about your tax situation right now?* on a scale of 1 to 5.

Alex starts at 2 out of 5. The product's success is movement in that number, not movement in a refund estimate. A user who moves from 2 to 3 while filing nothing has made real progress.

```yaml
confidence_prompt:
  scale: "1 = lost, 5 = on top of it"
  when: [before_check_in, after_check_in]
  optional: true
  never_shown_as: [grade, comparison, leaderboard]
  used_for: [self_reflection, product_research_in_demo]
  copy_before: "Quick one: how confident do you feel about your taxes today?"
  copy_after: "Thanks. Has that changed at all in the last three minutes?"
```

Confidence data is never used to decide what to sell the user, and never shown to them as a judgement. A drop in confidence is a signal to offer a *smaller* step, not more explanation.

## Streak Rules

Streaks are supportive, never punitive. The design rules below are deliberately forgiving, because this user group is avoidance-prone and a broken streak often ends the habit.

- A streak counts completed check-ins, one per calendar month, maximum one per month.
- A **grace month** is allowed: one skipped month per quarter is absorbed and the streak survives.
- The streak never resets to zero. It enters a "paused" state and can be resumed.
- No public streaks, no leaderboards, no comparison with other users.
- No loss framing in notifications: never "don't lose your streak".
- Milestones are celebrated quietly at 3, 6, and 12 months with a calm message.
- A paused streak is displayed neutrally, for example "3 months so far".

```text
STREAK STATE MACHINE (demo)
active  --check_in completed-->  active (count + 1)
active  --month skipped------>   grace (if grace available, count unchanged)
grace   --check_in completed-->  active (count + 1)
grace   --month skipped------>   paused (count unchanged, never zeroed)
paused  --check_in completed-->  active (count + 1)
```

## Re-Engagement Triggers and Copy

Re-engagement is an invitation, never a chase. Each message offers an easy exit. Maximum one nudge per month, and never two in a row without a user response.

Triggers: a new month begins; the user mentioned a life event and has not returned; a captured document has an open question; the user abandoned a check-in midway; a quarter ended; the user returned after a long absence.

**New month:** "A new month started. There is one small question waiting whenever you have three minutes."

**Abandoned check-in:** "You stopped partway last time. We saved your place — nothing is lost."

**Open question on a document:** "One thing I noted is still unclear. Want to look at it together, or leave it for now?"

**After a long absence:** "Welcome back. Nothing is broken, and nothing was lost. Want to pick up where you left off?"

**After a life event:** "You mentioned something changed this year. When you are ready, there is one question that may matter."

Every message includes a real "Not now" option that snoozes without penalty.
