import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationAPI, messageAPI } from '../services/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeTyping, setActiveTyping] = useState({}); // conversationId -> senderId

  // Fetch initial unread counts
  const fetchUnreadCounts = async () => {
    if (!isAuthenticated) return;
    try {
      const [notifRes, convRes] = await Promise.all([
        notificationAPI.getAll({ limit: 1 }),
        messageAPI.getConversations(),
      ]);

      if (notifRes.data?.success) {
        setUnreadNotifications(notifRes.data.unreadCount || 0);
      }

      if (convRes.data?.success) {
        const totalMsgUnread = (convRes.data.conversations || []).reduce(
          (acc, c) => acc + (c.unreadCount || 0),
          0
        );
        setUnreadMessages(totalMsgUnread);
      }
    } catch (err) {
      // Non-critical
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchUnreadCounts();

      // Initialize Socket.IO client
      const socketUrl = window.location.origin;
      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        newSocket.emit('get_online_users');
      });

      newSocket.on('online_users_list', (users) => {
        setOnlineUsers(new Set(users));
      });

      newSocket.on('user_status', ({ userId, status }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          if (status === 'online') updated.add(userId);
          else updated.delete(userId);
          return updated;
        });
      });

      newSocket.on('new_notification', () => {
        setUnreadNotifications((prev) => prev + 1);
      });

      newSocket.on('receive_message', (msg) => {
        setUnreadMessages((prev) => prev + 1);
      });

      newSocket.on('user_typing', ({ senderId, conversationId, isTyping }) => {
        setActiveTyping((prev) => ({
          ...prev,
          [conversationId]: isTyping ? senderId : null,
        }));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUsers(new Set());
      setUnreadNotifications(0);
      setUnreadMessages(0);
    }
  }, [isAuthenticated, token]);

  const value = {
    socket,
    onlineUsers,
    unreadNotifications,
    setUnreadNotifications,
    unreadMessages,
    setUnreadMessages,
    activeTyping,
    refreshUnreadCounts: fetchUnreadCounts,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
