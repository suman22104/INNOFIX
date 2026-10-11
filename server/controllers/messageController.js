const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get or create 1-to-1 conversation
// @route   POST /api/messages/conversations
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required' });
    }

    if (String(userId) === String(recipientId)) {
      return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
    }

    const recipient = await User.findById(recipientId).select('fullName username avatar role privacy blockedUsers');
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient user not found' });
    }

    // Check privacy settings
    if (recipient.privacy?.allowMessagesFrom === 'none') {
      return res.status(403).json({ success: false, message: 'This user is not accepting direct messages' });
    }
    if (recipient.privacy?.allowMessagesFrom === 'followers') {
      const isFollower = req.user.following?.some((id) => String(id) === String(recipientId));
      if (!isFollower) {
        return res.status(403).json({ success: false, message: 'This user only accepts messages from users they follow' });
      }
    }

    // Check block list
    if (recipient.blockedUsers?.some((id) => String(id) === String(userId))) {
      return res.status(403).json({ success: false, message: 'You cannot message this user' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId], $size: 2 },
    }).populate('participants', 'fullName username avatar role headline companyName');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, recipientId],
        unreadCounts: new Map([[String(userId), 0], [String(recipientId), 0]]),
      });
      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'fullName username avatar role headline companyName'
      );
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error initializing conversation' });
  }
};

// @desc    Get all conversations for logged in user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'fullName username avatar role headline companyName')
      .populate('lastMessage.sender', 'fullName username')
      .sort({ updatedAt: -1 })
      .lean();

    // Map formatted conversation with other participant
    const formatted = conversations.map((c) => {
      const otherUser = c.participants.find((p) => String(p._id) !== String(userId));
      const unread = c.unreadCounts ? c.unreadCounts[String(userId)] || 0 : 0;
      return {
        ...c,
        otherUser,
        unreadCount: unread,
      };
    });

    res.status(200).json({ success: true, count: formatted.length, conversations: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching conversations' });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'fullName username avatar role')
      .populate('receiver', 'fullName username avatar role')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Mark messages as read for this user
    await Message.updateMany(
      { conversationId, receiver: userId, read: false },
      { read: true, readAt: new Date() }
    );

    // Reset unread count for this user
    if (conversation.unreadCounts) {
      conversation.unreadCounts.set(String(userId), 0);
      await conversation.save();
    }

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching messages' });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, text, attachments } = req.body;
    const senderId = req.user._id;

    if (!text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ success: false, message: 'Message text or attachment required' });
    }

    let targetConvId = conversationId;
    let targetReceiverId = receiverId;

    if (!targetConvId) {
      if (!targetReceiverId) {
        return res.status(400).json({ success: false, message: 'Receiver ID or Conversation ID is required' });
      }
      // Find or create conversation
      let conv = await Conversation.findOne({
        participants: { $all: [senderId, targetReceiverId], $size: 2 },
      });
      if (!conv) {
        conv = await Conversation.create({
          participants: [senderId, targetReceiverId],
          unreadCounts: new Map([[String(senderId), 0], [String(targetReceiverId), 0]]),
        });
      }
      targetConvId = conv._id;
    } else {
      const conv = await Conversation.findById(targetConvId);
      if (!conv || !conv.participants.some((p) => String(p) === String(senderId))) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }
      targetReceiverId = conv.participants.find((p) => String(p) !== String(senderId));
    }

    const message = await Message.create({
      conversationId: targetConvId,
      sender: senderId,
      receiver: targetReceiverId,
      text: text || '',
      attachments: attachments || [],
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'fullName username avatar role')
      .populate('receiver', 'fullName username avatar role')
      .lean();

    // Update conversation lastMessage and increment receiver's unread count
    const conv = await Conversation.findById(targetConvId);
    if (conv) {
      conv.lastMessage = {
        text: text || 'Sent an attachment',
        sender: senderId,
        createdAt: new Date(),
        readBy: [senderId],
      };
      const currentUnread = conv.unreadCounts ? conv.unreadCounts.get(String(targetReceiverId)) || 0 : 0;
      if (!conv.unreadCounts) conv.unreadCounts = new Map();
      conv.unreadCounts.set(String(targetReceiverId), currentUnread + 1);
      await conv.save();
    }

    // Push live message via Socket.IO
    const socketService = req.app.get('socketService');
    if (socketService) {
      socketService.sendMessageToUser(targetReceiverId, populatedMessage);
    }

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error sending message' });
  }
};
