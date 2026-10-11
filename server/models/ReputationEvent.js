const mongoose = require('mongoose');

const reputationEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ['post', 'project', 'comment', 'system', 'opportunity', 'event', 'community', 'user'],
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, 
    },
  },
  { timestamps: true }
);

// Unique index to prevent duplicate points for the same action on the same item by the same user.
// Using sparse: true so it doesn't conflict if sourceId is null.
reputationEventSchema.index(
  { user: 1, action: 1, sourceId: 1 }, 
  { unique: true, partialFilterExpression: { sourceId: { $exists: true, $type: 'objectId' } } }
);

module.exports = mongoose.model('ReputationEvent', reputationEventSchema);
