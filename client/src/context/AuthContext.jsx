import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext(null);

const activeStore = () => (sessionStorage.getItem('innofix_token') ? sessionStorage : localStorage);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = activeStore().getItem('innofix_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => activeStore().getItem('innofix_token'));
  const [loading, setLoading] = useState(true);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('innofix_theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('innofix_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('innofix_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Validate or fetch fresh profile on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            activeStore().setItem('innofix_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session expired, logging out');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = (tokenData, userData, tabOnly = false) => {
    if (!tabOnly) {
      sessionStorage.removeItem('innofix_token');
      sessionStorage.removeItem('innofix_user');
    }
    const store = tabOnly ? sessionStorage : localStorage;
    setToken(tokenData);
    setUser(userData);
    store.setItem('innofix_token', tokenData);
    store.setItem('innofix_user', JSON.stringify(userData));
  };

  const logout = () => {
    const store = activeStore();
    setToken(null);
    setUser(null);
    store.removeItem('innofix_token');
    store.removeItem('innofix_user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    activeStore().setItem('innofix_user', JSON.stringify(updatedUser));
  };

  const isBookmarked = (itemType, itemId) => {
    if (!user || !user.bookmarks) return false;
    return user.bookmarks.some(
      (b) => b.itemType === itemType && String(b.itemId) === String(itemId)
    );
  };

  const toggleBookmark = async (itemType, itemId) => {
    if (!user) return false;
    try {
      const res = await userAPI.toggleBookmark({ itemType, itemId });
      if (res.data.success) {
        const updated = { ...user, bookmarks: res.data.bookmarks };
        updateUser(updated);
        return res.data.bookmarked;
      }
    } catch (e) {
      console.error('Bookmark error:', e);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        darkMode,
        toggleDarkMode,
        login,
        logout,
        updateUser,
        isBookmarked,
        toggleBookmark,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
