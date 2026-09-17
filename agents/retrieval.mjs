/**
 * retrieval.mjs — tiny, dependency-free markdown retriever.
 *
 * The synthetic RAG pack is plain markdown where every `## ` heading starts a
 * chunk. This module loads the pack once and scores chunks against a query
 * with a keyword/BM25-ish scheme. It is deliberately simple: no embeddings, no
 * network, no install. The point of the prototype is that every sentence an
 * agent says can be traced back to `file#section-heading`.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'than', 'that', 'this',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am', 'do', 'does', 'did',
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'as', 'from',
  'it', 'its', 'i', 'you', 'your', 'we', 'our', 'they', 'their', 'he', 'she',
  'my', 'me', 'us', 'them', 'can', 'could', 'should', 'would', 'will', 'may',
  'might', 'must', 'shall', 'not', 'no', 'yes', 'so', 'such', 'there', 'here',
  'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'only', 'own',
  'same', 'too', 'very', 'just', 'also', 'have', 'has', 'had', 'get', 'got',
]);

/** Simple deterministic stemmer: strips common English suffixes. */
function stem(word) {
  return word
    .replace(/(ations?|ments?|ings?|ness|ities|ally|edly)$/, '')
    .replace(/(ies)$/, 'y')
    .replace(/(es|s)$/, '')
    .replace(/(ed|ing|ly)$/, '');
}

export function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[`*_>#\[\]()|]/g, ' ')
    .split(/[^a-z0-9äöüß€%]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem)
    .filter(Boolean);
}

function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Split one markdown document into retrievable chunks keyed by `## ` headings.
 * Content before the first `## ` becomes an `overview` chunk.
 */
function chunkDocument(file, raw) {
  const lines = raw.split('\n');
  const chunks = [];
  let current = { heading: 'Overview', body: [] };
  let h1 = basename(file, '.md');

  for (const line of lines) {
    if (line.startsWith('# ')) {
      h1 = line.slice(2).trim();
      continue;
    }
    if (line.startsWith('## ')) {
      chunks.push(current);
      current = { heading: line.slice(3).trim(), body: [] };
      continue;
    }
    current.body.push(line);
  }
  chunks.push(current);

  return chunks
    .filter((c) => c.body.join('').trim().length > 0)
    .map((c) => {
      const text = c.body.join('\n').trim();
      return {
        id: `${file}#${slugify(c.heading)}`,
        file,
        doc: h1,
        heading: c.heading,
        text,
        tokens: tokenize(`${c.heading} ${c.heading} ${text}`),
      };
    });
}

export class KnowledgeBase {
  constructor(chunks) {
    this.chunks = chunks;
    this.byId = new Map(chunks.map((c) => [c.id, c]));
    // document frequency for a light IDF weighting
    this.df = new Map();
    for (const chunk of chunks) {
      for (const term of new Set(chunk.tokens)) {
        this.df.set(term, (this.df.get(term) || 0) + 1);
      }
    }
  }

  static async load(dir) {
    const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort();
    const chunks = [];
    for (const file of files) {
      const raw = await readFile(join(dir, file), 'utf8');
      chunks.push(...chunkDocument(file, raw));
    }
    return new KnowledgeBase(chunks);
  }

  get size() {
    return this.chunks.length;
  }

  /**
   * @param {string} query
   * @param {{k?: number, prefer?: string[]}} [opts] `prefer` boosts chunk ids
   *   whose file matches one of the given file names (without .md).
   */
  search(query, opts = {}) {
    const { k = 4, prefer = [] } = opts;
    const terms = tokenize(query);
    const N = this.chunks.length;
    const scored = this.chunks.map((chunk) => {
      const counts = new Map();
      for (const t of chunk.tokens) counts.set(t, (counts.get(t) || 0) + 1);

      let score = 0;
      for (const term of terms) {
        const tf = counts.get(term) || 0;
        if (!tf) continue;
        const idf = Math.log(1 + N / (1 + (this.df.get(term) || 0)));
        score += (1 + Math.log(tf)) * idf;
      }
      const docName = chunk.file.replace(/\.md$/, '');
      if (prefer.includes(docName)) score *= 1.6;
      if (terms.some((t) => tokenize(chunk.heading).includes(t))) score *= 1.35;
      return { chunk, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
      .slice(0, k)
      .map((s) => ({ ...s.chunk, score: Number(s.score.toFixed(3)) }));
  }

  /** Retrieve a single known section by id, useful for citing fixed policy. */
  get(id) {
    return this.byId.get(id) || null;
  }

  /**
   * Resolve a citation id leniently. Exact match first, then the same file with
   * a heading that starts with (or contains) the requested slug. This keeps a
   * hand-written citation from dangling just because a heading was reworded,
   * while still failing on a genuinely invented reference.
   */
  resolve(id) {
    if (!id) return null;
    if (this.byId.has(id)) return this.byId.get(id);

    const [file, slug = ''] = String(id).split('#');
    const wanted = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!wanted) return null;

    const sameFile = this.chunks.filter((c) => c.file === file);
    const slugOf = (c) => c.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const prefix = sameFile.find((c) => slugOf(c).startsWith(wanted) || wanted.startsWith(slugOf(c)));
    if (prefix) return prefix;

    const wantedTerms = new Set(wanted.split('-').filter((t) => t.length > 3));
    let best = null;
    let bestScore = 0;
    for (const chunk of sameFile) {
      const terms = new Set(slugOf(chunk).split('-').filter((t) => t.length > 3));
      let overlap = 0;
      for (const t of wantedTerms) if (terms.has(t)) overlap += 1;
      const ratio = wantedTerms.size ? overlap / wantedTerms.size : 0;
      if (ratio > bestScore) {
        bestScore = ratio;
        best = chunk;
      }
    }
    return bestScore >= 0.6 ? best : null;
  }

  /** True when a citation can be traced to a real section. */
  canResolve(id) {
    return Boolean(this.resolve(id));
  }
}

/** Compact citation label an agent can put in its output and the UI can render. */
export function cite(chunk) {
  return chunk ? chunk.id : 'unavailable';
}
