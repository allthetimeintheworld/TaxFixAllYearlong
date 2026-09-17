# Tax Basics — Plain-Language Explainers

ELI5 explanations for the Taxfix Loop demo. Written for the user-facing layer. Every entry is synthetic demo content, is **not tax advice**, and does not describe official German tax law. Real rules may differ, may change, and depend on personal circumstances. When in doubt, the assistant asks the user or points to a human expert.

## What Is a Tax Deduction?

**Definition:** A tax deduction is a cost the tax office may allow you to subtract from your income before working out how much tax you owe.

**Everyday example:** Imagine you earned €40,000 and spent €1,000 on work-related things. You may be able to be taxed as if you earned €39,000. The €1,000 is not handed back to you. It only lowers the number that tax is calculated on.

**Why it matters here:** This is the single most misunderstood idea, and the one most likely to create disappointment. A deduction of €1,000 does not mean €1,000 back. It usually saves a fraction of that, depending on your tax rate. The assistant must never say "you will get €X back". It may say: "this may reduce the income your tax is based on." Because the exact effect depends on the whole picture, the assistant should explain the direction and refuse to predict the amount.

## What Is Taxable Income?

**Definition:** Taxable income is the amount left after allowed costs are subtracted from your income, and it is the number tax is actually calculated on.

**Everyday example:** Two people can earn the same salary and still have different taxable income, because one had higher costs the tax office accepts. Same earnings, different number underneath.

**Why it matters here:** Almost every useful sentence the assistant says is about moving taxable income, not about cash arriving in a bank account. Keeping this word visible stops the product from drifting into refund promises. When a user asks "how much do I get back?", the honest answer is: "I can help you collect the things that may lower your taxable income. I cannot tell you the final amount — that depends on your whole situation and on how the tax office assesses it." That answer is complete, not evasive. It should be delivered warmly and without apology, then followed by one concrete next step the user can take right now.

## The Wage Tax Statement

**Definition:** A wage tax statement is the yearly summary your employer gives you showing what you were paid and what tax was already withheld from it.

**Everyday example:** Think of it as a receipt for the whole year of employment. It says: this is what we paid you, and this is what we already sent to the tax office on your behalf.

**Why it matters here:** For most employees this document is the backbone of a return, and much of its content can usually be taken as given rather than retyped. In this workflow the assistant's job is to help Alex find it, read the important lines in plain words, and notice when something looks off. Typical labels include gross pay, tax withheld, and social contributions. The assistant should not interpret unusual or missing values on its own. It should say what it sees, mark uncertainty clearly, and suggest checking with the employer or a human expert when a number looks unexpected or a field is empty.

## What Is a Tax Class?

**Definition:** A tax class is a category that influences how much tax is withheld from your salary during the year.

**Everyday example:** It is like a setting on a tap that decides how much water is taken out of each payment up front. The setting depends on your situation, such as whether you are married or have children.

**Why it matters here:** Tax class is a frequent source of worry because people hear that one class is "better". What it really changes is *when* money is withheld, not simply how much tax you owe overall. A change in life circumstances may make a different class relevant, and the tax office usually has to be told. The assistant must not advise which class to choose and must not compute a saving. It may explain what the categories are for, ask whether circumstances changed this year, and suggest confirming the right setting with the tax office or a qualified expert.

## The Tax Identification Number

**Definition:** A tax identification number is a long personal number that identifies you to the tax office across your whole life.

**Everyday example:** It works a bit like a passport number for tax. You keep the same one even if you move city or change employer.

**Why it matters here:** Alex may have received this number years ago in a letter and never looked at it again. Without it, some steps stall. The assistant's role is to explain that the number exists, that it stays the same, where it typically appears on official letters, and that it should be treated as sensitive. It must never display a full number in a demo, never log it, and never ask the user to paste it into an untrusted place. In this synthetic demo the number is fake and clearly marked as fake. When the user cannot find it, the calm next step is to suggest checking old letters or contacting the tax office.

## Freelance and Self-Employed Income

**Definition:** Freelance income is money you earn from your own work for clients, rather than from an employer who pays you a salary.

**Everyday example:** If Alex designs a website for a small studio and sends them a bill, that money is freelance income. Nobody withheld tax from it along the way.

**Why it matters here:** This is where Alex's situation gets more complicated than a plain employee's. Freelance income is usually not automatically taxed at source, which means it may need to be reported and may change what is owed. There may also be registration questions depending on how the work is classified. The assistant must not decide whether Alex is officially self-employed, must not calculate what he owes, and must not treat a small side project as obviously tax-free. It should ask what the work was, who paid, when, and whether any paperwork was filed — then flag clearly that this area usually deserves a human expert's eye.

## Invoices and What They Need

**Definition:** An invoice is the document you send a client that says what you did, what it cost, and when it should be paid.

**Everyday example:** "Website redesign, November 2025, €1,800, payable within 14 days." Simple on the surface.

**Why it matters here:** For a freelancer, invoices are the evidence that income happened. They also usually have formal requirements, which may vary. A missing element can cause friction later, and a missing invoice can make income hard to prove. The assistant should help the user keep invoices in one place, note the date, the client, the amount, and whether it was paid. It must not generate a legally compliant invoice, invent a tax number, or advise on VAT. When a user asks "is this invoice okay?", the honest answer is: "I can check that the basics are recorded. I cannot confirm it meets every formal requirement — a qualified expert can." Then offer the next small step: log the client and the amount.

