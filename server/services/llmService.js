/**
 * Unified LLM & AI Service for INNOFIX AI
 *
 * AI features run on a local Ollama model if OLLAMA_MODEL is set, else Google Gemini if GEMINI_API_KEY
 * is set, else instant zero-crash offline logic.
 */
const https = require('https');

// Local Cache for AI queries to minimize latency and API calls
const aiCache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 mins

function getCached(key) {
  const item = aiCache.get(key);
  if (item && Date.now() - item.time < CACHE_TTL) {
    return item.data;
  }
  return null;
}

function setCache(key, data) {
  if (aiCache.size > 500) {
    const firstKey = aiCache.keys().next().value;
    aiCache.delete(firstKey);
  }
  aiCache.set(key, { data, time: Date.now() });
}

/* ------------------------------------------------------------------ */
/* LLM providers, tried in order:                                      */
/*   1. Ollama  (local, free)  - only if OLLAMA_MODEL is set           */
/*   2. Gemini  (cloud)        - only if GEMINI_API_KEY is set         */
/*   3. offline fallback       - each feature's built-in logic         */
/* ------------------------------------------------------------------ */

const ollamaModel = () => (process.env.OLLAMA_MODEL || '').trim();
const ollamaUrl = () => (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const geminiModel = () => (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
const geminiAllowed = () => Boolean(process.env.GEMINI_API_KEY);

// Moderation runs on every post/comment, so the (slower) local model only joins in when OLLAMA_MODERATION=true.
const localAllowed = (moderation) =>
  Boolean(ollamaModel()) && (!moderation || process.env.OLLAMA_MODERATION === 'true');

/** True when at least one real LLM provider can serve this kind of request. */
function aiEnabled({ moderation = false } = {}) {
  return localAllowed(moderation) || geminiAllowed();
}

async function timedFetch(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Local model through Ollama's chat API (free, offline). */
async function callOllama(prompt, systemInstruction, jsonMode) {
  const model = ollamaModel();
  try {
    const res = await timedFetch(
      `${ollamaUrl()}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          keep_alive: '30m', // keep the model in memory so only the first call is slow
          ...(jsonMode ? { format: 'json' } : {}),
          options: { temperature: 0.3, num_predict: 700 },
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt },
          ],
        }),
      },
      Number(process.env.OLLAMA_TIMEOUT_MS) || 60000 // a 3B model on CPU can need a while
    );

    if (!res.ok) {
      console.warn(`[AI] Ollama returned status ${res.status} for model "${model}" (is it installed? run: ollama pull ${model})`);
      return null;
    }
    const data = await res.json();
    const text = String((data.message && data.message.content) || '')
      .replace(/<think>[\s\S]*?<\/think>/g, '') // some reasoning models print their thinking
      .trim();
    return text || null;
  } catch (err) {
    console.warn(
      `[AI] Ollama not reachable at ${ollamaUrl()} (${err.name === 'AbortError' ? 'timed out' : err.message}), trying next provider`
    );
    return null;
  }
}

/** Google Gemini API. The model is configurable: the old hard-coded gemini-1.5-flash has been retired (404). */
async function callGemini(prompt, systemInstruction, jsonMode) {
  const model = geminiModel();
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      // 2.5 Flash "thinks" by default and thinking tokens eat the output budget: off for short JSON replies
      ...(/gemini-2\.5-flash/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  };
  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  try {
    const res = await timedFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify(payload),
      },
      Number(process.env.GEMINI_TIMEOUT_MS) || 10000
    );

    if (!res.ok) {
      console.warn(
        `[AI] Gemini returned status ${res.status} for model "${model}"` +
          (res.status === 404 ? ' (model retired or misspelt: set GEMINI_MODEL)' : '') +
          ', using offline fallback'
      );
      return null;
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.warn('[AI] Gemini call timed out or failed, using offline fallback');
    return null;
  }
}

let announced = false;
function announceProviders() {
  if (announced) return;
  announced = true;
  const chain = [ollamaModel() && `Ollama (${ollamaModel()})`, geminiAllowed() && `Gemini (${geminiModel()})`, 'offline fallback'];
  console.log(`[AI] Engines in order: ${chain.filter(Boolean).join(' -> ')}`);
}

/** Run a prompt through the provider chain. Resolves { text, provider } or null when nothing answered. */
async function generate(prompt, systemInstruction = '', jsonMode = false, { moderation = false } = {}) {
  announceProviders();
  const cacheKey = `${jsonMode}:${systemInstruction}:::${prompt}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const remember = (result) => {
    setCache(cacheKey, result);
    return result;
  };

  if (localAllowed(moderation)) {
    const text = await callOllama(prompt, systemInstruction, jsonMode);
    if (text) return remember({ text, provider: 'ollama' });
  }
  if (geminiAllowed()) {
    const text = await callGemini(prompt, systemInstruction, jsonMode);
    if (text) return remember({ text, provider: 'gemini' });
  }
  return null;
}

/** Same as generate() but resolves just the text (null => use the offline fallback). */
async function callLLM(prompt, systemInstruction = '', jsonMode = false, opts = {}) {
  const result = await generate(prompt, systemInstruction, jsonMode, opts);
  return result ? result.text : null;
}

/* ------------------------------------------------------------------ */
/* AI Content Moderation Guard (Toxicity & Spam Engine)               */
/* ------------------------------------------------------------------ */

const TOXIC_PATTERNS = [
  /\b(hate|kill|stupid|idiot|scam|fraud|abuse|fake|garbage|loser|trash|bitch|bastard|asshole|fucker|dick)\b/i,
  /\b(crypto\s*airdrop|free\s*money|telegram\s*link|whatsapp\s*\+?\d{8,}|earn\s*\$?\d+k\s*daily)\b/i,
  /\b(buy\s*followers|get\s*rich\s*quick|click\s*here\s*now|viagra|casino)\b/i,
];

const SPAM_PATTERNS = [
  /https?:\/\/[^\s]+.*https?:\/\/[^\s]+/i, // multiple URLs
  /(.)\1{6,}/, // excessive character repetition
  /(\b\w+\b)(?:\s+\1){3,}/i, // repeated words
];

async function scoreContentModeration(text) {
  const content = String(text || '').trim();
  if (!content) {
    return { isSafe: true, status: 'approved', toxicityScore: 0, spamScore: 0, reason: '' };
  }

  // Fast offline regex heuristic check
  let toxicHits = 0;
  let spamHits = 0;

  TOXIC_PATTERNS.forEach((p) => {
    if (p.test(content)) toxicHits += 1;
  });

  SPAM_PATTERNS.forEach((p) => {
    if (p.test(content)) spamHits += 1;
  });

  const localToxicityScore = Math.min(toxicHits * 45, 95);
  const localSpamScore = Math.min(spamHits * 40, 90);

  // If an LLM is configured (Gemini, or a local model when OLLAMA_MODERATION=true), use it for contextual toxicity
  if (aiEnabled({ moderation: true })) {
    const prompt = `Analyze this user text for toxicity, harassment, hate speech, or spam.
Respond strictly in JSON format:
{
  "toxicityScore": <number between 0 and 100>,
  "spamScore": <number between 0 and 100>,
  "flag": <"approved" | "flagged" | "blocked">,
  "reason": <brief 1 sentence explanation>
}
Text to analyze:
"${content}"`;

    const aiRes = await callLLM(prompt, 'You are an AI content safety moderator.', true, { moderation: true });
    if (aiRes) {
      try {
        const parsed = JSON.parse(aiRes);
        return {
          isSafe: parsed.flag === 'approved',
          status: parsed.flag || 'approved',
          toxicityScore: parsed.toxicityScore || localToxicityScore,
          spamScore: parsed.spamScore || localSpamScore,
          reason: parsed.reason || 'AI automated evaluation',
        };
      } catch (e) {
        // Fall through to heuristic
      }
    }
  }

  // Heuristic rule determination
  let status = 'approved';
  let reason = '';

  if (localToxicityScore >= 80 || localSpamScore >= 80) {
    status = 'blocked';
    reason = localToxicityScore >= 80 ? 'Flagged for offensive language or harassment' : 'Detected automated spam pattern';
  } else if (localToxicityScore >= 40 || localSpamScore >= 40) {
    status = 'flagged';
    reason = 'Contains sensitive terms requiring community moderation';
  }

  return {
    isSafe: status === 'approved',
    status,
    toxicityScore: localToxicityScore,
    spamScore: localSpamScore,
    reason,
  };
}

/* ---- writer-helper safety: clean the model's text and refuse invented facts ---- */

const STOPWORDS = new Set(('a an and are as at be but by for from has have i in into is it its of on or our that the their this to we with you your was will would about using use used build building make making want wants need needs project idea app also very more some any can could just like get got one two new not no yes than then them they these those who what when where which while').split(' '));

// Technologies and buzzwords a small model likes to add on its own; they are only allowed if the author wrote them.
const CLAIM_WORDS = new Set(('react vue angular svelte node express django flask fastapi spring laravel rails mongodb mysql postgresql postgres sqlite redis firebase supabase graphql docker kubernetes aws azure gcp terraform jenkins python java javascript typescript kotlin swift rust golang php ruby tensorflow pytorch keras opencv arduino esp32 raspberry blockchain ethereum solidity flutter android ios unity unreal figma ai ml iot cloud llm gpt').split(' '));

function withinOneEdit(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
    } else {
      edits += 1;
      if (edits > 1) return false;
      if (a.length > b.length) i += 1;
      else if (a.length < b.length) j += 1;
      else {
        i += 1;
        j += 1;
      }
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** Lower-case word keys; "Node.js" and "nodejs" both become "node". */
function wordKeys(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[\s,;:|/()\-–—"'“”!?]+/)
    .map((t) => t.replace(/^[.]+|[.]+$/g, '').replace(/\./g, ''))
    .map((t) => (t.length > 4 ? t.replace(/js$/, '') : t))
    .filter((t) => t.length >= 2);
}

const knownWord = (keys, w) => keys.includes(w) || (w.length >= 5 && keys.some((k) => k.length >= 5 && withinOneEdit(k, w)));

/** True when `output` mentions numbers or technologies that do not appear in `source` (a hallucination). */
function inventsFacts(output, source) {
  const src = String(source || '').toLowerCase();
  const numbers = String(output || '').match(/\d+(?:[.,]\d+)?/g) || [];
  if (numbers.some((n) => !src.includes(n))) return true;
  const srcKeys = wordKeys(src);
  return wordKeys(output).some((w) => CLAIM_WORDS.has(w) && !knownWord(srcKeys, w));
}

const oneLine = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** Plain text only: the UI does not render markdown, so stray ** and # would show up literally. */
const plainText = (v, max) =>
  (typeof v === 'string' ? v : '')
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);

function cleanTags(list, source) {
  const srcKeys = wordKeys(source);
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .map((t) => String(t || '').toLowerCase().replace(/^#/, '').replace(/[^a-z0-9]/g, ''))
    .filter((t) => t.length >= 2 && t.length <= 20)
    .filter((t) => !CLAIM_WORDS.has(t) || knownWord(srcKeys, t))
    .filter((t) => (seen.has(t) ? false : seen.add(t)))
    .slice(0, 5);
}

const cleanTips = (list) =>
  (Array.isArray(list) ? list : []).map((t) => oneLine(t, 160)).filter(Boolean).slice(0, 3);

const capitalise = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/** Offline tidy-up of the author's OWN words (no invented claims). */
function tidyDraft(text) {
  let t = String(text || '').replace(/\s+/g, ' ').trim();
  t = t.replace(/^(it|this)\s+(would|will|is|was)\s+(be\s+)?(about|for)?\s*/i, ''); // "it would be about ..." filler
  t = capitalise(t);
  return t && !/[.!?]$/.test(t) ? `${t}.` : t;
}

function tagsFromText(text) {
  const seen = new Set();
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => (w.length >= 4 || CLAIM_WORDS.has(w)) && !STOPWORDS.has(w))
    .filter((w) => (seen.has(w) ? false : seen.add(w)))
    .slice(0, 4);
}

/* ------------------------------------------------------------------ */
/* AI Assistant: Profile Bio & Headline Optimizer                     */
/* ------------------------------------------------------------------ */

/** Accept only a well-formed bio result (small local models rename keys, return non-strings or invent facts). */
function normalizeBioResult(raw, source) {
  if (!raw || typeof raw !== 'object') return null;
  const enhancedHeadline = oneLine(raw.enhancedHeadline || raw.headline, 100);
  const enhancedBio = plainText(raw.enhancedBio || raw.bio, 600).replace(/\n+/g, ' ');
  if (enhancedHeadline.length < 3 || enhancedBio.length < 20) return null;
  if (inventsFacts(`${enhancedHeadline} ${enhancedBio}`, source)) return null;
  return { enhancedHeadline, enhancedBio, suggestions: cleanTips(raw.suggestions) };
}

async function improveProfileBio({ headline, bio, skills }) {
  const skillList = (Array.isArray(skills) ? skills : String(skills || '').split(','))
    .map((x) => String(x).trim())
    .filter(Boolean);
  const currentSkills = skillList.join(', ');
  const source = `${headline || ''} ${bio || ''} ${currentSkills}`;

  if (aiEnabled()) {
    const prompt = `Improve this student's profile so it reads clearly and professionally to teammates and recruiters.
Current headline: "${String(headline || '').slice(0, 150)}"
Current bio: "${String(bio || '').slice(0, 600)}"
Skills: "${currentSkills.slice(0, 300)}"

Rules:
- Use ONLY facts given above. Never invent employers, degrees, years, numbers, tools or achievements.
- Keep the student's own meaning. Fix wording and spelling (also obvious skill typos), do not change what they said.
- Headline: at most 12 words, no emojis.
- Bio: 2 to 3 plain sentences in the first person. Mention their strongest listed skills and end with what they want to collaborate on. No markdown.
- Suggestions: 2 short tips naming specific details the student could add.

Respond strictly in JSON:
{"enhancedHeadline": "...", "enhancedBio": "...", "suggestions": ["...", "..."]}`;

    const gen = await generate(prompt, 'You are a careful career coach for university students.', true);
    if (gen) {
      try {
        const clean = normalizeBioResult(JSON.parse(gen.text), source);
        if (clean) return { ...clean, engine: gen.provider };
      } catch (e) {
        // fall through to the offline tidy-up
      }
    }
  }

  // Offline fallback: tidy what the student wrote and only add facts from their own profile.
  const topSkills = skillList.slice(0, 3).join(', ');
  const fallbackHeadline = tidyDraft(headline).replace(/\.$/, '') || (topSkills ? `Builder working with ${topSkills}` : 'Aspiring builder');
  const bioText = tidyDraft(bio);
  const skillSentence = topSkills ? ` I work with ${topSkills}.` : '';
  const fallbackBio = bioText.length > 20
    ? `${bioText}${skillSentence && !bioText.toLowerCase().includes(skillList[0].toLowerCase()) ? skillSentence : ''}`
    : `${topSkills ? `I work with ${topSkills}. ` : ''}I am looking to collaborate on projects and learn from other builders.`;

  return {
    engine: 'templates',
    enhancedHeadline: fallbackHeadline,
    enhancedBio: fallbackBio.trim(),
    suggestions: [
      'Add one concrete project you built, with a link.',
      'Say which role you want on a team (frontend, backend, design, research).',
    ],
  };
}

/* ------------------------------------------------------------------ */
/* AI Assistant: Post / Pitch Rewriter                                */
/* ------------------------------------------------------------------ */

/** Accept only a well-formed pitch result: plain text, no invented facts, sensible length. */
function normalizePitchResult(raw, source) {
  if (!raw || typeof raw !== 'object') return null;
  const title = oneLine(raw.title, 80);
  const full = plainText(raw.pitch || raw.enhancedPitch, 4000); // measure BEFORE trimming, so padding cannot hide
  if (full.length < 25) return null;
  const srcWords = String(source || '').split(/\s+/).filter(Boolean).length;
  if (full.split(/\s+/).length > Math.max(70, srcWords * 4)) return null; // padded with filler
  const pitch = full.slice(0, 700);
  if (inventsFacts(`${title} ${full}`, source)) return null;
  return {
    enhancedPitch: title ? `${title}\n\n${pitch}` : pitch,
    keyStrengths: [],
    suggestedTags: cleanTags(raw.tags || raw.suggestedTags, source),
    suggestions: cleanTips(raw.suggestions),
  };
}

const PITCH_SYSTEM =
  'You are a careful editor for student innovators. You rewrite rough drafts into clear pitches ' +
  'using only the facts the author gave. You never add features, technologies, numbers, benefits ' +
  'or purposes the author did not state. You reply with valid JSON only.';

async function rewriteContentPitch({ content, targetType = 'project' }) {
  const draft = String(content || '').trim();

  if (aiEnabled() && draft) {
    const kind = targetType === 'post' ? 'post' : 'project';
    const prompt = `Rewrite the author's ${kind} draft as a clear, engaging pitch for an innovation network of students and companies.

RULES
1. Build the pitch ONLY from the draft. Never add features, technologies, numbers, results, users or benefits.
2. You MAY explain in plain words what each named part generally does (for example: a particle sensor detects particles, an IoT module connects a device to the internet). You MUST NOT say what the ${kind} is used for, who it helps, or what it achieves unless the draft says so.
3. Keep technical terms exactly as the draft writes them.
4. Remove filler such as "it would be about" and fix grammar. Use active, confident, plain language. No hype words (revolutionary, cutting-edge, seamless, powerful, real-time, AI-powered) unless the draft uses them.
5. Plain text only: no markdown, bullets or emojis.

OUTPUT FIELDS
- "title": at most 8 words, Title Case.
- "pitch": exactly 3 sentences, 35 to 60 words in total.
  Sentence 1: what it is.
  Sentence 2: how it works, using only the parts named in the draft.
  Sentence 3: invite teammates, naming only roles that the draft's technologies imply (a sensor suggests hardware or embedded developers, a web app suggests frontend or backend developers, a phone app suggests mobile developers).
- "tags": 3 to 5 lowercase single words taken from the draft's topics.
- "suggestions": 3 short questions the author should answer to strengthen the pitch (the problem it solves, who it helps, what is built so far). Questions only, no claims.

EXAMPLE (format and style guide only, never reuse its words or topic)
Draft: """a plant pot with a moisture sensor and a small pump, controlled from a phone"""
Output: {"title": "Self-Watering Smart Plant Pot", "pitch": "A smart plant pot that looks after its own watering. A moisture sensor checks the soil and a small pump delivers water, all controlled from a phone. We are looking for hardware and mobile developers to build it with us.", "tags": ["plant", "moisture", "sensor", "pump", "phone"], "suggestions": ["Which plants or growers is it designed for?", "How far along is the prototype?", "Do you already have the parts, or do you need help sourcing them?"]}

NOW THE REAL TASK
Draft: """${draft.slice(0, 1200)}"""
Output:`;

    const gen = await generate(prompt, PITCH_SYSTEM, true);
    if (gen) {
      try {
        const clean = normalizePitchResult(JSON.parse(gen.text), draft);
        if (clean) return { ...clean, engine: gen.provider };
      } catch (e) {
        // fall through to the offline tidy-up
      }
    }
  }

  // Offline fallback: tidy the author's own words. Nothing is added that they did not say.
  return {
    engine: 'templates',
    enhancedPitch: tidyDraft(draft),
    keyStrengths: [],
    suggestedTags: tagsFromText(draft),
    suggestions: [
      'What problem does it solve, and who has it?',
      'Which roles or skills do you need on the team?',
      'What have you built or planned so far?',
    ],
  };
}

/* ------------------------------------------------------------------ */
/* AI Assistant: Thread Summarizer                                    */
/* ------------------------------------------------------------------ */

async function summarizeThread(comments) {
  if (!comments || comments.length === 0) {
    return { summary: 'No discussion comments yet.', keyTakeaways: [], sentiment: 'Neutral' };
  }

  const threadText = comments
    .map((c) => `${c.user?.fullName || 'User'}: ${c.content}`)
    .join('\n');

  if (aiEnabled()) {
    const prompt = `Summarize this discussion thread into concise takeaways.
Comments:
${threadText}

Respond in JSON:
{
  "summary": "<2-sentence summary>",
  "keyTakeaways": ["<point 1>", "<point 2>"],
  "sentiment": "<Positive | Constructive | Inquisitive>"
}`;

    const res = await callLLM(prompt, 'You are an executive meeting & thread summarizer.', true);
    if (res) {
      try {
        return JSON.parse(res);
      } catch (e) {}
    }
  }

  return {
    summary: `Discussion with ${comments.length} contributor${comments.length > 1 ? 's' : ''} actively exploring project implementation details and collaboration opportunities.`,
    keyTakeaways: [
      `${comments.length} total perspectives shared`,
      'Active interest in project roles and architecture',
    ],
    sentiment: 'Constructive & Collaborative',
  };
}

/* ------------------------------------------------------------------ */
/* AI Team Matcher & Skill Synergy Analyzer                           */
/* ------------------------------------------------------------------ */

async function analyzeTeamMatch({ applicantSkills = [], projectRequiredSkills = [], applicantBio = '' }) {
  const normAppSkills = applicantSkills.map((s) => s.toLowerCase().trim());
  const normReqSkills = projectRequiredSkills.map((s) => s.toLowerCase().trim());

  const matched = projectRequiredSkills.filter((s) =>
    normAppSkills.includes(s.toLowerCase().trim())
  );
  const missing = projectRequiredSkills.filter(
    (s) => !normAppSkills.includes(s.toLowerCase().trim())
  );

  const coverageScore = projectRequiredSkills.length > 0
    ? Math.round((matched.length / projectRequiredSkills.length) * 100)
    : 75;

  let rationale = `Applicant possesses ${matched.length} of ${projectRequiredSkills.length} requested core competencies (${matched.join(', ') || 'general web experience'}).`;

  if (aiEnabled() && projectRequiredSkills.length > 0) {
    const prompt = `Evaluate how well this candidate fits a collaborative team project.
Applicant Skills: ${applicantSkills.join(', ')}
Applicant Bio: ${applicantBio}
Project Required Skills: ${projectRequiredSkills.join(', ')}

Respond in JSON:
{
  "synergyScore": <number 0-100>,
  "rationale": "<1-2 sentence explanation of team fit and complementary strength>"
}`;

    const res = await callLLM(prompt, 'You are an AI technical team recruiter.', true);
    if (res) {
      try {
        const parsed = JSON.parse(res);
        return {
          fitScore: parsed.synergyScore || coverageScore,
          matchedSkills: matched,
          missingSkills: missing,
          recommendationReason: parsed.rationale || rationale,
        };
      } catch (e) {}
    }
  }

  return {
    fitScore: coverageScore,
    matchedSkills: matched,
    missingSkills: missing,
    recommendationReason: rationale,
  };
}

module.exports = {
  scoreContentModeration,
  improveProfileBio,
  rewriteContentPitch,
  summarizeThread,
  analyzeTeamMatch,
  generate,
  aiEnabled,
};