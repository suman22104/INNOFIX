import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messageAPI, userAPI } from '../services/api';
import {
  Send,
  Search,
  MessageSquare,
  Sparkles,
  Shield,
  Circle,
  Clock,
  Check,
  CheckCheck,
  Paperclip,
  MoreVertical,
} from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket, onlineUsers, activeTyping, refreshUnreadCounts } = useSocket();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations
  const loadConversations = async () => {
    setLoadingConv(true);
    try {
      const res = await messageAPI.getConversations();
      if (res.data?.success) {
        setConversations(res.data.conversations || []);

        // If userId was passed in query params, open/create that conversation
        if (initialUserId) {
          const existing = res.data.conversations.find(
            (c) => c.otherUser?._id === initialUserId
          );
          if (existing) {
            setActiveConv(existing);
          } else {
            const initRes = await messageAPI.getOrCreateConversation(initialUserId);
            if (initRes.data?.success) {
              const newConv = initRes.data.conversation;
              const other = newConv.participants.find((p) => p._id !== user._id);
              const formatted = { ...newConv, otherUser: other, unreadCount: 0 };
              setConversations((prev) => [formatted, ...prev]);
              setActiveConv(formatted);
            }
          }
        } else if (res.data.conversations.length > 0 && !activeConv) {
          setActiveConv(res.data.conversations[0]);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [initialUserId]);

  // Load messages when activeConv changes
  useEffect(() => {
    if (!activeConv) return;
    const loadMessages = async () => {
      setLoadingMsgs(true);
      try {
        const res = await messageAPI.getMessages(activeConv._id);
        if (res.data?.success) {
          setMessages(res.data.messages || []);
          refreshUnreadCounts();
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      } finally {
        setLoadingMsgs(false);
      }
    };
    loadMessages();
  }, [activeConv?._id]);

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      if (activeConv && msg.conversationId === activeConv._id) {
        setMessages((prev) => [...prev, msg]);
        socket.emit('mark_read', {
          conversationId: activeConv._id,
          senderId: msg.sender._id,
        });
      }

      // Update conversation list item
      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversationId
            ? {
                ...c,
                lastMessage: {
                  text: msg.text,
                  sender: msg.sender,
                  createdAt: msg.createdAt,
                },
              }
            : c
        )
      );
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, activeConv]);

  // Typing emitter
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !activeConv || !activeConv.otherUser) return;

    socket.emit('typing_start', {
      receiverId: activeConv.otherUser._id,
      conversationId: activeConv._id,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', {
        receiverId: activeConv.otherUser._id,
        conversationId: activeConv._id,
      });
    }, 1500);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const res = await messageAPI.sendMessage({
        conversationId: activeConv._id,
        receiverId: activeConv.otherUser?._id,
        text: textToSend,
      });

      if (res.data?.success) {
        setMessages((prev) => [...prev, res.data.message]);
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConv._id
              ? {
                  ...c,
                  lastMessage: {
                    text: textToSend,
                    sender: user._id,
                    createdAt: new Date(),
                  },
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.otherUser?.fullName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.otherUser?.username?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const isOtherUserOnline = activeConv?.otherUser && onlineUsers.has(activeConv.otherUser._id);
  const isOtherUserTyping =
    activeConv && activeTyping[activeConv._id] === activeConv.otherUser?._id;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)]">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 h-full overflow-hidden flex flex-col md:flex-row">
        
        {/* Left: Conversations Sidebar */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-1/3 md:h-full">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" /> Messages
              </h1>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loadingConv ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading inbox...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No active conversations</p>
                <p className="text-[11px] text-slate-400 mt-1">Visit a user's profile to start chatting</p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = activeConv?._id === c._id;
                const isOnline = c.otherUser && onlineUsers.has(c.otherUser._id);
                return (
                  <div
                    key={c._id}
                    onClick={() => setActiveConv(c)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={
                          c.otherUser?.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            c.otherUser?.fullName || 'User'
                          )}&background=FBC02D&color=111827&bold=true`
                        }
                        alt={c.otherUser?.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-amber-400/40"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {c.otherUser?.fullName || 'Deleted User'}
                        </p>
                        {c.lastMessage?.createdAt && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {c.lastMessage?.text || 'No messages yet'}
                      </p>
                    </div>

                    {c.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900 shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        {activeConv ? (
          <div className="flex-1 flex flex-col h-2/3 md:h-full bg-slate-50/50 dark:bg-slate-950/40">
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={
                      activeConv.otherUser?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        activeConv.otherUser?.fullName || 'User'
                      )}&background=FBC02D&color=111827&bold=true`
                    }
                    alt={activeConv.otherUser?.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-amber-400/40"
                  />
                  {isOtherUserOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {activeConv.otherUser?.fullName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>@{activeConv.otherUser?.username}</span>
                    <span>·</span>
                    <span className={isOtherUserOnline ? 'text-emerald-500 font-bold' : ''}>
                      {isOtherUserOnline ? 'Online now' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-500" /> Private chat
              </span>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {loadingMsgs ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading thread...</div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Say hello to {activeConv.otherUser?.fullName}!
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Say hello and start the conversation</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender?._id === user?._id || m.sender === user?._id;
                  return (
                    <div
                      key={m._id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isMine
                            ? 'bg-amber-400 text-slate-900 rounded-br-none font-medium'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isOtherUserTyping && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 italic animate-pulse">
                  <span>{activeConv.otherUser?.fullName} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={`Message @${activeConv.otherUser?.username || 'user'}...`}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-900 shadow-md shadow-amber-500/20 transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center p-8 text-center">
            <div>
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                Select a conversation
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pick a chat from the list, or message someone from their profile.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
