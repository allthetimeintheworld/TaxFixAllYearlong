/**
 * blackboard.mjs — the shared run state every specialist reads from and writes
 * to. This is what makes the prototype genuinely multi-agent rather than seven
 * disconnected prompt wrappers: agents do not call each other, they contribute
 * artefacts to one blackboard and the orchestrator sequences them.
 *
 * Every write is recorded as a timeline entry, which is exactly what the
 * "AI Team" screen renders.
 */

let seq = 0;

export class Blackboard {
  constructor({ brief }) {
    this.runId = `run_${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
    this.startedAt = Date.now();
    this.brief = brief;

    /** @type {Array<object>} everything the UI needs, in order */
    this.timeline = [];
    /** @type {Array<{name:string, at:number, payload?:object}>} product telemetry */
    this.telemetry = [];
    this.artifacts = {};
    this.agents = new Map();
  }

  register(agent) {
    this.agents.set(agent.id, agent);
    return agent;
  }

  listAgents() {
    return [...this.agents.values()];
  }

  /** Emit a product-analytics style event (the return-loop telemetry). */
  emit(name, payload = {}) {
    this.telemetry.push({ name, at: Date.now() - this.startedAt, payload });
    return name;
  }

  /**
   * Record one step of agent work.
   * @param {object} entry
   * @param {string} entry.agentId
   * @param {'working'|'waiting'|'complete'|'flagged'|'rewritten'} [entry.status]
   * @param {string} entry.title short human sentence for the timeline
   * @param {string} [entry.detail] supporting sentence
   * @param {string[]} [entry.citations] `file#section` evidence ids
   * @param {'normal'|'flag'|'repair'|'approve'|'question'} [entry.kind]
   * @param {object} [entry.payload] structured output for the UI to render
   */
  step(entry) {
    const agent = this.agents.get(entry.agentId);
    const item = {
      seq: ++seq,
      at: Date.now() - this.startedAt,
      agentId: entry.agentId,
      agentName: agent ? agent.name : entry.agentId,
      emoji: agent ? agent.emoji : '•',
      role: agent ? agent.role : '',
      status: entry.status || 'complete',
      title: entry.title,
      detail: entry.detail || '',
      citations: entry.citations || [],
      kind: entry.kind || 'normal',
      payload: entry.payload || null,
    };
    this.timeline.push(item);
    return item;
  }

  /** Write a named artefact other agents (and the UI) depend on. */
  put(key, value) {
    this.artifacts[key] = value;
    return value;
  }

  get(key, fallback = null) {
    return key in this.artifacts ? this.artifacts[key] : fallback;
  }

  /** Final status per agent, for the team roster on screen. */
  teamRoster() {
    const last = new Map();
    for (const item of this.timeline) last.set(item.agentId, item);
    return this.listAgents().map((agent) => {
      const item = last.get(agent.id);
      return {
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        role: agent.role,
        blurb: agent.blurb,
        status: item ? item.status : 'queued',
        summary: item ? item.title : 'Waiting for its turn',
        at: item ? item.at : null,
        flagged: item ? item.kind === 'flag' : false,
      };
    });
  }

  snapshot() {
    return {
      runId: this.runId,
      brief: this.brief,
      durationMs: Date.now() - this.startedAt,
      timeline: this.timeline,
      telemetry: this.telemetry,
      team: this.teamRoster(),
      ...this.artifacts,
    };
  }
}
