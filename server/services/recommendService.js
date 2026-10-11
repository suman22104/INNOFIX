/**
 * INNOFIX AI recommendation & social graph intelligence engine.
 *
 * Provides:
 * 1. Content-based cosine similarity scoring with TF-IDF vectors
 * 2. People You May Know (PYMK) graph & skill overlap algorithm
 * 3. Smart Feed Ranking with transparent "Why you see this" attribution
 * 4. Opportunity skill matching and Team fit scoring
 */
const Project = require('../models/Project');
const Event = require('../models/Event');
const Opportunity = require('../models/Opportunity');
const Community = require('../models/Community');
const User = require('../models/User');

/* ------------------------------------------------------------------ */
/* Text -> weighted term vectors                                       */
/* ------------------------------------------------------------------ */

const STOP = new Set(
  ('a an and are as at be been but by can for from has have how i in into is it its of on or our ' +
    'that the their this to was we were will with you your not more most new build building ' +
    'looking need needs want join using use used work working team teams project projects ' +
    'event events opportunity community learn help etc also any all one').split(' ')
);

const ALIASES = {
  'node.js': 'node',
  nodejs: 'node',
  'react.js': 'react',
  reactjs: 'react',
  'vue.js': 'vue',
  vuejs: 'vue',
  'next.js': 'nextjs',
  'express.js': 'express',
  expressjs: 'express',
  js: 'javascript',
  ts: 'typescript',
  ml: 'machine learning',
  ai: 'artificial intelligence',
  'ai/ml': 'machine learning',
  py: 'python',
  mongo: 'mongodb',
  postgres: 'postgresql',
  tailwindcss: 'tailwind',
  'tailwind css': 'tailwind',
  ui: 'ui/ux',
  ux: 'ui/ux',
};

const norm = (s) => {
  const t = String(s || '').toLowerCase().trim();
  return ALIASES[t] || t;
};

const words = (text, maxLen = 700) =>
  String(text || '')
    .slice(0, maxLen)
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((w) => w.replace(/^\.+|\.+$/g, ''))
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(norm);

const add = (vec, term, w) => {
  if (!term) return;
  vec.set(term, (vec.get(term) || 0) + w);
};

const addLabel = (vec, label, w) => {
  const phrase = norm(label);
  if (!phrase) return;
  add(vec, phrase, w);
  if (phrase.includes(' ') || phrase.includes('/')) {
    phrase.split(/[\s/&]+/).filter((x) => x.length > 1 && !STOP.has(x)).forEach((x) => add(vec, norm(x), w / 3));
  }
};

const addText = (vec, text, w, maxLen) => words(text, maxLen).forEach((t) => add(vec, t, w));

const labelsOf = (type, d) => {
  switch (type) {
    case 'project':
      return d.requiredSkills || [];
    case 'opportunity':
      return d.skills || [];
    case 'event':
    case 'community':
      return d.tags || [];
    default:
      return [];
  }
};

const categoryOf = (type, d) => (type === 'event' || type === 'opportunity' ? d.type : d.category);

function itemVector(type, d) {
  const v = new Map();
  labelsOf(type, d).forEach((l) => addLabel(v, l, 3));
  addLabel(v, categoryOf(type, d), 2);
  addText(v, type === 'community' ? d.name : d.title, 2, 200);
  if (type === 'opportunity') {
    (d.requirements || []).forEach((r) => addText(v, r, 1, 200));
  }
  addText(v, d.shortSummary || d.shortDescription || d.description, 1, 600);
  return v;
}

function cosine(a, b) {
  if (!a.size || !b.size) return 0;
  let dot = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const [t, w] of small) {
    const o = large.get(t);
    if (o) dot += w * o;
  }
  if (!dot) return 0;
  let na = 0;
  let nb = 0;
  for (const w of a.values()) na += w * w;
  for (const w of b.values()) nb += w * w;
  return dot / Math.sqrt(na * nb);
}

const squash = (c) => 1 - Math.exp(-4 * c);

/* ------------------------------------------------------------------ */
/* User profile                                                        */
/* ------------------------------------------------------------------ */

const idStr = (x) => String((x && x._id) || x || '');

