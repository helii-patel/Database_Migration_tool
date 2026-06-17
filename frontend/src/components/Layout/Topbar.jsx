import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getNotifications, markAllNotificationsRead } from '../../api/notifications';
import { formatDistanceToNow } from 'date-fns';

const ROUTE_LABELS = {
  '/dashboard': 'Dashboard',
  '/connections': 'Database Connections',
  '/migrations': 'Migrations',
  '/monitoring': 'Performance Monitoring',
  '/validation': 'Data Validation',
  '/logs': 'Audit Logs',
  '/settings': 'Settings',
};

const SEVERITY_COLORS = {
  success: 'text-emerald-500',
  error: 'text-rose-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

const Topbar = ({ collapsed }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const pageTitle = ROUTE_LABELS[location.pathname] || 'Dashboard';
  const sidebarWidth = collapsed ? 72 : 260;

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    fetchNotifications();
  };

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center justify-between px-6 h-16
        bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl
        border-b border-slate-200 dark:border-slate-700/50 transition-all duration-300"
      style={{ left: sidebarWidth }}
    >
      {/* Page title */}
      <div>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white">{pageTitle}</h1>
        <p className="text-xs text-slate-400 hidden sm:block">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          id="theme-toggle"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-surface-800 flex items-center justify-center
            text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-surface-700 transition-all duration-200"
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-surface-800 flex items-center justify-center
              text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-surface-700 transition-all duration-200 relative"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 card shadow-xl z-50 animate-fade-in max-h-96 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <span className="font-semibold text-sm text-slate-800 dark:text-white">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary-500 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-surface-700 transition-colors ${!n.is_read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`text-base ${SEVERITY_COLORS[n.severity]}`}>
                          {n.severity === 'success'
                            ? '✅'
                            : n.severity === 'error'
                              ? '❌'
                              : n.severity === 'warning'
                                ? '⚠️'
                                : 'ℹ️'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!n.is_read && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-surface-800">
          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-none">
              {user?.username}
            </p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
