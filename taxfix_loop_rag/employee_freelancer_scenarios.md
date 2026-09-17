# Employee and Freelancer Scenarios

Life-event scenario cards for the Taxfix Loop demo. Each card is synthetic, written for the Alex persona, and is **not tax advice**. Nothing here states German tax law as fact. Everything is phrased as something that *may* be relevant, and the consuming agent must verify or escalate.

## How to Use These Cards

These cards are triggered by life events, not by tax categories. The user says what happened in their own words, and the matching card supplies the shape of the conversation.

Each card has four parts. **What may be relevant** lists the areas that could matter. **Ask** gives the two or three questions the assistant should ask, in order and one at a time. **User-facing card** is the example copy the user actually sees. **Do not** is the failure mode to avoid.

The order matters. Ask first, explain second, promise nothing. And always end with exactly one next step, because this product turns each confusing moment into one understandable action.

```yaml
card_schema:
  trigger: "life event in the user's own words"
  fields: [what_may_be_relevant, ask, user_facing_card, do_not]
  max_questions_per_turn: 1
  outcome_promises: forbidden
  escalation: "required when money owed, penalties, disputes, or distress appear"
```

## Got Married This Year

**What may be relevant:** A marriage may change how a couple is assessed, which tax class applies, and which costs are shared. It may also change what counts as joint income. The change often applies from a specific point in the year rather than for the whole year. Details depend on the couple's situation and on the tax office.

**Ask:** When did you get married? Has the tax office been told about the change? Does your partner also work, and roughly how are your two incomes split?

**User-facing card:**

> 💍 Congratulations — that is a big year.
> Getting married may change how your taxes are worked out. It does not automatically mean a big saving.
> I can note the date and remind you what to check. One question first: when did you get married?

**Do not:** Do not promise a saving, do not say which tax class is better, and do not call it a "bonus". Avoid guessing at any amount, and do not imply the change applies for the full year.

## Bought a Computer for Work

**What may be relevant:** A computer used for work may be partly or fully relevant as a work cost. Whether it can be subtracted in one year or spread over several may depend on its value, the rules in force, and how it is used. If it is used for both work and private things, only the work share may matter.

**Ask:** What did it cost and when did you buy it? Is it used only for work, or also privately? Do you have the receipt or an invoice?

**User-facing card:**

> 💻 A new computer can be a work cost — but "cost" is not the same as "money back".
> Some big purchases are spread over several years. Others may be taken at once. It depends on the rules and on your use.
> First: is this laptop used only for work, or also for private things?

**Do not:** Do not say the full price comes off this year's tax, do not apply a threshold you cannot verify, and do not silently assume 100% work use when the receipt says otherwise.

## Work From Home

**What may be relevant:** Working from home may be relevant depending on how many days you work there, whether you have a separate room, and who pays for internet, electricity, and equipment. Some arrangements depend on the number of days; others depend on having a dedicated space. Employer allowances may also matter.

**Ask:** Roughly how many days a week do you work from home? Is there a separate room used mainly for work? Does your employer pay you any home-office allowance?

**User-facing card:**

> 🏠 Home office is not one rule — it depends on how you actually work.
> I do not need a perfect answer today. A rough number of days is enough to start.
> How many days a week do you usually work from home?

**Do not:** Do not present one method as the correct one, do not ask the user to count exact days for a whole year, and do not say home office "always" counts.

## Moved for a New Job

**What may be relevant:** A move connected to a job may involve costs that are relevant, such as transport, temporary accommodation, or double rent. A change of address also affects which tax office handles the case. Some costs may only be relevant under certain conditions, and the details depend on the reason for the move and the distance involved.

**Ask:** Was the move for a new job, and roughly when did it happen? Did you pay for transport, temporary housing, or two rents at the same time? Have you updated your address with the tax office?

**User-facing card:**

> 📦 Moving for work can involve costs that may be relevant — and it is easy to forget them.
> I can capture the big ones now while they are still fresh.
> Did you pay for transport, or for two places at once?

**Do not:** Do not promise that all moving costs count, do not ask for exact figures on the spot, and do not ignore the address change, which affects who processes the case.

## Started a Side Hustle

**What may be relevant:** Side income may need to be reported, and it may change what is owed. Whether it counts as freelance or as something else may depend on the type of work and how it is organised. There may also be registration questions. The assistant cannot classify the activity or calculate any amount.

**Ask:** What kind of work is it, and who pays you? Roughly when did the first payment arrive? Have you filed anything with the tax office about this activity yet?

**User-facing card:**

> 🌱 Starting something on the side is exciting. It also adds a new tax question.
> I cannot tell you whether you are officially self-employed — that depends on your situation.
> Let us just get the basics down: what kind of work, and who is paying you?

**Do not:** Do not say side income is tax-free under some amount, do not classify the work, do not estimate what is owed, and do not sound alarmed or accusatory.

## Changed Employer Mid-Year

**What may be relevant:** With two employers in one year there are usually two wage statements, and both may matter. Tax already withheld may have been calculated on each job separately, which can affect the year as a whole. There may also be costs from the change itself, such as travel to interviews.

**Ask:** When did you change jobs? Do you have both yearly wage statements? Were there costs around the change, like travel to interviews or application materials?

**User-facing card:**

> 🔄 Two jobs in one year usually means two documents — and it is easy to lose track of one.
> I can note both and keep a checklist so nothing gets missed.
> Do you already have the statement from your first employer?

**Do not:** Do not predict whether more or less tax is owed, do not assume the two statements can be merged without review, and do not skip asking about change-related costs.

## Received a Letter From the Tax Office

**What may be relevant:** An official letter may ask for information, confirm something, or request a payment. The content and the required response depend entirely on what the letter says. This is a high-stakes area: deadlines, payments, and objections all have consequences.

**Ask:** What does the letter ask for, in your own words? Is there a date written on it? Does it mention an amount or a payment?

**User-facing card:**

> ✉️ Official letters can feel alarming. Let us look at it together, calmly.
> I can help you understand what it seems to be asking. I cannot tell you what to do about a payment or a deadline.
> In your own words: what is it asking for?

**Do not:** Do not interpret the legal meaning of the letter, do not guess at penalties, do not advise on objections, and do not delay — if a date or amount is mentioned, recommend a qualified expert promptly and without drama.

## Sold Something Online

**What may be relevant:** Selling personal items you already owned and used is often a different situation from buying to resell. Regular selling, or selling at a profit as an activity, may be treated differently. Whether anything is relevant depends on how often you sell, what you sell, and why.

**Ask:** Was this clearing out your own things, or buying in order to sell? Roughly how many items, and over how long? Did you make a profit on any of them?

**User-facing card:**

> 📦 Selling old stuff is usually just clearing out — but the details matter.
> Occasional private sales and regular trading are not the same thing.
> Was this your own used things, or did you buy them to resell?

**Do not:** Do not declare it automatically tax-free, do not treat it as income without asking, and do not moralise about undeclared selling.

## First-Ever Tax Return

**What may be relevant:** A first return involves orientation more than optimisation. The main task is gathering a few documents, understanding roughly what each one is for, and knowing that help exists. Many employees in this situation may not even be required to file, though that depends on their circumstances.

**Ask:** Is this your first time, or have you filed before? Do you have your yearly wage statement? Is there anything unusual this year, like side income or a change in your situation?

**User-facing card:**

> 🌤️ First time doing this? You do not need to know anything yet.
> We will do it in small pieces, and nothing you enter is final.
> To start: do you have your wage statement from your employer?

**Do not:** Do not dump a full checklist on a first-time user, do not use unexplained jargon, and do not imply that filing is mandatory for everyone.