function buildUserProfile(user, behavior) {
  const vec = new Map();
  const skillSet = new Set();
  const categories = new Set();

  (user.skills || []).forEach((s) => {
    addLabel(vec, s, 3);
    skillSet.add(norm(s));
  });
  addText(vec, user.headline, 2, 200);
  addText(vec, user.bio, 1, 500);

  const learn = (type, docs, w) =>
    (docs || []).forEach((d) => {
      labelsOf(type, d).forEach((l) => addLabel(vec, l, w));
      const c = categoryOf(type, d);
      if (c) {
        addLabel(vec, c, w * 0.75);
        categories.add(norm(c));
      }
    });

  learn('project', behavior.projects, 2);
  learn('event', behavior.events, 2);
  learn('community', behavior.communities, 2);
  learn('opportunity', behavior.opportunities, 2);
  learn('project', behavior.bookmarked?.project, 2);
  learn('event', behavior.bookmarked?.event, 2);
  learn('opportunity', behavior.bookmarked?.opportunity, 2);

  return { vec, skillSet, categories };
}

/* ------------------------------------------------------------------ */
/* Ranking & Smart Feed                                               */
/* ------------------------------------------------------------------ */

const DAY = 86400000;
const recencyBoost = (d, type) => {
  if (type === 'event' && d.startDate) {
    const days = (new Date(d.startDate) - Date.now()) / DAY;
    return days <= 0 ? 1 : Math.exp(-days / 30);
  }
  const age = (Date.now() - new Date(d.createdAt || Date.now())) / DAY;
  return Math.exp(-Math.max(age, 0) / 30);
};

const popularity = (type, d) => {
  const n =
    type === 'project'
      ? (d.likes?.length || 0) + (d.members?.length || 0) + (d.applications?.length || 0)
      : type === 'event'
      ? d.attendees?.length || 0
      : type === 'opportunity'
      ? d.applicants?.length || 0
      : d.members?.length || 0;
  return Math.min(Math.log1p(n) / Math.log1p(50), 1);
};

function reasonsFor(type, d, profile) {
  const out = [];
  const matched = labelsOf(type, d).filter((l) => profile.vec.has(norm(l)));
  if (matched.length) {
    const label = type === 'event' || type === 'community' ? 'Matches your interests' : 'Matches your skills';
    out.push(`${label}: ${matched.slice(0, 3).join(', ')}`);
  }
  const cat = categoryOf(type, d);
  if (cat && profile.categories.has(norm(cat))) {
    out.push(`You're active in ${cat}`);
  }
  return out.slice(0, 3);
}

function slim(type, d) {
  const out = { ...d };
  if (type === 'project') {
    out.likesCount = d.likes?.length || 0;
    out.membersCount = d.members?.length || 0;
    delete out.comments;
    delete out.applications;
    delete out.likes;
    delete out.members;
  } else if (type === 'event') {
    out.attendeesCount = d.attendees?.length || 0;
    delete out.attendees;
  } else if (type === 'opportunity') {
    out.applicantsCount = d.applicants?.length || 0;
    delete out.applicants;
  } else if (type === 'community') {
    out.memberCount = d.members?.length || 0;
    delete out.members;
  }
  return out;
}

function rankItems(type, candidates, profile, limit) {
  const personalised = profile.vec.size > 0;
  const scored = candidates.map((d) => {
    const cos = personalised ? cosine(profile.vec, itemVector(type, d)) : 0;
    const match = squash(cos);
    const rec = recencyBoost(d, type);
    const pop = popularity(type, d);
    const rank = personalised ? 0.75 * match + 0.15 * rec + 0.1 * pop : 0.5 * rec + 0.5 * pop;
    return { d, match, rank };
  });

  scored.sort((a, b) => b.rank - a.rank);

  return scored.slice(0, limit).map(({ d, match }) => ({
    ...slim(type, d),
    ai: {
      score: personalised ? Math.round(match * 100) : null,
      reasons: personalised ? reasonsFor(type, d, profile) : ['Trending on INNOFIX AI'],
    },
  }));
}

function matchOpportunity(opp, profile) {
  const wanted = (opp.skills || []).map(norm).filter(Boolean);
  const matched = [];
  const missing = [];
  (opp.skills || []).forEach((s) => {
    (profile.skillSet.has(norm(s)) || profile.vec.has(norm(s)) ? matched : missing).push(s);
  });
  const sem = squash(cosine(profile.vec, itemVector('opportunity', opp)));
  const coverage = wanted.length ? matched.length / wanted.length : null;
  const score = coverage === null ? sem : 0.7 * coverage + 0.3 * sem;
  return { score: Math.round(score * 100), matched, missing };
}

