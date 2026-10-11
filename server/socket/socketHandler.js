const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Map of userId -> Set of socketIds for multi-tab support
const onlineUsers = new Map();

function setupSocketIO(io) {
  // Authentication middleware for Socket.IO connection handshake
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error('Server configuration error: JWT_SECRET missing'));
      }

      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id).select('_id fullName username avatar role');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired socket authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Track online user sockets
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal user room for direct events
    socket.join(`user_${userId}`);

    // Broadcast user online status
    io.emit('user_status', { userId, status: 'online' });

    // Request active online users list
    socket.on('get_online_users', () => {
      socket.emit('online_users_list', Array.from(onlineUsers.keys()));
    });

    // Handle typing indicators
    socket.on('typing_start', ({ receiverId, conversationId }) => {
      if (receiverId) {
        io.to(`user_${receiverId}`).emit('user_typing', {
          senderId: userId,
          conversationId,
          isTyping: true,
        });
      }
    });

    socket.on('typing_stop', ({ receiverId, conversationId }) => {
      if (receiverId) {
        io.to(`user_${receiverId}`).emit('user_typing', {
          senderId: userId,
          conversationId,
          isTyping: false,
        });
      }
    });

    // Mark messages as read in real-time
    socket.on('mark_read', ({ conversationId, senderId }) => {
      if (senderId) {
        io.to(`user_${senderId}`).emit('messages_read', {
          conversationId,
          readBy: userId,
          readAt: new Date(),
        });
      }
    });

    // Disconnect event
    socket.on('disconnect', () => {
      if (onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast user offline status
          io.emit('user_status', { userId, status: 'offline' });
        }
      }
    });
  });

  return {
    sendNotificationToUser: (recipientId, notification) => {
      io.to(`user_${recipientId.toString()}`).emit('new_notification', notification);
    },
    sendMessageToUser: (recipientId, message) => {
      io.to(`user_${recipientId.toString()}`).emit('receive_message', message);
    },
    getOnlineUserIds: () => Array.from(onlineUsers.keys()),
  };
}

module.exports = { setupSocketIO };
