const mongoose = require('mongoose');
const RecommendationLog = require('../models/RecommendationLog');

const SINGULAR = { projects: 'project', events: 'event', opportunities: 'opportunity', communities: 'community' };
const TYPES = Object.values(SINGULAR);
const titleOf = (it) => String(it.title || it.name || '').slice(0, 160);

/** Record what the engine served to a user. Never throws: logging must not break the API. */
function logServed(user, strategy, recommendations) {
  const items = [];
  Object.entries(recommendations || {}).forEach(([plural, list]) => {
    (list || []).forEach((it) =>
      items.push({
        itemType: SINGULAR[plural],
        itemId: it._id,
        title: titleOf(it),
        score: it.ai && it.ai.score !== undefined ? it.ai.score : null,
        reasons: ((it.ai && it.ai.reasons) || []).slice(0, 3),
      })
    );
  });
  if (!items.length) return Promise.resolve();
  return RecommendationLog.create({ user: user._id, event: 'served', strategy, items }).catch((e) =>
    console.error('AI log (served) failed:', e.message)
  );
}

/** Record that a user clicked a recommended item. Returns false on invalid input. */
async function logClick(user, body) {
  const { itemType, itemId, title, score } = body || {};
  if (!TYPES.includes(itemType) || !mongoose.isValidObjectId(itemId)) return false;
  const s = Number(score);
  await RecommendationLog.create({
    user: user._id,
    event: 'click',
    items: [{ itemType, itemId, title: String(title || '').slice(0, 160), score: Number.isFinite(s) ? s : null }],
  }).catch((e) => console.error('AI log (click) failed:', e.message));
  return true;
}

module.exports = { logServed, logClick };
