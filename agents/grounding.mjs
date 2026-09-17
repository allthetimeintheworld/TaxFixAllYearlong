/**
 * grounding.mjs — small text utilities shared by the specialists.
 *
 * Every deterministic agent uses these to pull real sentences out of the
 * synthetic RAG pack instead of inventing copy. When a helper cannot find what
 * it needs it returns a safe, clearly-generic fallback rather than a
 * hallucinated fact.
 */

/** Pull the first fenced ```yaml block out of a markdown chunk and parse it. */
export function yamlBlock(text) {
  const match = /```ya?ml\s*\n([\s\S]*?)```/.exec(text || '');
  if (!match) return {};
  const out = {};
  for (const line of match[1].split('\n')) {
    const m = /^\s*([A-Za-z0-9_]+)\s*:\s*(.+?)\s*$/.exec(line);
    if (!m) continue;
    let value = m[2].replace(/^["']|["']$/g, '');
    if (/^-?\d+$/.test(value)) value = Number(value);
    else if (/^-?\d+\.\d+$/.test(value)) value = Number(value);
    else if (/^(true|false)$/i.test(value)) value = value.toLowerCase() === 'true';
    else if (/^\[.*\]$/.test(value)) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    out[m[1]] = value;
  }
  return out;
}

/** Extract `- ` bullet lines from a chunk, cleaned. */
export function bullets(text, limit = 12) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+\S/.test(l))
    .map((l) => l.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean)
    .slice(0, limit);
}

/** Extract `> ` blockquote lines from a chunk, joined into one paragraph. */
export function blockquote(text) {
  const lines = String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('>'))
    .map((l) => l.replace(/^>\s?/, '').trim())
    .filter(Boolean);
  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

/** First sentence of a chunk body, with markdown noise removed. */
export function firstSentence(text, max = 240) {
  const clean = String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^[#>\-*\s]+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return '';
  const sentence = clean.split(/(?<=[.!?])\s+/)[0] || clean;
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}

/** Grab a paragraph that follows a bold label like `**Insight**` or `Insight:`. */
export function labelled(text, label) {
  const src = String(text || '');
  const patterns = [
    new RegExp(`\\*\\*${label}\\*\\*\\s*:?\\s*([^\\n]+)`, 'i'),
    new RegExp(`^\\s*${label}\\s*:\\s*([^\\n]+)`, 'im'),
  ];
  for (const re of patterns) {
    const m = re.exec(src);
    if (m) return m[1].replace(/\*\*/g, '').trim();
  }
  return '';
}

/** All paragraphs of a chunk body, excluding headings and fences. */
export function paragraphs(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, '\n\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/^[#>\-*\s]+/gm, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 40);
}

/** Take the most "contentful" paragraph when nothing more specific matches. */
export function bestParagraph(text) {
  const all = paragraphs(text);
  if (!all.length) return firstSentence(text);
  return all.sort((a, b) => b.length - a.length)[0];
}

/** Title-case a heading-ish string into a chip label. */
export function titleCase(value) {
  return String(value || '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

/** Normalise a set of retrieved chunks into compact citation records. */
export function evidence(chunks) {
  return chunks.map((c) => ({
    id: c.id,
    file: c.file,
    doc: c.doc,
    heading: c.heading,
    snippet: firstSentence(c.text, 180),
    score: c.score,
  }));
}
