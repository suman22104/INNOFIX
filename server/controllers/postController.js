const Post = require('../models/Post');
const User = require('../models/User');
const { scoreContentModeration } = require('../services/llmService');
const { rankSmartFeed } = require('../services/recommendService');
const { createNotification } = require('./notificationController');
const { award } = require('../services/reputationService');

// Helper to extract hashtags (#word) and mentions (@username)
function extractHashtagsAndMentions(text) {
  const hashtags = (text.match(/#([a-zA-Z0-9_-]+)/g) || []).map((t) =>
    t.replace('#', '').toLowerCase()
  );
  const mentionNames = (text.match(/@([a-zA-Z0-9_-]+)/g) || []).map((m) =>
    m.replace('@', '').toLowerCase()
  );
  return { hashtags, mentionNames };
}

// @desc    Get feed posts (with smart tabs: foryou, following, trending, tag, type)
// @route   GET /api/posts
// @access  Public / Optional Auth
exports.getPosts = async (req, res) => {
  try {
    const { tab = 'foryou', type, tag, community, author, page = 1, limit = 20 } = req.query;
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const skip = (parsedPage - 1) * parsedLimit;

    let query = { 'moderation.status': { $ne: 'blocked' } };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (tag) {
      const cleanTag = tag.replace(/^#/, '').toLowerCase();
      query.$or = [{ tags: new RegExp(cleanTag, 'i') }, { hashtags: cleanTag }];
    }

    if (community) {
      query.community = community;
    }

    if (author) {
      query.author = author;
    }

    // Following tab filter
    if (tab === 'following' && req.user) {
      const currentUser = await User.findById(req.user._id).select('following').lean();
      const followingList = (currentUser?.following || []).concat(req.user._id);
      query.author = { $in: followingList };
    }

    let posts = await Post.find(query)
      .populate('author', 'fullName username avatar role headline companyName reputation badges')
      .populate('community', 'name slug icon')
      .populate('comments.user', 'fullName username avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean();

    // If Smart Feed / For You is selected, apply AI ranking
    if (tab === 'foryou') {
      posts = rankSmartFeed(req.user, posts);
    }

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching posts',
    });
  }
};

// @desc    Create new post (with pre-save AI moderation)
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { content, type, tags, community, image } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot be empty',
      });
    }

    // 1. Extract hashtags and @mentions
    const { hashtags, mentionNames } = extractHashtagsAndMentions(content);

    const explicitTags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
      ? tags
          .split(/[\s,]+/)
          .map((t) => t.replace(/^#/, '').trim())
          .filter(Boolean)
      : [];

    const mergedTags = Array.from(new Set([...explicitTags, ...hashtags]));

    // Find mentioned user IDs
    let mentionedUserIds = [];
    if (mentionNames.length > 0) {
      const foundUsers = await User.find({ username: { $in: mentionNames } }).select('_id');
      mentionedUserIds = foundUsers.map((u) => u._id);
    }

    // 2. AI Content Moderation Check
    const moderationResult = await scoreContentModeration(content);

    if (moderationResult.status === 'blocked') {
      return res.status(400).json({
        success: false,
        moderated: true,
        message: `Your post was blocked by AI Safety Guard: ${moderationResult.reason}`,
        moderation: moderationResult,
      });
    }

    const post = await Post.create({
      author: req.user.id,
      content: content.trim(),
      type: type || 'general',
      tags: mergedTags,
      hashtags,
      mentions: mentionedUserIds,
      community: community || null,
      image: image || (req.file ? req.file.filename : ''),
      moderation: {
        status: moderationResult.status, // 'approved' or 'flagged'
        toxicityScore: moderationResult.toxicityScore,
        spamScore: moderationResult.spamScore,
        reason: moderationResult.reason,
        flaggedAt: moderationResult.status === 'flagged' ? new Date() : null,
      },
      aiCredibilityHint: {
        score: Math.max(100 - moderationResult.toxicityScore - moderationResult.spamScore, 40),
        label: moderationResult.status === 'flagged' ? 'Under Review' : 'Verified Authentic',
      },
    });

    // Award reputation points for clean contribution (+5)
    await award(req.user.id, 'post_created', post._id, 'post');

    // Send notifications to mentioned users
    if (mentionedUserIds.length > 0) {
      mentionedUserIds.forEach((uid) => {
        createNotification(req.app, {
          recipient: uid,
          sender: req.user._id,
          type: 'mention',
          title: 'You were mentioned',
          message: `${req.user.fullName} mentioned you in a post.`,
          link: `/dashboard?postId=${post._id}`,
        });
      });
    }

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'fullName username avatar role headline companyName reputation badges')
      .populate('community', 'name slug icon')
      .lean();

    res.status(201).json({
      success: true,
      message:
        moderationResult.status === 'flagged'
          ? 'Post published, flagged for automated review.'
          : 'Post created successfully! 🚀',
      post: populatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating post',
    });
  }
};

