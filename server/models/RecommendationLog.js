const mongoose = require('mongoose');

// One document per recommendation request ("served") or per clicked recommendation ("click").
const itemSchema = new mongoose.Schema(
  {
    itemType: { type: String, enum: ['project', 'event', 'opportunity', 'community'] },
    itemId: { type: mongoose.Schema.Types.ObjectId },
    title: { type: String, default: '' },
    score: { type: Number, default: null },
    reasons: [{ type: String }],
  },
  { _id: false }
);

const recommendationLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: String, enum: ['served', 'click'], required: true },
  strategy: { type: String, enum: ['personalized', 'trending'] },
  items: [itemSchema],
  // Logs auto-expire after 90 days (MongoDB TTL index)
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 },
});

recommendationLogSchema.index({ user: 1, createdAt: -1 });
recommendationLogSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('RecommendationLog', recommendationLogSchema);
