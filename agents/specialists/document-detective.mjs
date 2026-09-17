/**
 * Document Detective — ring 2 (tax).
 *
 * Finds and identifies documents in the synthetic pack, then tries to make each
 * one boring: what is it, what does it say, what is still unconfirmed. It is
 * also the agent that surfaces the demo's intentional conflict instead of
 * quietly picking whichever value looks better.
 *
 * The conflict is read out of the document's own fields, not hardcoded here —
 * if the receipt ever stops disagreeing with the user, this agent stops
 * reporting a conflict, and the self-test fails loudly.
 */

import { yamlBlock, evidence, firstSentence } from '../grounding.mjs';
import { REPAIR } from '../demo-script.mjs';

/** document_type → icon, plain-language label, and why it matters. */
const TYPES = {
  employment_tax_statement: {
    icon: '📄',
    label: 'Employment tax statement',
    relevance: 'Your salary and the tax already taken off it — the backbone of the return.',
  },
  purchase_receipt: {
    icon: '💻',
    label: 'Purchase receipt',
    relevance: 'Work equipment that may be relevant — but only once the mixed use is confirmed.',
  },
  freelance_invoice: {
    icon: '🧾',
    label: 'Freelance invoice',
    relevance: 'Side income that has to sit alongside your employment income.',
  },
  official_letter: {
    icon: '✉️',
    label: 'Letter from the tax office',
    relevance: 'Read this one first. Sometimes it is routine; sometimes it has a deadline in it.',
  },
  bank_transaction: {
    icon: '🏦',
    label: 'Bank statement line',
    relevance: 'Useful context for a possible cost, but not proof on its own without a receipt.',
  },
};

const AMOUNT_KEYS = ['amount_eur', 'total_eur', 'gross_salary_eur'];
const DATE_KEYS = ['purchase_date', 'invoice_date', 'letter_date', 'entry_date'];
const NICE_DATE = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return iso || null;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
};

const firstOf = (fields, keys) => keys.map((k) => fields[k]).find((v) => v !== undefined && v !== null);

export const documentDetective = {
  id: 'document-detective',
  name: 'Document Detective',
  emoji: '🔍',
  role: 'Identifies documents and marks what is still unconfirmed',
  blurb: 'Turns a pile of paper into named, checkable records.',

  async run(bb, { kb }) {
    const chunks = kb.chunks.filter(
      (c) => c.file === 'demo_documents.md' && c.heading.toLowerCase() !== 'overview',
    );
    const policyChunks = kb.search('identify document confirm unclear value do not infer unverified', {
      k: 2,
      prefer: ['tax_basics', 'demo_documents'],
    });

    const documents = [];
    let userRecord = {};

    for (const chunk of chunks) {
      const fields = yamlBlock(chunk.text);
      if (!fields || !Object.keys(fields).length) continue;

      // The persona block, not a document.
      if (fields.display_name || /user profile|persona/i.test(chunk.heading)) {
        userRecord = {
          name: fields.display_name,
          age: fields.age,
          occupation: fields.occupation,
          sideActivity: fields.side_activity,
          confidenceBefore: fields.confidence_before,
          declaredGoal: fields.declared_goal,
          anxieities: fields.known_anxieties,
          citation: chunk.id,
        };
        continue;
      }

      if (fields.synthetic !== true) continue; // never ingest an unflagged record

      const type = fields.document_type || 'unknown';
      const meta = TYPES[type] || { icon: '📎', label: chunk.heading, relevance: 'Identified, awaiting your confirmation.' };
      const headingLabel = chunk.heading.split(/[—–-]/)[0].trim();

      documents.push({
        id: `doc_${documents.length + 1}`,
        type,
        label: meta.label,
        heading: chunk.heading,
        shortLabel: headingLabel,
        icon: meta.icon,
        fields,
        citation: chunk.id,
        relevance: meta.relevance,
        status: fields.status || 'unconfirmed',
        confirmed: /recorded|confirmed/i.test(String(fields.status || '')),
        amount: firstOf(fields, AMOUNT_KEYS),
        date: firstOf(fields, DATE_KEYS),
        dateLabel: NICE_DATE(firstOf(fields, DATE_KEYS)),
        summary: firstSentence(chunk.text.replace(/```ya?ml[\s\S]*?```/g, ''), 200),
      });
    }

    // ── Conflict detection, driven by the document's own fields ──────────────
    const conflicted = documents.find(
      (d) => d.fields.conflict === true || (d.fields.receipt_note && d.fields.customer_stated_use),
    );

    const conflict = conflicted
      ? {
          id: 'laptop-use-conflict',
          documentId: conflicted.id,
          documentLabel: conflicted.label,
          citation: conflicted.citation,
          documentSays: String(conflicted.fields.receipt_note || REPAIR.conflict.documentSays),
          userClaim: String(conflicted.fields.customer_stated_use || REPAIR.conflict.userClaim),
          why: REPAIR.conflict.why,
          severity: 'Medium',
          detectedBy: 'Document Detective',
          requiredAction: 'Ask one neutral question. Do not average, prefer, or infer a value.',
          resolved: false,
          resolution: null,
        }
      : null;

    const artifact = {
      user: userRecord,
      documents,
      confirmedCount: documents.filter((d) => d.confirmed).length,
      openCount: documents.filter((d) => !d.confirmed).length,
      conflict,
      readingTimeSaved: `${documents.length * 4} minutes of document-sorting avoided`,
      safetyNote: 'Every record is explicitly flagged synthetic; any record that is not is skipped.',
      policy:
        firstSentence(policyChunks[0] ? policyChunks[0].text : '', 200) ||
        'If a value is unclear, ask the user to confirm it. Never infer a number from an unclear document.',
      evidence: evidence([...chunks.slice(1, 3), ...policyChunks]).slice(0, 3),
    };

    bb.put('documents', artifact);
    bb.emit('document_saved', { count: documents.length });

    bb.step({
      agentId: this.id,
      status: 'complete',
      title: `Found and named ${documents.length} documents`,
      detail: laptopDetail(documents, conflict),
      citations: documents.slice(0, 3).map((d) => d.citation),
      payload: {
        type: 'documents',
        documents: documents.map((d) => ({
          id: d.id,
          icon: d.icon,
          label: d.label,
          relevance: d.relevance,
          status: d.status,
          confirmed: d.confirmed,
          amount: d.amount,
          dateLabel: d.dateLabel,
          citation: d.citation,
        })),
      },
    });

    if (conflict) {
      bb.step({
        agentId: this.id,
        status: 'waiting',
        kind: 'question',
        title: 'Stopped instead of guessing on one field',
        detail: `The receipt says "${conflict.documentSays}", but your answer said "${conflict.userClaim}".`,
        citations: [conflict.citation],
        payload: { type: 'conflict', conflict },
      });
    }

    return artifact;
  },
};

function laptopDetail(documents, conflict) {
  if (conflict) {
    const d = documents.find((x) => x.id === conflict.documentId);
    return `One needs your input: the ${String(d ? d.label : 'receipt').toLowerCase()} is recorded as mixed use.`;
  }
  return 'All documents identified and filed.';
}