// @desc    Edit own post
// @route   PUT /api/posts/:id
// @access  Private (Author)
exports.updatePost = async (req, res) => {
  try {
    const { content, tags, type } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
    }

    if (content) {
      const moderationResult = await scoreContentModeration(content);
      if (moderationResult.status === 'blocked') {
        return res.status(400).json({
          success: false,
          message: `Edit blocked by AI Safety Guard: ${moderationResult.reason}`,
        });
      }
      post.content = content.trim();
      const { hashtags } = extractHashtagsAndMentions(content);
      post.hashtags = hashtags;
      post.isEdited = true;
    }

    if (tags) {
      post.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    }

    if (type) post.type = type;

    await post.save();

    const updated = await Post.findById(post._id)
      .populate('author', 'fullName username avatar role headline companyName reputation badges')
      .populate('community', 'name slug icon')
      .lean();

    res.status(200).json({ success: true, message: 'Post updated successfully', post: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error updating post' });
  }
};

// @desc    Like / Unlike post toggle
// @route   POST /api/posts/:id/like
// @access  Private
exports.toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const isLiked = post.likes.some(
      (likeId) => likeId.toString() === req.user.id
    );

    if (isLiked) {
      post.likes = post.likes.filter(
        (likeId) => likeId.toString() !== req.user.id
      );
    } else {
      post.likes.push(req.user.id);
      // Send notification and award reputation to author if not liking own post
      if (String(post.author) !== String(req.user.id)) {
        if (String(post.author) !== String(req.user.id)) {
          await award(post.author, 'post_like_received', post._id, 'post');
        }
        createNotification(req.app, {
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          title: 'Post Liked',
          message: `${req.user.fullName} liked your post.`,
          link: `/dashboard?postId=${post._id}`,
        });
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      liked: !isLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating like',
    });
  }
};

// @desc    Add comment to post (with AI moderation)
// @route   POST /api/posts/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // AI Safety Moderation Check on Comment
    const moderation = await scoreContentModeration(content);
    if (moderation.status === 'blocked') {
      return res.status(400).json({
        success: false,
        message: `Comment blocked by AI Safety Guard: ${moderation.reason}`,
      });
    }

    post.comments.push({
      user: req.user.id,
      content: content.trim(),
      moderation: {
        status: moderation.status,
        toxicityScore: moderation.toxicityScore,
      },
      createdAt: new Date(),
    });

    await post.save();

    // Award comment reputation points (+2)
    await award(req.user.id, 'comment_created', post._id, 'post');
    if (String(post.author) !== String(req.user.id)) {
      await award(post.author, 'comment_received', post._id, 'post');
    }

    // Send notification to author
    if (String(post.author) !== String(req.user.id)) {
      createNotification(req.app, {
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        title: 'New Comment',
        message: `${req.user.fullName} commented on your post.`,
        link: `/dashboard?postId=${post._id}`,
      });
    }

    const populatedPost = await Post.findById(post._id).populate(
      'comments.user',
      'fullName username avatar role headline reputation'
    );

    res.status(201).json({
      success: true,
      message: 'Comment added',
      comments: populatedPost.comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding comment',
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (Author / Admin)
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting post',
    });
  }
};