function similarItems(type, source, candidates, limit) {
  const sv = itemVector(type, source);
  return candidates
    .filter((c) => idStr(c) !== idStr(source))
    .map((c) => ({ c, s: cosine(sv, itemVector(type, c)) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ c, s }) => ({ ...slim(type, c), ai: { score: Math.round(squash(s) * 100), reasons: [] } }));
}

/* ------------------------------------------------------------------ */
/* People You May Know (PYMK) Graph Scorer                            */
/* ------------------------------------------------------------------ */

async function rankPeopleYouMayKnow(user, limit = 8) {
  const uid = user._id;
  const isCompany = user.role === 'company';
  const userFollowing = (user.following || []).map((id) => String(id));
  const targetKeywords = isCompany
    ? (user.companyNeeds || []).map(norm).filter(Boolean)
    : (user.skills || []).map(norm).filter(Boolean);
  const targetKeywordSet = new Set(targetKeywords);

  const query = {
    _id: { $ne: uid, $nin: user.following || [] },
  };
  if (isCompany) {
    query.role = 'student';
  }

  const candidates = await User.find(query)
    .select('fullName username avatar role headline skills reputation following followers companyName')
    .limit(80)
    .lean();

  const scored = candidates.map((cand) => {
    const candSkills = (cand.skills || []).map(norm).filter(Boolean);
    const sharedSkills = candSkills.filter((s) => targetKeywordSet.has(s));

    let skillScore = 0;
    if (targetKeywords.length > 0) {
      skillScore = sharedSkills.length / targetKeywords.length;
    }

    const candFollowers = (cand.followers || []).map((id) => String(id));
    const mutual = candFollowers.filter((id) => userFollowing.includes(id));
    const mutualScore = Math.min(mutual.length * 0.3, 1);
    const repScore = Math.min((cand.reputation || 60) / 200, 1);

    const totalScore = isCompany
      ? 0.7 * skillScore + 0.15 * mutualScore + 0.15 * repScore
      : 0.5 * skillScore + 0.35 * mutualScore + 0.15 * repScore;

    const reasons = [];
    if (isCompany) {
      if (sharedSkills.length > 0) {
        reasons.push(`Matches need for ${sharedSkills.slice(0, 2).join(' & ')}`);
      } else if (cand.skills && cand.skills.length > 0) {
        reasons.push(`Skilled in ${cand.skills.slice(0, 2).join(', ')}`);
      }
    } else {
      if (mutual.length > 0) {
        reasons.push(`${mutual.length} mutual connection${mutual.length > 1 ? 's' : ''}`);
      }
      if (sharedSkills.length > 0) {
        reasons.push(`Both know ${sharedSkills.slice(0, 2).join(' & ')}`);
      }
    }
    if (!reasons.length) {
      reasons.push(cand.headline || 'Active Innovator');
    }

    return {
      user: {
        _id: cand._id,
        fullName: cand.fullName,
        username: cand.username,
        avatar: cand.avatar,
        role: cand.role,
        headline: cand.headline,
        skills: cand.skills,
        reputation: cand.reputation,
        companyName: cand.companyName,
        followersCount: cand.followers?.length || 0,
      },
      score: Math.max(Math.round(totalScore * 100), 20),
      reason: reasons.join(' · '),
    };
  });

  let results = scored;
  if (isCompany && targetKeywords.length > 0) {
    results = scored.filter((item) => {
      const skills = (item.user.skills || []).map(norm).filter(Boolean);
      return skills.some((s) => targetKeywordSet.has(s));
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Smart Feed Ranking Algorithm                                       */
/* ------------------------------------------------------------------ */

function rankSmartFeed(user, posts) {
  if (!user) {
    return posts.map((p) => ({
      ...p,
      aiReason: '🔥 Trending on INNOFIX AI',
      aiScore: 85,
    }));
  }

  const userFollowing = new Set((user.following || []).map((id) => String(id)));
  const userSkills = (user.skills || []).map(norm);
  const userSkillSet = new Set(userSkills);

  return posts
    .map((post) => {
      const authorId = String(post.author?._id || post.author || '');
      const isFollowing = userFollowing.has(authorId);

      const postTags = (post.tags || []).concat(post.hashtags || []).map(norm);
      const matchedTags = postTags.filter((t) => userSkillSet.has(t));

      const ageHours = (Date.now() - new Date(post.createdAt || Date.now())) / (1000 * 60 * 60);
      const recency = Math.exp(-ageHours / 72);

      const likesCount = post.likes?.length || post.likesCount || 0;
      const commentsCount = post.comments?.length || post.commentsCount || 0;
      const engagement = Math.min((likesCount * 2 + commentsCount * 3) / 25, 1);

      let score = 0.3 * recency + 0.2 * engagement;
      let reason = '🔥 Trending in your network';

      if (isFollowing) {
        score += 0.35;
        reason = `👤 From @${post.author?.username || 'user'} you follow`;
      }
      if (matchedTags.length > 0) {
        score += 0.25;
        reason = `🎯 Matches your skill: #${matchedTags[0]}`;
      }

      return {
        ...post,
        aiScore: Math.min(Math.round(score * 100), 99),
        aiReason: reason,
      };
    })
    .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
}

/* ------------------------------------------------------------------ */
/* DB loaders                                                          */
/* ------------------------------------------------------------------ */

const CANDIDATE_CAP = 200;
const BOOKMARK_CAP = 50;

async function loadBehavior(user) {
  const uid = user._id;

  const bm = { project: [], event: [], opportunity: [] };
  (user.bookmarks || []).slice(-BOOKMARK_CAP).forEach((b) => {
    if (bm[b.itemType]) bm[b.itemType].push(b.itemId);
  });

  const [projects, events, communities, opportunities, bp, be, bo] = await Promise.all([
    Project.find({
      $or: [{ creator: uid }, { 'members.user': uid }, { 'applications.user': uid }, { likes: uid }],
    })
      .select('category requiredSkills')
      .limit(CANDIDATE_CAP)
      .lean(),
    Event.find({ 'attendees.user': uid }).select('type tags').limit(CANDIDATE_CAP).lean(),
    Community.find({ 'members.user': uid }).select('category tags').limit(CANDIDATE_CAP).lean(),
    Opportunity.find({ 'applicants.user': uid }).select('type skills').limit(CANDIDATE_CAP).lean(),
    bm.project.length ? Project.find({ _id: { $in: bm.project } }).select('category requiredSkills').lean() : [],
    bm.event.length ? Event.find({ _id: { $in: bm.event } }).select('type tags').lean() : [],
    bm.opportunity.length ? Opportunity.find({ _id: { $in: bm.opportunity } }).select('type skills').lean() : [],
  ]);

  return { projects, events, communities, opportunities, bookmarked: { project: bp, event: be, opportunity: bo } };
}

async function loadCandidates(user, types) {
  const uid = user._id;
  const now = new Date();
  const q = {};

  if (types.includes('projects')) {
    q.projects = Project.find({
      status: 'Open',
      creator: { $ne: uid },
      'members.user': { $ne: uid },
      'applications.user': { $ne: uid },
    })
      .populate('creator', 'fullName username avatar role companyName')
      .sort({ createdAt: -1 })
      .limit(CANDIDATE_CAP)
      .lean();
  }
  if (types.includes('events')) {
    q.events = Event.find({
      status: { $in: ['upcoming', 'ongoing'] },
      startDate: { $gte: new Date(now - DAY) },
      organizer: { $ne: uid },
      'attendees.user': { $ne: uid },
    })
      .sort({ startDate: 1 })
      .limit(CANDIDATE_CAP)
      .lean();
  }
  if (types.includes('opportunities')) {
    q.opportunities = Opportunity.find({
      status: 'active',
      creator: { $ne: uid },
      'applicants.user': { $ne: uid },
      $or: [{ deadline: null }, { deadline: { $exists: false } }, { deadline: { $gte: now } }],
    })
      .populate('creator', 'fullName username avatar role companyName')
      .sort({ createdAt: -1 })
      .limit(CANDIDATE_CAP)
      .lean();
  }
  if (types.includes('communities')) {
    q.communities = Community.find({
      privacy: 'public',
      creator: { $ne: uid },
      'members.user': { $ne: uid },
    })
      .sort({ createdAt: -1 })
      .limit(CANDIDATE_CAP)
      .lean();
  }

  const keys = Object.keys(q);
  const results = await Promise.all(keys.map((k) => q[k]));
  return Object.fromEntries(keys.map((k, i) => [k, results[i]]));
}

const SINGULAR = { projects: 'project', events: 'event', opportunities: 'opportunity', communities: 'community' };
const MODELS = { project: Project, event: Event, opportunity: Opportunity, community: Community };

module.exports = {
  itemVector,
  buildUserProfile,
  rankItems,
  matchOpportunity,
  similarItems,
  rankPeopleYouMayKnow,
  rankSmartFeed,
  cosine,
  norm,
  loadBehavior,
  loadCandidates,
  SINGULAR,
  MODELS,
};
