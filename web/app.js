/* ============================================================================
   Taxfix Loop — frontend
   Reads window.TAXFIX_RUN (written by run-demo.mjs) and drives three screens.
   No framework, no build step, no network. Open this folder over file:// or
   through serve.mjs.
   ========================================================================= */

(function () {
  'use strict';

  const RUN = window.TAXFIX_RUN;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  if (!RUN) {
    document.body.innerHTML =
      '<div style="padding:40px;font-family:system-ui;max-width:560px;margin:auto">' +
      '<h1>Demo data missing</h1><p>Run <code>node run-demo.mjs</code> in the project root, ' +
      'then reload this page.</p></div>';
    return;
  }

  const RING_C = 2 * Math.PI * 58;

  const state = {
    screen: 'today',
    readiness: RUN.dashboard.readinessBefore,
    confidence: RUN.dashboard.confidenceBefore,
    repairOpen: false,
    chosenOption: null,
    extraTimeline: [],
    telemetry: RUN.telemetry.slice(),
    savedTips: new Set(),
    currentAnswerId: 'hero',
    filter: 'all',
    replaying: false,
  };

  /* ── helpers ───────────────────────────────────────────────────────────── */

  const esc = (s) =>
    String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('is-on');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  /**
   * Animate a number from a to b. Uses a timer rather than rAF and a frame
   * count rather than wall-clock, so it always terminates on exactly `to` even
   * if the tab is throttled, the clock is frozen, or another tween starts.
   * `render` is still responsible for ignoring stale frames.
   */
  function countTo(from, to, ms, render) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || ms <= 0 || from === to) { render(to); return null; }

    const tickMs = 40;
    const steps = Math.max(1, Math.round(ms / tickMs));
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      const t = Math.min(1, i / steps);
      const eased = 1 - Math.pow(1 - t, 3);
      render(Math.round(from + (to - from) * eased));
      if (i >= steps) {
        clearInterval(id);
        render(to);
      }
    }, tickMs);
    return id;
  }

  function timeAgo(ms) {
    const s = ms / 1000;
    return s < 1 ? `${Math.round(ms)}ms` : `${s.toFixed(2)}s`;
  }

  function greetingWord() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function citationChip(id) {
    if (!id) return '';
    const ev = RUN.evidenceIndex[id];
    const title = ev ? `${ev.heading} — ${ev.file}\n\n${ev.snippet}` : id;
    const short = ev ? ev.heading : id.split('#')[1] || id;
    return `<span class="cite" data-cite="${esc(id)}" title="${esc(title)}">${esc(short)}</span>`;
  }

  function statusPill(status) {
    const labels = {
      complete: 'Complete', working: 'Working', waiting: 'Waiting for you',
      flagged: 'Flagged', rewritten: 'Rewritten', queued: 'Queued',
    };
    return `<span class="status" data-s="${esc(status)}">${esc(labels[status] || status)}</span>`;
  }

  function confidenceDots(value) {
    let html = '<span class="dots">';
    for (let i = 1; i <= 5; i += 1) html += `<span class="dot${i <= value ? ' is-on' : ''}"></span>`;
    return `${html}</span>`;
  }

  /* ── screen routing ────────────────────────────────────────────────────── */

  function show(screen) {
    state.screen = screen;
    document.body.dataset.screen = screen;
    if (location.hash.slice(1) !== screen) history.replaceState(null, '', `#${screen}`);
    $$('.screen').forEach((el) => el.classList.toggle('is-active', el.id === `screen-${screen}`));
    $$('.tab').forEach((el) => el.classList.toggle('is-active', el.dataset.target === screen));
    if (screen === 'team') renderTeamExtras();
    if (screen === 'ask') renderAnswer();
  }

  /* ── TODAY ─────────────────────────────────────────────────────────────── */

  // Only the newest readiness render is allowed to write. Without this, a
  // count-up still in flight (e.g. the intro 0→62) can overwrite a later one
  // (62→78) and leave the score showing the wrong number.
  let readinessToken = 0;

  function renderReadiness(animateFrom) {
    const pct = state.readiness;
    const token = ++readinessToken;

    const label = pct >= 90 ? 'Ready' : pct >= 75 ? 'Nearly ready' : pct >= 50 ? 'On track' : pct >= 25 ? 'Getting there' : 'Just starting';

    const setNumber = (v) => {
      if (token !== readinessToken) return;
      $('#ringValue').textContent = String(v);
      $('#pillValue').textContent = `${v}%`;
    };

    // The arc is a CSS transition, so setting the final value animates it.
    const fill = $('#ringFill');
    fill.style.strokeDashoffset = String(RING_C * (1 - pct / 100));

    if (animateFrom == null || animateFrom === pct) {
      setNumber(pct);
    } else {
      countTo(animateFrom, pct, 900, setNumber);
      setTimeout(() => setNumber(pct), 1000); // hard snap; never leave a wrong number
    }

    $('#ringLabel').textContent = label;
    $('#whyScoreWord').textContent = pct;

    const headline = $('.headline');
    if (headline) headline.innerHTML = `You are <span class="hl">${pct}%</span> ready for tax season.`;

    const line = $('#readinessLine');
    if (line) {
      line.textContent =
        pct >= 75
          ? 'The open question is closed. Nothing about this number is based on how much money you might get back.'
          : 'Nothing here is about how much money you might get back. It counts what you have already prepared.';
    }
  }

  function renderWhyList() {
    const lines = (RUN.dashboard.whyScore || []).slice();
    const option = state.chosenOption;
    if (option) {
      // The base list describes the pre-repair state; once Alex has answered,
      // the last line should describe what actually changed.
      lines[lines.length - 1] =
        `You closed “${option.label}” for +${option.readiness.delta} points — recorded as your answer, not the system’s guess`;
    }
    $('#whyList').innerHTML = lines.map((w) => `<li>${esc(w)}</li>`).join('');
    $('#whyScoreWord').textContent = state.readiness;
  }

  function renderToday() {
    $('#greeting').textContent = `${greetingWord()}, ${RUN.user.shortName} 👋`;

    renderWhyList();

    // wins
    $('#wins').innerHTML = (RUN.dashboard.wins || [])
      .map((w, i) => `<div class="win" style="animation-delay:${i * 70}ms">
          <span class="win-icon">${esc(w.icon)}</span>
          <span>${esc(w.text)}</span>
          <span class="win-when">${esc(w.when)}</span>
        </div>`)
      .join('');

    renderNextAction();
    renderTeamStrip();
    renderConfidence();
    renderTip();

    $('#teamBadge').textContent = String(RUN.team.length);
    renderRail();
  }

  function currentNextAction() {
    if (!state.chosenOption) return RUN.dashboard.nextAction;
    const t = state.chosenOption.tasks[0];
    return t ? { title: t.title, why: t.why, effort: t.effort, agent: t.agent } : null;
  }

  function renderNextAction() {
    const card = $('#nextActionCard');
    const action = currentNextAction();
    const done = Boolean(state.chosenOption);

    if (!action) {
      card.innerHTML = `<div class="outcome-head">
          <span class="outcome-check">✓</span>
          <span class="outcome-title">Nothing is blocked. Your file is as ready as it can be today.</span>
        </div>`;
      return;
    }

    card.innerHTML = `
      <div class="action-top">
        <span class="action-icon">${done ? '✅' : '🔍'}</span>
        <div>
          <h3 class="action-title">${esc(action.title)}</h3>
          <p class="action-meta">${esc(action.agent)} · about ${esc(action.effort)}</p>
        </div>
      </div>
      <p class="action-why">${esc(action.why)}</p>
      <div class="action-foot">
        ${done ? '' : '<button class="btn btn-primary" id="startAction" type="button">Start — 2 minutes</button>'}
        <button class="btn btn-ghost" id="explainAction" type="button">Why this one?</button>
      </div>`;
  }

  function renderTeamStrip() {
    const roster = state.chosenOption
      ? RUN.team.map((t) =>
          t.id === 'trust-check'
            ? { ...t, status: 'complete', summary: 'Conflict resolved by you' }
            : t.id === 'tax-planner'
              ? { ...t, status: 'complete', summary: `Readiness ${state.readiness}%` }
              : t)
      : RUN.team;

    $('#teamStrip').innerHTML = roster
      .map((t) => `<div class="team-row" data-agent="${esc(t.id)}" role="button" tabindex="0">
          <span class="team-emoji">${esc(t.emoji)}</span>
          <span style="min-width:0">
            <span class="team-name">${esc(t.name)}</span><br />
            <span class="team-role">${esc(t.summary)}</span>
          </span>
          ${statusPill(t.status)}
        </div>`)
      .join('');
  }

  function renderConfidence() {
    const before = RUN.dashboard.confidenceBefore;
    const after = state.confidence;
    const moved = after !== before;
    $('#confidenceRow').innerHTML = `
      <span class="conf-label">Confidence</span>
      ${confidenceDots(before)}
      ${moved ? `<span class="conf-arrow">→</span>${confidenceDots(after)}
        <strong style="color:var(--green-800);font-size:13px">${after}/5</strong>` : ''}
      <span class="conf-label" style="margin-left:4px">${moved ? `up from ${before}/5` : `${before}/5 today`}</span>`;
  }

  function renderTip() {
    const tip = RUN.eli5.didYouKnow;
    const saved = state.savedTips.has(tip.citation);
    $('#tipCard').innerHTML = `
      <div class="tip-head">
        <span style="font-size:18px">${esc(tip.emoji)}</span>
        <span class="tip-title">${esc(tip.title)}</span>
        <span class="chip-confidence" data-c="${esc(tip.confidence || 'medium')}" style="margin-left:auto">${esc(tip.confidence || 'demo')} confidence</span>
      </div>
      <p class="tip-body">${esc(tip.body)}</p>
      <div class="tip-foot">
        <button class="btn btn-ghost" id="saveTip" type="button">${saved ? '✓ Saved' : esc(tip.cta)}</button>
        ${citationChip(tip.citation)}
      </div>`;
  }

  /* ── the repair loop ───────────────────────────────────────────────────── */

  function openRepair() {
    const loop = RUN.repairLoop;
    const conflict = loop.conflict || {};
    const card = $('#repairCard');

    card.innerHTML = `
      <span class="repair-flag" id="repairFlag">⚠ One thing needs you</span>
      <h3 class="repair-q">${esc(loop.question)}</h3>
      <p class="repair-sub">${esc(loop.subtext)}</p>
      <div class="conflict-grid">
        <div class="conflict-cell">
          <span class="conflict-k">The receipt says</span>
          <span class="conflict-v">${esc(conflict.documentSays || 'work and private use')}</span>
        </div>
        <span class="conflict-vs">vs</span>
        <div class="conflict-cell is-you">
          <span class="conflict-k">You said</span>
          <span class="conflict-v">${esc(conflict.userClaim || '100% for freelance work')}</span>
        </div>
      </div>
      <div class="options">
        ${loop.options
          .map((o) => `<button class="option" data-option="${esc(o.id)}" type="button">
              <span class="option-radio" aria-hidden="true"></span>
              <span class="option-text">
                <span class="option-label">${esc(o.label)}</span>
                <span class="option-helper">${esc(o.helper)}</span>
              </span>
            </button>`)
          .join('')}
      </div>
      <div class="action-foot" style="margin-top:13px">
        <button class="btn btn-quiet" id="changeAnswer" type="button" hidden>Change my answer</button>
      </div>`;

    card.classList.remove('is-answered');
    card.hidden = false;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function chooseOption(id) {
    const option = RUN.repairLoop.options.find((o) => o.id === id);
    if (!option) return;

    state.chosenOption = option;
    state.repairOpen = false;

    const card = $('#repairCard');
    $$('.option', card).forEach((el) => el.classList.toggle('is-chosen', el.dataset.option === id));
    card.classList.add('is-answered');
    const flag = $('#repairFlag');
    if (flag) { flag.textContent = '✓ Answered — this was your call'; flag.classList.add('is-done'); }
    const change = $('#changeAnswer');
    if (change) change.hidden = false;

    const beforeReadiness = state.readiness;
    const beforeConfidence = state.confidence;
    state.readiness = option.readiness.after;
    state.confidence = option.confidence.after;

    // telemetry ticks
    option.events.forEach((name) => pushTelemetry(name, { option: id }));
    if (!state.savedTips.has('repair-answered')) {
      state.savedTips.add('repair-answered');
      pushTelemetry('tip_saved', { card: 'repair' });
    }

    // append the post-repair agent steps to the AI team timeline
    const baseAt = RUN.timeline.length ? RUN.timeline[RUN.timeline.length - 1].at : 0;
    option.steps.forEach((s, i) => {
      state.extraTimeline.push({ ...s, at: baseAt + (i + 1) * 900, seq: 900 + state.extraTimeline.length });
    });

    renderReadiness(beforeReadiness);
    renderWhyList();
    renderConfidence();
    renderNextAction();
    renderTeamStrip();

    // outcome card
    const outcome = $('#outcomeCard');
    outcome.innerHTML = `
      <div class="outcome-head">
        <span class="outcome-check">✓</span>
        <span class="outcome-title">Recorded — with your name on the decision</span>
      </div>
      <div class="delta-row">
        <span class="delta-chip">Readiness ${option.readiness.before}% → ${option.readiness.after}%</span>
        <span class="delta-arrow">·</span>
        <span class="delta-chip">+${option.readiness.delta} points</span>
        <span class="delta-arrow">·</span>
        <span class="delta-chip">Confidence ${beforeConfidence}/5 → ${option.confidence.after}/5</span>
      </div>
      <p class="outcome-note"><strong>Trust Check:</strong> ${esc(option.trustNote)}</p>
      <p class="outcome-note"><strong>Tax Planner:</strong> ${esc(option.plannerNote)}</p>
      <div>
        ${option.tasks
          .map((t, i) => `<div class="task-mini" style="animation-delay:${i * 90}ms">
              <span class="task-mini-icon">${i + 1}</span>
              <span>${esc(t.title)}</span>
              <span class="task-mini-effort">${esc(t.effort)}</span>
            </div>`)
          .join('')}
      </div>
      <div class="action-foot" style="margin-top:14px">
        <button class="btn btn-ghost" id="seeTeamBtn" type="button">See what the team did</button>
      </div>`;
    outcome.hidden = false;
    outcome.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    toast(`${option.label} — recorded. Nothing was submitted.`);

    setTimeout(() => {
      document.body.classList.add('repair-done');
    }, 400);
  }

  function pushTelemetry(name, payload) {
    state.telemetry.push({ name, at: (state.telemetry.at(-1) ? state.telemetry.at(-1).at : 0) + 600, payload });
  }

  /* ── AI TEAM ───────────────────────────────────────────────────────────── */

  function allTimeline() {
    return RUN.timeline.concat(state.extraTimeline);
  }

  function ringOf(agentId) {
    if (['product-expert', 'deep-research', 'frontend-design'].includes(agentId)) return 'product';
    if (['document-detective', 'tax-planner', 'eli5-specialist'].includes(agentId)) return 'tax';
    return 'quality';
  }

  function renderMetrics() {
    const m = RUN.metrics;
    const items = [
      { v: m.claimsAudited, k: 'claims audited' },
      { v: m.unsafeMessagesRejected, k: 'unsafe messages rejected' },
      { v: `${m.checklistBefore}→${m.checklistAfter}`, k: 'tone rules passing' },
      { v: state.chosenOption ? state.readiness : RUN.dashboard.readinessBefore, k: 'readiness %' },
      { v: RUN.meta.ragChunks, k: 'knowledge chunks' },
      { v: RUN.meta.agentCount, k: 'specialist agents' },
    ];
    $('#metricsRow').innerHTML = items
      .map((i) => `<div class="metric"><span class="metric-v">${esc(i.v)}</span><span class="metric-k">${esc(i.k)}</span></div>`)
      .join('');
  }

  function renderFilters() {
    const filters = [
      ['all', 'Everything'],
      ['product', 'Product ring'],
      ['tax', 'Tax ring'],
      ['quality', 'Quality ring'],
      ['flag', 'Flags only'],
    ];
    $('#filterRow').innerHTML = filters
      .map(([id, label]) => `<button class="filter${state.filter === id ? ' is-active' : ''}" data-filter="${id}" type="button">${esc(label)}</button>`)
      .join('');
  }

  function payloadDetail(step) {
    const p = step.payload;
    if (!p) return '';
    const list = (arr, fn) => `<div class="attack-list">${arr.map(fn).join('')}</div>`;

    switch (p.type) {
      case 'goals':
        return `
          <div class="tl-more">
            <strong>Principles the team must obey</strong>
            <ul style="margin:8px 0 0;padding-left:18px">${p.principles.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
            <strong style="display:block;margin-top:12px">Deliberately not building</strong>
            <ul style="margin:8px 0 0;padding-left:18px">${p.notBuilding.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          </div>`;

      case 'insights':
        return `<div class="tl-more">${p.cards
          .slice(0, 4)
          .map((c) => `<div class="attack" data-v="pass">
              <p class="attack-q">${esc(c.trend)} <span class="badge-sev" data-s="${esc(c.confidence === 'high' ? 'High' : c.confidence === 'low' ? 'Low' : 'Medium')}">${esc(c.confidence)}</span></p>
              <p class="attack-r">${esc(c.insight)}</p>
              <p class="attack-f"><strong>Opportunity:</strong> ${esc(c.opportunity)}</p>
              <p class="attack-f" style="color:var(--ink-faint)"><strong>Source:</strong> ${esc(c.source)}</p>
            </div>`)
          .join('')}</div>`;

      case 'design':
        return `<div class="tl-more">
            ${p.screens.map((s) => `<strong style="display:block;margin-top:8px">${esc(s.name)} — ${esc(s.purpose)}</strong>
              <ul style="margin:6px 0 0;padding-left:18px">${s.blocks.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`).join('')}
          </div>`;

      case 'documents':
        return `<div class="tl-more">${p.documents
          .map((d) => `<div class="task-mini">
              <span class="task-mini-icon">${esc(d.icon)}</span>
              <span><strong>${esc(d.label)}</strong>${d.amount != null ? ` · €${esc(Math.abs(d.amount).toLocaleString('en-GB'))}` : ''}${d.dateLabel ? ` · ${esc(d.dateLabel)}` : ''}
              <br /><span style="color:var(--ink-faint);font-size:12px">${esc(d.relevance)}</span></span>
              <span class="task-mini-effort">${d.confirmed ? 'confirmed' : 'needs you'}</span>
            </div>`)
          .join('')}</div>`;

      case 'conflict':
        return `<div class="tl-more"><strong>${esc(p.conflict.documentSays)}</strong> vs <strong>${esc(p.conflict.userClaim)}</strong>
            <p style="margin:8px 0 0">${esc(p.conflict.why)}</p>
            <p style="margin:8px 0 0;color:var(--coral-600)"><strong>Required action:</strong> ${esc(p.conflict.requiredAction)}</p></div>`;

      case 'plan':
        return `<div class="tl-more">
            <strong>Why ${esc(p.score)}%?</strong>
            <ul style="margin:8px 0 0;padding-left:18px">${p.whyScore.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
            <strong style="display:block;margin-top:12px">The backlog (deliberately kept behind the fold)</strong>
            ${p.plan.map((t) => `<div class="task-mini"><span class="task-mini-icon">${t.status === 'next' ? '→' : '·'}</span><span>${esc(t.title)}</span><span class="task-mini-effort">${esc(t.effort)}</span></div>`).join('')}
            <strong style="display:block;margin-top:12px">The three-minute monthly check-in</strong>
            <ul style="margin:8px 0 0;padding-left:18px">${p.checkin.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
          </div>`;

      case 'rejection':
        return `<div class="tl-more">
            <div class="diff">
              <div class="diff-row before"><span class="diff-k">Proposed</span><s>${esc(p.rejection.proposed)}</s></div>
            </div>
            <p style="margin:10px 0 0"><strong>Why it fails.</strong> ${esc(p.rejection.attack)}</p>
            <p style="margin:10px 0 0;color:var(--ink-faint)"><strong>Rules broken:</strong> ${p.rejection.violates.map(esc).join(' · ')}</p>
            <div style="margin-top:10px">${citationChip(p.rejection.citation)}</div>
          </div>`;

      case 'concept-attacks':
        return list(p.attacks, (a) => `<div class="attack" data-v="${esc(a.verdict)}">
            <p class="attack-q">${esc(a.question)} <span class="badge-sev" data-s="${esc(a.severity)}">${esc(a.severity)}</span></p>
            <p class="attack-r">${esc(a.risk)}</p>
            <p class="attack-f"><strong>Fix:</strong> ${esc(a.fix)}</p>
          </div>`);

      case 'trust':
        return `<div class="tl-more">
            <strong>${p.passed} of ${p.claimsAudited} claims passed without a rewrite.</strong>
            ${p.blocked.length ? `<p style="margin:8px 0 4px"><strong>Blocked, not softened:</strong></p>
              ${p.blocked.map((b) => `<div class="attack"><p class="attack-q">${esc(b.agent)}</p><p class="attack-r">${esc(b.statement)}</p>
                <p class="attack-f"><strong>Why blocked:</strong> ${esc((b.issues[0] && b.issues[0].why) || 'no evidence attached')}</p></div>`).join('')}` : ''}
            <strong style="display:block;margin-top:12px">Rules the auditor enforces</strong>
            <ul style="margin:8px 0 0;padding-left:18px">${p.policy.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          </div>`;

      case 'rewrite':
        return `<div class="tl-more">
            <div class="diff">
              <div class="diff-row before"><span class="diff-k">Before — rejected</span><s>${esc(p.before)}</s></div>
              <div class="diff-row after"><span class="diff-k">After — cleared by Brand</span>${esc(p.after)}</div>
            </div>
            <p style="margin:11px 0 0;font-size:12.5px;color:var(--ink-soft)">${esc(p.reason)}</p>
            <div class="checklist">${p.checklist
              .map((c) => `<div class="check">
                  <span class="check-mark ${c.after ? 'yes' : 'no'}">${c.after ? '✓' : '✕'}</span>
                  <span>${esc(c.label)}</span>
                  ${!c.before && c.after ? '<span class="check-fix">fixed</span>' : ''}
                </div>`)
              .join('')}</div>
          </div>`;

      case 'tone':
        return `<div class="tl-more">
            ${p.detected.map((d) => `<div class="task-mini">
                <span class="task-mini-icon">${d.humour ? '🙂' : '🚫'}</span>
                <span>${esc(d.question)}<br /><span style="color:var(--ink-faint);font-size:12px">${esc(d.reason)}</span></span>
                <span class="task-mini-effort">${esc(d.mode)}</span>
              </div>`).join('')}
            <strong style="display:block;margin-top:12px">The four tone modes</strong>
            ${Object.entries(p.modes).map(([name, m]) => `<div class="attack" data-v="${m.humour ? 'pass-with-fix' : 'pass'}">
                <p class="attack-q">${esc(name)} ${m.humour ? '' : '<span class="badge-sev" data-s="High">no humour</span>'}</p>
                <p class="attack-r">${esc(m.example)}</p>
                <p class="attack-f"><strong>When:</strong> ${esc(m.when)}</p>
              </div>`).join('')}
          </div>`;

      case 'eli5':
        return `<div class="tl-more">
            <strong>Who touched this answer</strong>
            <ul style="margin:8px 0 0;padding-left:0;list-style:none">
              ${p.heroTrace.map((t) => `<li class="trace-item"><span class="trace-who">${esc(t.agent)}</span><span>${esc(t.action)}</span></li>`).join('')}
            </ul>
          </div>`;

      case 'verify':
        return `<div class="tl-more"><p style="margin:0">${esc(p.result.reAttack)}</p>
            <p style="margin:8px 0 0;color:var(--green-700)"><strong>Verdict:</strong> ${esc(p.result.verdict)}</p></div>`;

      case 'resolution':
        return `<div class="tl-more"><p style="margin:0">The user answered. The system recorded both statements rather than picking a winner, and kept the answer traceable to the person who gave it.</p></div>`;

      case 'readiness-change':
        return `<div class="tl-more"><p style="margin:0">${esc(step.detail)}</p>
            <div class="delta-row" style="margin:10px 0 0">
              <span class="delta-chip">${p.before}% → ${p.after}%</span>
              <span class="delta-arrow">·</span>
              <span class="delta-chip">+${p.delta} points</span>
            </div></div>`;

      case 'closing':
        return `<div class="tl-more">${p.tasks.map((t) => `<div class="task-mini"><span class="task-mini-icon">→</span><span><strong>${esc(t.title)}</strong><br /><span style="color:var(--ink-faint);font-size:12px">${esc(t.why)}</span></span><span class="task-mini-effort">${esc(t.effort)}</span></div>`).join('')}</div>`;

      case 'tone-hold':
        return `<div class="tl-more"><p style="margin:0">${esc(step.detail)}</p></div>`;

      default:
        return step.detail ? `<div class="tl-more">${esc(step.detail)}</div>` : '';
    }
  }

  function renderTimeline() {
    const ol = $('#timeline');
    const items = allTimeline();

    ol.innerHTML = items
      .map((step, i) => {
        const ring = ringOf(step.agentId);
        const kind = step.kind || 'normal';
        return `<li class="tl-item" data-kind="${esc(kind)}" data-ring="${esc(ring)}" data-agent="${esc(step.agentId)}" data-seq="${esc(step.seq)}" style="animation-delay:${Math.min(i * 45, 500)}ms">
            <div class="tl-card" data-expandable="${step.payload ? '1' : '0'}">
              <div class="tl-top">
                <span>${esc(step.emoji)}</span>
                <span class="tl-who">${esc(step.agentName)}</span>
                ${statusPill(step.status)}
                <span class="tl-time">${esc(timeAgo(step.at || 0))}</span>
              </div>
              <p class="tl-title">${esc(step.title)}</p>
              ${step.detail ? `<p class="tl-detail">${esc(step.detail)}</p>` : ''}
              ${step.citations && step.citations.filter(Boolean).length ? `<div class="tl-cites">${step.citations.filter(Boolean).map(citationChip).join('')}</div>` : ''}
              ${step.payload ? `<div class="tl-detail" style="margin-top:9px;color:var(--green-600);font-weight:700;font-size:12px">Tap for the artefact ▾</div>` : ''}
            </div>
          </li>`;
      })
      .join('');

    applyFilter();
    renderTelemetry();
  }

  function applyFilter() {
    $$('.tl-item').forEach((el) => {
      const f = state.filter;
      const show =
        f === 'all' ||
        (f === 'flag' ? el.dataset.kind === 'flag' || el.dataset.kind === 'question' : el.dataset.ring === f);
      el.classList.toggle('is-hidden', !show);
    });
  }

  function renderTelemetry() {
    const el = $('#telemetryBlock');
    if (!el) return;
    el.innerHTML = `<div class="telemetry">${state.telemetry
      .map((t, i) => `<span class="tel" style="animation-delay:${Math.min(i * 35, 400)}ms">${esc(t.name)}</span>`)
      .join('')}</div>`;
  }

  function renderTeamExtras() {
    renderMetrics();
    renderFilters();

    const extras = $('#teamExtras');
    const brand = RUN.brand;
    const trust = RUN.trust;
    const adv = RUN.adversarial;

    extras.innerHTML = `
      <h2 class="section-title">The rejected joke, and what replaced it</h2>
      <div class="card">
        <div class="diff">
          <div class="diff-row before"><span class="diff-k">Rejected · High severity</span><s>${esc(RUN.brandRewrite.before)}</s></div>
          <div class="diff-row after"><span class="diff-k">Cleared by Brand Guardian</span>${esc(RUN.brandRewrite.after)}</div>
        </div>
        <p style="margin:11px 0 0;font-size:13px;color:var(--ink-soft)">${esc(RUN.brandRewrite.reason)}</p>
        <div class="checklist">${brand.checklistRun
          .map((c) => `<div class="check"><span class="check-mark ${c.after ? 'yes' : 'no'}">${c.after ? '✓' : '✕'}</span><span>${esc(c.label)}</span>${!c.before && c.after ? '<span class="check-fix">fixed</span>' : ''}</div>`)
          .join('')}</div>
      </div>

      <h2 class="section-title">${esc(adv.conceptAttacks.length)} concept risks the team had to answer</h2>
      <div class="card">
        <div class="attack-list">${adv.conceptAttacks
          .map((a) => `<div class="attack" data-v="${esc(a.verdict)}">
              <p class="attack-q">${esc(a.question)} <span class="badge-sev" data-s="${esc(a.severity)}">${esc(a.severity)}</span></p>
              <p class="attack-r">${esc(a.risk)}</p>
              <p class="attack-f"><strong>Fix:</strong> ${esc(a.fix)}</p>
            </div>`)
          .join('')}</div>
        <p style="margin:13px 0 0;font-size:12.5px;color:var(--ink-faint)">${esc(adv.survivalRule)}</p>
      </div>

      <h2 class="section-title">Grounding audit</h2>
      <div class="card">
        <div class="metrics-row" style="margin-bottom:12px">
          <div class="metric"><span class="metric-v">${esc(trust.claimsAudited)}</span><span class="metric-k">claims audited</span></div>
          <div class="metric"><span class="metric-v">${esc(trust.passed)}</span><span class="metric-k">passed</span></div>
          <div class="metric"><span class="metric-v">${esc(trust.blockedCount)}</span><span class="metric-k">blocked</span></div>
          <div class="metric"><span class="metric-v">${esc(trust.conflicts.length)}</span><span class="metric-k">open conflicts</span></div>
        </div>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--ink-soft);line-height:1.6">
          ${trust.policy.map((p) => `<li>${esc(p)}</li>`).join('')}
        </ul>
      </div>

      <h2 class="section-title">Return-loop telemetry</h2>
      <div class="card" id="telemetryBlock"></div>

      <h2 class="section-title">Safe humour library</h2>
      <div class="card">
        <div class="attack-list">${brand.humourCards
          .map((c) => `<div class="attack" data-v="pass">
              <p class="attack-q">${esc(c.emoji)} ${esc(c.title)}</p>
              <p class="attack-r">${esc(c.body)}</p>
              <p class="attack-f"><strong>Button:</strong> ${esc(c.cta)} · <strong>Tone:</strong> ${esc(c.tone)}</p>
            </div>`)
          .join('')}</div>
      </div>`;

    renderTelemetry();
  }

  function replayTimeline() {
    if (state.replaying) return;
    state.replaying = true;
    const btn = $('#replayBtn');
    btn.disabled = true;

    renderTimeline();

    const items = $$('.tl-item');
    const visible = items.filter((el) => !el.classList.contains('is-hidden'));
    const finalStatuses = allTimeline().map((s) => s.status);
    const finalKinds = allTimeline().map((s) => s.kind || 'normal');

    // Reset everything to queued/working, then resolve one at a time.
    visible.forEach((el) => {
      const pill = $('.status', el);
      if (pill) { pill.dataset.s = 'queued'; pill.textContent = 'Queued'; }
    });

    let i = 0;
    const stepMs = 260;

    const tick = () => {
      if (i >= visible.length) {
        $('#replayStatus').textContent = 'Run complete';
        $('#replayHint').textContent =
          `${allTimeline().length} steps · ${RUN.metrics.unsafeMessagesRejected} rejected · readiness ${state.readiness}%`;
        btn.disabled = false;
        state.replaying = false;
        return;
      }
      const el = visible[i];
      const idx = items.indexOf(el);
      const pill = $('.status', el);

      if (pill) { pill.dataset.s = 'working'; pill.textContent = 'Working'; }
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      setTimeout(() => {
        if (pill) {
          const s = finalStatuses[idx] || 'complete';
          const labels = { complete: 'Complete', working: 'Working', waiting: 'Waiting for you', flagged: 'Flagged', rewritten: 'Rewritten', queued: 'Queued' };
          pill.dataset.s = s;
          pill.textContent = labels[s] || s;
        }
        i += 1;
        tick();
      }, stepMs);
    };

    $('#replayStatus').textContent = 'Team is working…';
    $('#replayHint').textContent = 'Product ring → tax ring → quality ring.';
    tick();
  }

  /* ── ASK ───────────────────────────────────────────────────────────────── */

  function renderChips() {
    $('#askChips').innerHTML = RUN.presetQuestions
      .map((q) => `<button class="ask-chip${q.hero ? ' is-hero' : ''}${state.currentAnswerId === q.id ? ' is-active' : ''}" data-q="${esc(q.id)}" type="button">${esc(q.label)}</button>`)
      .join('');
  }

  function renderAnswer() {
    renderChips();
    const answer = RUN.eli5.answers.find((a) => a.id === state.currentAnswerId) || RUN.eli5.answers[0];
    const area = $('#answerArea');

    const layers = [
      { k: 'Acknowledge', v: answer.acknowledge, cls: '' },
      { k: 'Explain simply', v: answer.explain, cls: 'is-explain' },
      { k: 'One example', v: answer.example, cls: '' },
      { k: 'Your next step', v: answer.nextStep, cls: '' },
    ];

    const confidenceBlock = answer.hero || answer.sensitive
      ? `<div class="confidence-block">
           <p class="confidence-title">Confidence</p>
           <div class="confidence-row">
             <span class="conf-label">Before</span>${confidenceDots(RUN.dashboard.confidenceBefore)}
             <span class="conf-arrow">→</span>
             <span class="conf-label">After</span>${confidenceDots(state.confidence)}
             <strong style="color:var(--green-800);font-size:13px">${state.confidence}/5</strong>
           </div>
           <p style="margin:11px 0 0;font-size:12.5px;color:var(--ink-soft);line-height:1.5">
             ${esc(answer.confidenceNote || 'Confidence is a self-report, not a grade. It moves when something stops being unclear.')}
           </p>
         </div>`
      : '';

    const breakdown = answer.breakdown
      ? `<div class="breakdown">${answer.breakdown
          .map((b) => `<div class="bd${b.highlight ? ' is-highlight' : ''}">
              <div class="bd-top">
                <span class="bd-emoji">${esc(b.emoji)}</span>
                <span class="bd-title">${esc(b.title)}</span>
                <span class="bd-status">${esc(b.status)}</span>
              </div>
              <p class="bd-detail">${esc(b.detail)}</p>
              <div class="action-foot">
                <button class="btn btn-ghost" data-action="${esc(b.action || '')}" type="button">${esc(b.cta)}</button>
                ${b.citation ? citationChip(b.citation) : ''}
              </div>
            </div>`)
          .join('')}</div>`
      : '';

    const suggestions = (answer.suggestions || []).length
      ? `<div class="suggestions">${answer.suggestions
          .map((s) => `<button class="btn btn-ghost" data-action="${esc(s.action)}" type="button">${esc(s.label)}</button>`)
          .join('')}</div>`
      : '';

    const trace = answer.hero
      ? `<div class="trace">
           <p class="trace-title">Not a lone chatbot — who touched this answer</p>
           <ul class="trace-list">${RUN.eli5.heroTrace
             .map((t, i) => `<li class="trace-item" style="animation-delay:${i * 60}ms">
                 <span class="trace-who">${esc(t.agent)}</span><span>${esc(t.action)}</span>
               </li>`)
             .join('')}</ul>
         </div>`
      : '';

    const brandNote = answer.brand
      ? `<p style="margin:14px 0 0;font-size:11.5px;color:var(--ink-faint)">
           Tone review: <strong>${esc(answer.brand.verdict)}</strong> · ${esc(answer.brand.note)}
         </p>`
      : '';

    area.innerHTML = `
      <div class="answer">
        <div class="answer-q">
          <span class="answer-q-avatar">🧑‍💻</span>
          <span class="answer-q-bubble">${esc(answer.question)}</span>
        </div>
        <div class="card answer-card">
          <div class="answer-head">
            <span class="answer-agent"><span class="em">💬</span> ELI5 Specialist</span>
            <span class="tone-pill" data-t="${esc(answer.tone.mode)}">${esc(answer.tone.mode)} mode</span>
            ${answer.tone.humour ? '' : '<span class="humour-off">Humour off</span>'}
          </div>
          <div class="layers">
            ${layers
              .map((l, i) => `<div class="layer ${l.cls}" style="animation-delay:${i * 70}ms">
                  <span class="layer-num">${i + 1}</span>
                  <div><span class="layer-k">${esc(l.k)}</span><p class="layer-v">${esc(l.v)}</p></div>
                </div>`)
              .join('')}
            ${breakdown ? `<div style="padding:13px 0 0">${breakdown}</div>` : ''}
            ${confidenceBlock}
            ${suggestions}
            ${trace}
            ${brandNote}
          </div>
        </div>
        ${answer.citations && answer.citations.length
          ? `<div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
               <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint)">Grounded in</span>
               ${answer.citations.map(citationChip).join('')}
             </div>`
          : ''}
      </div>`;
  }

  /** Route a free-text question to the nearest prepared answer, or compose one. */
  function answerFor(question) {
    const q = String(question || '').toLowerCase();
    const pick = (id) => { state.currentAnswerId = id; renderAnswer(); };

    if (/\b(scared|afraid|worried|fined|penalt|debt|hardship|legal|late|missed)\b/.test(q)) return pick('scared');
    if (/\b(just submit|do it for me|handle it|without me|submit it)\b/.test(q)) return pick('auto');
    if (/\b(laptop|computer|money back|refund|deduct|claim)\b/.test(q)) return pick('laptop');
    if (/\b(tax class|what is|what are|explain|mean|steuerklasse)\b/.test(q)) return pick('jargon');
    if (/\b(married|marriage|freelance|side hustle|mess up|messed|did i)\b/.test(q)) return pick('hero');

    // Nothing prepared matches: say so honestly rather than inventing an answer.
    const hero = RUN.eli5.answers.find((a) => a.hero);
    state.currentAnswerId = null;
    $('#askChips').innerHTML = RUN.presetQuestions
      .map((p) => `<button class="ask-chip${p.hero ? ' is-hero' : ''}" data-q="${esc(p.id)}" type="button">${esc(p.label)}</button>`)
      .join('');

    $('#answerArea').innerHTML = `
      <div class="answer">
        <div class="answer-q">
          <span class="answer-q-avatar">🧑‍💻</span>
          <span class="answer-q-bubble">${esc(question)}</span>
        </div>
        <div class="card answer-card">
          <div class="answer-head">
            <span class="answer-agent"><span class="em">💬</span> ELI5 Specialist</span>
            <span class="tone-pill" data-t="Calm">Calm mode</span>
            <span class="humour-off">Humour off</span>
          </div>
          <div class="layers">
            <div class="layer"><span class="layer-num">1</span><div><span class="layer-k">Acknowledge</span>
              <p class="layer-v">Good question, and I don’t want to bluff an answer to it.</p></div></div>
            <div class="layer"><span class="layer-num">2</span><div><span class="layer-k">Explain simply</span>
              <p class="layer-v">This is outside what the synthetic demo knowledge base covers, so the honest reply is “I don’t know yet” rather than a confident guess.</p></div></div>
            <div class="layer"><span class="layer-num">3</span><div><span class="layer-k">One example</span>
              <p class="layer-v">In the live product this question would be routed to a human expert with your documents attached — not answered from a demo file.</p></div></div>
            <div class="layer"><span class="layer-num">4</span><div><span class="layer-k">Your next step</span>
              <p class="layer-v">Save the question and I’ll put it in the review queue. You will get an answer from a person, and I’ll show you exactly what I could not confirm.</p></div></div>
            <div class="suggestions">
              <button class="btn btn-primary" data-action="expert" type="button">Save for expert review</button>
              <button class="btn btn-ghost" data-action="hero" type="button">Show me the questions I can answer</button>
            </div>
            <p style="margin:14px 0 0;font-size:11.5px;color:var(--ink-faint)">
              Tone review: <strong>approved</strong> · refusing to guess is the compliant behaviour, not a failure.
            </p>
          </div>
        </div>
      </div>`;
  }

  /* ── rail ──────────────────────────────────────────────────────────────── */

  function renderRail() {
    const m = RUN.metrics;
    $('#railRun').innerHTML = `
      <p class="rail-kicker">This run</p>
      <dl>
        <dt>Run id</dt><dd>${esc(RUN.meta.runId)}</dd>
        <dt>Agents</dt><dd>${esc(RUN.meta.agentCount)}</dd>
        <dt>RAG chunks</dt><dd>${esc(RUN.meta.ragChunks)}</dd>
        <dt>Timeline steps</dt><dd>${esc(allTimeline().length)}</dd>
        <dt>Claims audited</dt><dd>${esc(m.claimsAudited)}</dd>
        <dt>Rejected copy</dt><dd>${esc(m.unsafeMessagesRejected)}</dd>
        <dt>Readiness</dt><dd>${esc(RUN.dashboard.readinessBefore)}% → ${esc(RUN.dashboard.readinessAfter)}%</dd>
        <dt>Confidence</dt><dd>${esc(RUN.dashboard.confidenceBefore)}/5 → ${esc(RUN.dashboard.confidenceAfter)}/5</dd>
      </dl>
      <p class="rail-kicker" style="margin-top:14px">Reproduce</p>
      <pre style="margin:0;font-family:var(--mono);font-size:11px;color:var(--ink-soft);white-space:pre-wrap">node run-demo.mjs --check</pre>`;
  }

  /* ── events ────────────────────────────────────────────────────────────── */

  function bind() {
    $('#tabbar').addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (tab) show(tab.dataset.target);
    });

    $('#readinessPill').addEventListener('click', () => {
      show('today');
      $('#whyScoreBtn').setAttribute('aria-expanded', 'true');
      $('#whyList').hidden = false;
    });

    $('#whyScoreBtn').addEventListener('click', () => {
      const open = $('#whyScoreBtn').getAttribute('aria-expanded') === 'true';
      $('#whyScoreBtn').setAttribute('aria-expanded', String(!open));
      $('#whyList').hidden = open;
    });

    // Delegated clicks
    document.addEventListener('click', (e) => {
      const t = e.target;

      if (t.closest('#startAction')) { openRepair(); return; }
      if (t.closest('#explainAction')) {
        toast('Exactly one action is surfaced at a time — the rest stay in the backlog.');
        return;
      }
      if (t.closest('#seeTeamBtn')) { show('team'); return; }
      if (t.closest('#saveTip')) {
        const id = RUN.eli5.didYouKnow.citation;
        if (state.savedTips.has(id)) { toast('Already saved.'); return; }
        state.savedTips.add(id);
        pushTelemetry('tip_saved', { card: id });
        renderTip();
        toast('Saved. It will come back in your next monthly check-in.');
        return;
      }
      if (t.closest('#replayBtn')) { replayTimeline(); return; }
      if (t.closest('#controlToggle')) {
        setTimeout(() => {
          const on = $('#controlToggle').checked;
          $('#submitBtn').disabled = !on;
          toast(on ? 'Good. Nothing is submitted without you.' : 'Approval switched off — submission stays locked.');
        }, 0);
        return;
      }
      if (t.closest('#submitBtn')) {
        toast('In the real product this opens review — in the prototype, nothing is filed.');
        return;
      }

      const option = t.closest('[data-option]');
      if (option) { chooseOption(option.dataset.option); return; }

      if (t.closest('#changeAnswer')) {
        const card = $('#repairCard');
        card.classList.remove('is-answered');
        const flag = $('#repairFlag');
        if (flag) { flag.textContent = '⚠ One thing needs you'; flag.classList.remove('is-done'); }
        $('#changeAnswer').hidden = true;
        return;
      }

      const chip = t.closest('.ask-chip');
      if (chip) {
        state.currentAnswerId = chip.dataset.q;
        renderAnswer();
        return;
      }

      const filter = t.closest('.filter');
      if (filter) {
        state.filter = filter.dataset.filter;
        renderFilters();
        applyFilter();
        return;
      }

      const expandable = t.closest('.tl-card[data-expandable="1"]');
      if (expandable) {
        const li = expandable.closest('.tl-item');
        const step = allTimeline().find((s) => String(s.seq) === li.dataset.seq);
        const existing = $('.tl-more', expandable);
        if (existing) { existing.remove(); return; }
        if (step) {
          expandable.insertAdjacentHTML('beforeend', payloadDetail(step));
          const detail = $('.tl-more', expandable);
          if (detail && detail.classList.contains('attack-list')) detail.classList.add('tl-more');
        }
        return;
      }

      const teamRow = t.closest('.team-row');
      if (teamRow) {
        show('team');
        state.filter = 'all';
        renderFilters();
        applyFilter();
        const target = $$('.tl-item').find((el) => el.dataset.agent === teamRow.dataset.agent);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.animate(
            [{ background: 'rgba(79,191,143,.18)' }, { background: 'transparent' }],
            { duration: 1200, easing: 'ease-out' },
          );
        }
        return;
      }

      const action = t.closest('[data-action]');
      if (action) {
        const a = action.dataset.action || '';
        if (a === 'repair') { show('today'); openRepair(); return; }
        if (a === 'plan') { show('team'); return; }
        if (a.startsWith('repair:')) {
          show('today');
          openRepair();
          chooseOption(a.split(':')[1]);
          return;
        }
        if (a.startsWith('plan:')) { show('today'); openRepair(); return; }
        if (a === 'expert') { toast('Queued for expert review — a person, not a guess.'); return; }
        if (a === 'document') { show('team'); return; }
        if (a === 'hero') {
          state.currentAnswerId = 'hero';
          renderAnswer();
          return;
        }
        if (a === 'summary') { toast('Summary review is the approval step — nothing is filed here.'); return; }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const open = $('.tl-more');
        if (open) open.remove();
      }
    });

    $('#askForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const value = $('#askInput').value.trim();
      if (!value) return;
      answerFor(value);
      $('#askInput').value = '';
    });
  }

  /* ── boot ──────────────────────────────────────────────────────────────── */

  function boot() {
    if (RUN.user && RUN.user.shortName) {
      document.title = `Taxfix Loop — ${RUN.dashboard.readinessBefore}% ready`;
    }
    renderToday();
    renderTimeline();
    renderAnswer();
    bind();

    // First paint: let the ring travel to its value so the number feels earned.
    const fill = $('#ringFill');
    fill.style.strokeDashoffset = String(RING_C);
    requestAnimationFrame(() => setTimeout(() => renderReadiness(0), 180));

    // Deep links, so a presenter can jump straight to a moment:
    //   #team #ask   ?answer=scared   ?repair=mostly-freelance   ?replay=1
    const params = new URLSearchParams(location.search);
    if (params.get('answer')) state.currentAnswerId = params.get('answer');
    if (params.get('replay')) {
      show('team');
      setTimeout(replayTimeline, 400);
    } else if (params.get('repair')) {
      openRepair();
      setTimeout(() => chooseOption(params.get('repair')), 260);
    } else if (location.hash.length > 1) {
      show(location.hash.slice(1));
    }

    console.log(
      `%cTaxfix Loop%c ${RUN.meta.agentCount} agents · ${RUN.meta.ragChunks} chunks · ${RUN.timeline.length} steps\n` +
      `Try: __taxfix.replay()  __taxfix.answer('I am scared of a fine')  __taxfix.choose('mostly-freelance')`,
      'font-weight:800;color:#1F7A5A', 'color:#4A5A54',
    );
  }

  // Console helpers for driving the demo from the keyboard during a pitch.
  window.__taxfix = {
    show,
    replay: () => { show('team'); setTimeout(replayTimeline, 320); },
    answer: (q) => { show('ask'); answerFor(q); },
    choose: (id) => { show('today'); openRepair(); setTimeout(() => chooseOption(id), 250); },
    openRepair: () => { show('today'); openRepair(); },
    state,
    run: RUN,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
