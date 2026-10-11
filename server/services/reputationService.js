const User = require('../models/User');
const Post = require('../models/Post');
const ReputationEvent = require('../models/ReputationEvent');
const Notification = require('../models/Notification');

// Levels defined by minimum reputation.
// Every account starts with 60 points, so the ladder starts above that:
// completing the profile (60 + 4 x 15 = 120) lands a user on Level 2.
const LEVELS = [
  { level: 1, minPoints: 0, title: 'Newcomer' },
  { level: 2, minPoints: 100, title: 'Contributor' },
  { level: 3, minPoints: 200, title: 'Active Member' },
  { level: 4, minPoints: 350, title: 'Community Leader' },
  { level: 5, minPoints: 1000, title: 'Visionary' }
];

const BADGES = [
  { id: 'bronze', name: 'Bronze Contributor', threshold: 100, icon: '🥉', description: 'Reached 100 points' },
  { id: 'silver', name: 'Silver Contributor', threshold: 200, icon: '🥈', description: 'Reached 200 points' },
  { id: 'gold', name: 'Gold Contributor', threshold: 350, icon: '🥇', description: 'Reached 350 points' },
  { id: 'platinum', name: 'Platinum Innovator', threshold: 1000, icon: '💎', description: 'Reached 1000 points' }
];

/**
 * Reputation rules
 *  - New account ................ 60 points (once)
 *  - Profile details ............ 15 points each, once: headline/title, about, location, skills
 *  - Genuine posts .............. 5 points per post that passed AI moderation, max 3 per day
 *  - Penalties .................. moderation removal / upheld report
 * Any action that is not listed here (likes, comments, follows, projects, events ...)
 * earns nothing: award() simply returns { awarded: false, reason: 'Invalid action' }.
 */
const POINT_RULES_CONFIG = {
  signup_welcome_bonus: { points: 60, dailyCap: null, oncePerUser: true, label: 'Welcome bonus (students)' },
  profile_headline_added: { points: 15, dailyCap: null, oncePerUser: true, label: 'Added a headline / title' },
  profile_about_added: { points: 15, dailyCap: null, oncePerUser: true, label: 'Wrote an About section' },
  profile_location_added: { points: 15, dailyCap: null, oncePerUser: true, label: 'Added a location' },
  profile_skills_added: { points: 15, dailyCap: null, oncePerUser: true, label: 'Added skills' },
  post_created: { points: 5, dailyCap: 3, oncePerUser: false, label: 'Published a genuine post' },
  content_removed_by_moderation: { points: -15, dailyCap: null, oncePerUser: false, label: 'Content removed by moderation' },
  report_upheld: { points: -10, dailyCap: null, oncePerUser: false, label: 'Report upheld' }
};

// User field -> rule that rewards it
const PROFILE_FIELD_RULES = [
  { field: 'headline', action: 'profile_headline_added' },
  { field: 'bio', action: 'profile_about_added' },
  { field: 'location', action: 'profile_location_added' },
  { field: 'skills', action: 'profile_skills_added' }
];

// Brand-new accounts can't earn points for most actions for this many hours (anti-abuse).
// Set to 0 to switch the hold off, e.g. while testing.
const NEW_ACCOUNT_HOLD_HOURS = 24;
const NEW_ACCOUNT_EXEMPT = new Set(['signup_welcome_bonus', ...PROFILE_FIELD_RULES.map((r) => r.action)]);

// A post only earns points if its moderation status is one of these
// (or it has no moderation status at all).
const GENUINE_POST_STATUSES = ['approved'];

exports.getRules = () => {
  return {
    rules: Object.entries(POINT_RULES_CONFIG).map(([key, value]) => ({
      action: key,
      label: value.label,
      points: value.points,
      dailyCap: value.dailyCap,
      oncePerUser: value.oncePerUser
    })),
    levels: LEVELS,
    badges: BADGES,
    notes: 'Students start with 60 points and companies start at 0. Complete your profile for 15 points per detail (headline, about, location and, for students, skills), then keep posting genuine content: only posts that pass AI moderation earn points, up to 3 per day.'
  };
};

const getLevelForPoints = (points) => {
  let current = LEVELS[0];
  for (let i = 1; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].minPoints) {
      current = LEVELS[i];
    } else {
      break;
    }
  }
  return current;
};

const hasValue = (user, field) => {
  const v = user[field];
  if (Array.isArray(v)) return v.some((s) => String(s).trim().length > 0);
  return typeof v === 'string' && v.trim().length > 0;
};

/**
 * Single source of truth for awarding points.
 */
