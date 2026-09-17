# Demo Documents — Synthetic Records

Every document in this file is **invented for the Taxfix Loop demo**. Alex Morgan is not a real person, the employer, client, and companies do not exist, and all amounts, numbers, and dates are fabricated. Nothing here is tax advice, and nothing here is an official Taxfix record.

## Alex Morgan — Demo User Profile

This is the persona all other documents belong to. Alex is 31, lives in a large German city, and works full time as a software developer. He occasionally takes on UX and web freelance work. He is comfortable with technology and uncomfortable with tax, and he avoids tax admin until it becomes urgent.

His confidence before using the product is **2 out of 5**. That number is the baseline the product is trying to move, and it is deliberately low so the demo can show a change. His confidence is *not* a measure of his ability. It is a measure of how oriented he feels.

```yaml
user_profile:
  display_name: "Alex Morgan"
  synthetic: true
  age: 31
  location: "large German city (fictional)"
  occupation: "Software Developer, full time"
  side_activity: "occasional UX and web freelance work"
  tax_year_in_focus: 2025
  confidence_before: 2
  confidence_scale: "1 = lost, 5 = on top of it"
  known_anxieties:
    - "fear of getting it wrong"
    - "official letters"
    - "deadlines"
  declared_goal: "feel ready before tax season arrives"
```

**What the agents should do with this:** load this profile as context for every session, use it to choose did-you-know cards and scenario entry points, and never treat the confidence score as a grade. The ELI5 Specialist should reference Alex's own facts back to him rather than giving generic advice.

## Employment Tax Statement (Wage Statement)

This is Alex's yearly summary from his employer for 2025. It is the backbone document for an employed person, and much of its content is normally taken as given rather than retyped.

```yaml
document_type: "employment_tax_statement"
synthetic: true
tax_year: 2025
employer: "Northwind Digital GmbH (fictional)"
employee: "Alex Morgan (synthetic)"
tax_class: "I"
tax_identification_number: "FAKE-DEMO-00-000-000-000"
gross_salary_eur: 68400.00
wage_tax_withheld_eur: 12940.00
solidarity_surcharge_eur: 0.00
social_contributions_eur: 8120.00
period: "2025-01-01 to 2025-12-31"
status: "issued, unverified in demo"
```

**What the agents should do with this:** treat the figures as user-supplied and unverified. Read the important lines back in plain words. Confirm that the tax class and identification number look consistent with what the user told the product. Do **not** calculate any liability, do not recompute withheld tax, and do not interpret unusual values. If a field is empty or surprising, ask one question and recommend checking with the employer or a qualified expert.

## Laptop Receipt — With an Intentional Conflict

This receipt is the demo's central data conflict. The document says one thing; the user says another.

```yaml
document_type: "purchase_receipt"
synthetic: true
vendor: "TechHaven Electronics (fictional)"
purchase_date: "2025-09-14"
item: "Ultrabook 14, 16GB RAM, 512GB SSD"
total_eur: 1249.00
payment_method: "card"
receipt_note: "work and private use"
customer_stated_use: "100% for freelance work"
user_claimed_supporting: true
conflict: true
conflict_fields: [primary_use]
status: "conflict open - requires user clarification"
```

**What the agents should do with this:** the Trust Check Agent **must** flag the conflict between the receipt note ("work and private use") and Alex's claim ("100% for freelance work"). It must **not** silently pick a value, average them, or quietly prefer the user's version. It should ask one neutral clarifying question, record both statements, and mark the item as unresolved until Alex answers. Brand Guardian checks that the question is non-accusatory and does not imply Alex is being dishonest.

## Freelance Invoice — Bluebird Studio

Alex's main freelance job of the year. This is straightforward income evidence: one client, one invoice, paid.

```yaml
document_type: "freelance_invoice"
synthetic: true
invoice_number: "INV-2025-014"
client: "Bluebird Studio (fictional)"
issuer: "Alex Morgan (synthetic)"
service: "UX audit and landing page concept"
invoice_date: "2025-11-02"
amount_eur: 1800.00
payment_status: "paid"
payment_date: "2025-11-18"
payment_method: "bank transfer"
notes: "no tax withheld at source; client is not the employer"
status: "recorded, unverified in demo"
```

**What the agents should do with this:** record it as freelance income, note that no tax was withheld along the way, and connect it to the side-hustle scenario card. Do not calculate what may be owed, do not classify Alex's professional status, and do not assume this is the only freelance income. Ask whether any other client paid him in 2025. Keep the language neutral: this is a fact to record, not a problem to solve.

## Letter From the Tax Office

A short official letter. This is the highest-stakes document in the pack and the one most likely to trigger anxiety.

```yaml
document_type: "official_letter"
synthetic: true
sender: "Finanzamt (fictional demo office)"
sender_address: "Demo Street 1, 00000 Demo City"
recipient: "Alex Morgan (synthetic)"
letter_date: "2025-12-03"
reference: "DEMO-2025/118-4471"
subject: "Request for information"
body_summary: "Asks for details about income from self-employed activity in the 2024 tax year."
response_window_days: 28
mentions_amount: false
mentions_penalty: false
status: "received, not yet answered"
```

**What the agents should do with this:** immediately switch to **Sensitive** tone. Do not interpret the legal meaning, do not guess whether a penalty applies, and do not advise on how to reply. Note the date and the reference number, and read the request back in plain words. Recommend a qualified tax adviser or direct contact with the tax office, and offer to prepare a short, factual summary of Alex's freelance income for 2024 so the conversation is short. Never delay: the response window is not a demo detail to wave away.

## Bank Statement Line — Coworking Desk

A small recurring cost that Alex has probably forgotten. This is the kind of fact the year-round loop exists to catch.

```yaml
document_type: "bank_transaction"
synthetic: true
account_holder: "Alex Morgan (synthetic)"
statement_period: "2025-07"
entry_date: "2025-07-03"
payee: "Werkstatt Coworking Berlin (fictional)"
description: "Desk membership, monthly"
amount_eur: -189.00
frequency: "monthly"
months_observed: 4
receipt_available: false
status: "unverified, no receipt on file"
```

**What the agents should do with this:** treat it as a possible work-related cost, not a confirmed deduction. Ask what the desk was used for, whether it was for the freelance work, whether the employer reimbursed it, and whether a receipt exists. Record the frequency honestly. If Alex says he sometimes worked there for his own projects, record the split rather than assuming work use. The Adversarial Fit Agent should watch for the assistant nudging Alex toward maximising the claim.

## The Intentional Conflict — Trust Check Agent Rules

The laptop is the teaching moment of this demo. The receipt says "work and private use". Alex says "100% for freelance work". Both cannot be treated as true, and the product is not allowed to choose quietly.

The Trust Check Agent owns this. Its rules are:

1. **Detect and surface.** Flag the conflict in plain language, without alarm.
2. **Never auto-resolve.** Do not pick the receipt, do not pick the user, do not average, do not infer from the price or the item.
3. **Ask one neutral question.** "How do you use the laptop day to day?" Never "are you sure you were honest?"
4. **Record both statements** with a clear marker that the item is unresolved.
5. **Escalate if unresolved and material.** If the item matters and Alex cannot clarify, recommend a qualified expert.
6. **Never penalise.** The conflict is normal, not evidence of wrongdoing.

This rule generalises to every document: where two sources disagree, the product asks, records, and defers.
