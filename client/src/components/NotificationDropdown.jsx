import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, UserPlus, Heart, MessageSquare, Briefcase, Calendar, Sparkles, X } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import SwipeRow from './SwipeRow';

export default function NotificationDropdown({ isSidebar = false }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { unreadNotifications, setUnreadNotifications, socket } = useSocket();
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll({ limit: 15 });
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadNotifications(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // Listen to new notifications in real-time
  useEffect(() => {
    if (socket) {
      socket.on('new_notification', (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
      });
    }
  }, [socket]);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationAPI.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotifications(0);
    } catch (err) {}
  };

  const getIcon = (type) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'like':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'comment':
      case 'mention':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'project_apply':
      case 'project_accept':
        return <Briefcase className="w-4 h-4 text-amber-500" />;
      case 'event_reminder':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={
          isSidebar 
            ? "w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white group" 
            : "relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        }
        title="Notifications"
      >
        {isSidebar ? (
          <div className="relative shrink-0 flex items-center justify-center w-6 h-6">
            <Bell className="w-6 h-6 shrink-0 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-extrabold text-slate-900 bg-amber-400 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </div>
        ) : (
          <>
            <Bell className="w-5 h-5" strokeWidth={2.5} />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-slate-900 bg-amber-400 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </>
        )}
        {isSidebar && (
          <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Notifications
          </span>
        )}
      </button>

      {open && (
        isSidebar ? (
          <div className="fixed left-0 top-0 h-screen w-80 sm:w-[340px] bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 z-50 animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate">Notifications</span>
                {unreadNotifications > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 whitespace-nowrap shrink-0">
                    {unreadNotifications} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {unreadNotifications > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline hidden sm:block whitespace-nowrap shrink-0"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); setOpen(false); }} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <SwipeRow
                    key={n._id}
                    direction="right"
                    actionWidth={80}
                    radius={0}
                    rowColor="transparent"
                    drawerColor="transparent" 
                    actionColor="#ef4444"
                    onCommit={() => handleDelete(n._id)}
                    actions={[{ id: 'delete', label: 'Delete', icon: <X size={20} className="text-red-500 dark:text-red-400" /> }]}
                    className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div
                      className={`p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors w-full ${
                        !n.read ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={n.link || '#'}
                          onClick={() => {
                            handleMarkAsRead(n._id);
                            setOpen(false);
                          }}
                          className="block group"
                        >
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </Link>
                      </div>
                      {!n.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(n._id, e)}
                          title="Mark as read"
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-100/50 dark:hover:bg-slate-800 shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Swipe Handle */}
                      <div className="w-4 h-full shrink-0 flex items-center justify-center border-l border-slate-100 dark:border-slate-800 ml-1 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-r transition-colors">
                        <div className="w-1 h-4 flex flex-col gap-[2px] items-center justify-center">
                          <div className="w-[3px] h-[3px] rounded-full bg-current"></div>
                          <div className="w-[3px] h-[3px] rounded-full bg-current"></div>
                          <div className="w-[3px] h-[3px] rounded-full bg-current"></div>
                        </div>
                      </div>
                    </div>
                  </SwipeRow>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Notifications</span>
                {unreadNotifications > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    {unreadNotifications} new
                  </span>
                )}
              </div>
              {unreadNotifications > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <SwipeRow
                    key={n._id}
                    direction="right"
                    actionWidth={80}
                    radius={0}
                    rowColor="transparent"
                    drawerColor="transparent"
                    actionColor="#ef4444"
                    onCommit={() => handleDelete(n._id)}
                    actions={[{ id: 'delete', label: 'Delete', icon: <X size={20} className="text-red-500 dark:text-red-400" /> }]}
                    className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div
                      className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors w-full ${
                        !n.read ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={n.link || '#'}
                          onClick={() => {
                            handleMarkAsRead(n._id);
                            setOpen(false);
                          }}
                          className="block group"
                        >
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </Link>
                      </div>
                      {!n.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(n._id, e)}
                          title="Mark as read"
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-100/50 dark:hover:bg-slate-800 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Swipe Handle */}
                      <div className="w-4 h-full shrink-0 flex items-center justify-center border-l border-slate-100 dark:border-slate-800 ml-1 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-r transition-colors">
                        <div className="w-1 h-4 flex flex-col gap-[2px] items-center justify-center">
                          <div className="w-[3px] h-[3px] rounded-full bg-current"></div>
                          <div className="w-[3px] h-[3px] rounded-full bg-current"></div>
                          <div className="w-[3px] h-[3px] rounded-full bg-current"></div>
                        </div>
                      </div>
                    </div>
                  </SwipeRow>
                ))
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
