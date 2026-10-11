const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
    },
    type: {
      type: String,
      enum: ['idea', 'project', 'event', 'opportunity', 'general'],
      default: 'general',
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    hashtags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    image: {
      type: String,
      default: '',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
        },
        moderation: {
          status: {
            type: String,
            enum: ['approved', 'flagged', 'blocked'],
            default: 'approved',
          },
          toxicityScore: { type: Number, default: 0 },
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    moderation: {
      status: {
        type: String,
        enum: ['approved', 'flagged', 'blocked'],
        default: 'approved',
      },
      toxicityScore: {
        type: Number,
        default: 0,
      },
      spamScore: {
        type: Number,
        default: 0,
      },
      reason: {
        type: String,
        default: '',
      },
      flaggedAt: {
        type: Date,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    aiCredibilityHint: {
      score: { type: Number, default: 95 },
      label: { type: String, default: 'Authentic content' },
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

postSchema.virtual('commentsCount').get(function () {
  return this.comments ? this.comments.length : 0;
});

// Text index for search
postSchema.index({
  content: 'text',
  tags: 'text',
  hashtags: 'text',
});
postSchema.index({ hashtags: 1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ 'moderation.status': 1 });

module.exports = mongoose.model('Post', postSchema);