exports.award = async (userId, actionKey, sourceId, sourceType) => {
  try {
    const user = await User.findById(userId);
    if (!user) return { awarded: false, reason: 'User not found' };

    const rule = POINT_RULES_CONFIG[actionKey];
    if (!rule) return { awarded: false, reason: 'Invalid action' };

    // Company accounts start at 0: no welcome bonus (students get it)
    if (actionKey === 'signup_welcome_bonus' && user.role === 'company') {
      return { awarded: false, reason: 'No welcome bonus for company accounts' };
    }

    // New account logic (anti-abuse)
    if (NEW_ACCOUNT_HOLD_HOURS > 0) {
      const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
      const isNewAccount = accountAgeMs < NEW_ACCOUNT_HOLD_HOURS * 60 * 60 * 1000;
      if (isNewAccount && !NEW_ACCOUNT_EXEMPT.has(actionKey)) {
        return { awarded: false, reason: 'Account too new for this action' };
      }
    }

    // Only genuine (AI-approved) posts earn points
    if (actionKey === 'post_created' && sourceId) {
      const post = await Post.findById(sourceId).select('moderation');
      const status = post && post.moderation && post.moderation.status;
      if (status && !GENUINE_POST_STATUSES.includes(status)) {
        return { awarded: false, reason: 'Post was not approved by moderation' };
      }
    }

    // Once per user logic
    if (rule.oncePerUser) {
      const exists = await ReputationEvent.findOne({ user: userId, action: actionKey });
      if (exists) return { awarded: false, reason: 'Already awarded for this user' };
    }

    // Duplicate reference logic
    if (sourceId) {
      const exists = await ReputationEvent.findOne({ user: userId, action: actionKey, sourceId });
      if (exists) return { awarded: false, reason: 'Already awarded for this item' };
    }

    // Daily cap logic
    if (rule.dailyCap !== null) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const countToday = await ReputationEvent.countDocuments({
        user: userId,
        action: actionKey,
        createdAt: { $gte: startOfDay }
      });
      if (countToday >= rule.dailyCap) {
        return { awarded: false, reason: 'Daily cap reached' };
      }
    }

    // Add event
    await ReputationEvent.create({
      user: userId,
      action: actionKey,
      points: rule.points,
      reason: rule.label,
      sourceType: sourceType || 'system',
      sourceId: sourceId || null
    });

    const newTotal = (user.reputation || 0) + rule.points;
    const oldLevel = user.level || 1;
    const newLevelObj = getLevelForPoints(newTotal);

    // Check badges
    const userBadges = user.badges || [];
    let newBadgesEarned = [];
    BADGES.forEach((badge) => {
      if (newTotal >= badge.threshold && !userBadges.some(b => b.id === badge.id)) {
        newBadgesEarned.push({
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          description: badge.description,
          awardedAt: new Date()
        });
      }
    });

    let updatedBadges = [...userBadges, ...newBadgesEarned];

    // Update user
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          reputation: newTotal,
          badges: updatedBadges,
          level: newLevelObj.level
        },
        $inc: {
          weeklyPoints: rule.points > 0 ? rule.points : 0,
          monthlyPoints: rule.points > 0 ? rule.points : 0
        }
      }
    );

    // Level up or Badge notification (with a limit/digest style or just simply send one)
    if (newLevelObj.level > oldLevel || newBadgesEarned.length > 0) {
      let text = '';
      if (newLevelObj.level > oldLevel) text += `You reached Level ${newLevelObj.level} (${newLevelObj.title})! `;
      if (newBadgesEarned.length > 0) text += `You earned the ${newBadgesEarned[0].name} badge!`;

      // We don't have a sender, so make sure Notification supports it.
      await Notification.create({
        recipient: userId,
        type: 'reputation_badge',
        title: 'Reputation Milestone! 🏆',
        message: text.trim(),
        link: '/leaderboard'
      });
    }

    return { awarded: true, points: rule.points, reason: rule.label };

  } catch (error) {
    if (error.code === 11000) {
      return { awarded: false, reason: 'Duplicate action on same item' };
    }
    console.error('Error awarding points:', error);
    return { awarded: false, reason: 'Server error' };
  }
};

/**
 * Awards 15 points (once each) for every profile detail the user has filled in:
 * headline/title, about (bio), location and skills. Safe to call as often as you like:
 * a detail that was already rewarded is never rewarded again.
 */
exports.awardProfileDetails = async (userId) => {
  const awarded = [];
  try {
    const user = await User.findById(userId).select('role headline bio location skills');
    if (!user) return awarded;
    for (const { field, action } of PROFILE_FIELD_RULES) {
      if (field === 'skills' && user.role === 'company') continue; // companies have no skills section
      if (!hasValue(user, field)) continue;
      const result = await exports.award(userId, action, null, 'system');
      if (result.awarded) awarded.push(action);
    }
  } catch (error) {
    console.error('Error awarding profile detail points:', error);
  }
  return awarded;
};