## Work-Related Expenses

**Definition:** Work-related expenses are costs you paid yourself in order to do your job, which may be recognised in your tax preparation.

**Everyday example:** A train ticket to a client meeting, a professional course, a union fee, or a specialist book for your work.

**Why it matters here:** This is the category Alex is most likely to under-report out of pure forgetting, not dishonesty. Small costs scattered across a year are exactly what the year-round loop should catch. The assistant's job is to ask friendly, concrete questions: did you travel for work, pay for training, buy tools, pay any professional fees? Not every cost is automatically accepted, and some have limits or conditions. The assistant must phrase everything as "may be relevant" and never as "you can claim this". Its output is a tidy list the user can review with an expert or use when filing.

## Home Office

**Definition:** Working from home may have tax relevance, depending on how often you do it, what space you use, and who pays for what.

**Everyday example:** Alex works from the kitchen table two days a week. His internet bill did not change, but his employer does not pay for it.

**Why it matters here:** Home office is a common source of both over-claiming and under-claiming. Some approaches depend on the number of days; others depend on having a separate room; some depend on whether the employer contributes. These details matter, and the product cannot decide which path applies. The assistant should capture the facts calmly: how many days, is there a dedicated space, who pays for internet and electricity, does the employer pay an allowance. It should record them, mark them as unverified, and clearly state that what applies depends on the exact arrangement. Never present one method as "the one you should use".

## Depreciation Versus Immediate Deduction

**Definition:** An expensive item used for work may be spread across several years instead of being subtracted all at once, depending on its value and type.

**Everyday example:** A €1,249 laptop might be treated as a multi-year cost, or it might qualify to be subtracted in the year you bought it. Both patterns exist. Which one applies depends on rules and thresholds the assistant cannot confirm.

**Why it matters here:** This is the exact trap in the demo. A user sees "€1,249 laptop" and assumes €1,249 comes off this year's tax. The assistant must explain the two possibilities in plain words: sometimes a cost is spread over its useful life, sometimes it can be taken immediately, and the answer depends on rules and on the item's value and use. It must not choose one and state it as fact. The right output is: "here are the facts I recorded; what applies depends on the current rules — this is worth confirming with a qualified person."

## Receipts and Record Keeping

**Definition:** Keeping receipts means holding on to the evidence for costs and income so you can show them later if asked.

**Everyday example:** A photo of a receipt taken on the day of purchase, stored with a one-line note about why it was for work.

**Why it matters here:** Memory decays fast over twelve months. The single most valuable habit the product can build is capturing a fact while it is still fresh, in seconds. Record keeping here is not about suspicion or audits. It is about future-you not having to reconstruct the year from bank statements. The assistant should make capture effortless and reassure the user that a rough note now beats a perfect note never. It should also be honest that some costs may need documentation and some may not be accepted at all. It must never tell the user that a receipt guarantees a deduction.

## Filing Deadline Anxiety

**Definition:** Filing usually has a deadline, and missing one may have consequences, though the details depend on your situation and on the tax office.

**Everyday example:** Alex remembers a date, does not remember what it means, and feels a knot in his stomach for weeks without doing anything.

**Why it matters here:** Deadlines are the biggest single source of anxiety in this domain and the biggest driver of avoidance. The assistant must not use countdown pressure, red warning banners, or fear copy. It also must not tell the user a deadline is unimportant. The calm path is: state plainly what is known, mark what is uncertain, and convert the worry into one small action that reduces risk — for example, gathering one document. If a deadline may already have passed, the assistant stays non-judgemental, avoids guessing at penalties, and recommends contacting the tax office or a qualified expert directly.

## When to Ask a Human Expert

**Definition:** Some questions should go to a qualified person rather than to an app.

**Everyday example:** "I did freelance work and never told anyone." "The tax office sent me a letter I do not understand." "Can I be fined?"

**Why it matters here:** Knowing when to stop is a core feature, not a failure. The assistant should escalate when money owed, legal risk, penalties, disputes, or formal classifications are involved; when the user expresses fear or distress; when documents conflict; or when the assistant simply cannot ground an answer in this pack. Escalation copy should be warm and concrete: name who can help (a tax adviser, an accountant, the tax office, a consumer advice centre), and offer to prepare a short summary of the user's facts to take along. The assistant never says "I cannot help" and stops there. It always leaves the user with one clear next step.

## What the Assistant Must Do When Uncertain

Follow these rules in order. They are non-negotiable for the demo.

1. **Never invent.** If a rule, threshold, deadline, or paragraph number is not in this pack, it is not available.
2. **Say so plainly.** Use a visible uncertainty state: "I'm not certain about this."
3. **Name what it depends on.** List the two or three facts that would change the answer.
4. **Ask one question.** Exactly one, the one that most reduces uncertainty.
5. **Offer a safe default.** Record the fact, mark it unverified, and let the user continue.
6. **Recommend a human when stakes are high.** Penalties, owed money, disputes, legal classification, or distress routes to an expert.
7. **Never promise an outcome.** No refund amounts, no guaranteed acceptance, no "you definitely qualify".
8. **Cite the pack.** Reference `file#section-heading` so a reviewer can check the source, and repeat that this is demo content, not tax advice.
