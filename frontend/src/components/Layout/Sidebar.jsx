import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/connections', label: 'Connections', icon: '🔌' },
  { path: '/migrations', label: 'Migrations', icon: '⇄' },
  { path: '/monitoring', label: 'Monitoring', icon: '📊' },
  { path: '/validation', label: 'Validation', icon: '✓' },
  { path: '/query-translator', label: 'Translator', icon: '⚗' },
  { path: '/logs', label: 'Audit Logs', icon: '📋' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300 ease-in-out
        bg-surface-900 dark:bg-surface-950 border-r border-slate-700/50
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 ${collapsed ? 'justify-center' : ''}`}
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
          <span className="text-white font-bold text-sm">DB</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <div className="text-white font-bold text-sm leading-tight">DBMigrate Pro</div>
            <div className="text-slate-400 text-xs">Enterprise Edition</div>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-surface-800 border border-slate-600
          flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary-600
          transition-all duration-200 z-10 shadow-md"
        id="sidebar-toggle"
      >
        <span className="text-xs">{collapsed ? '›' : '‹'}</span>
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {!collapsed && (
          <div className="px-3 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Navigation
          </div>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
               ${
                 isActive
                   ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                   : 'text-slate-400 hover:bg-surface-800 hover:text-slate-200'
               }
              ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="animate-fade-in">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className={`p-3 border-t border-slate-700/50 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.username}</div>
              <div className="text-slate-400 text-xs capitalize">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 transition-colors text-lg"
              title="Logout"
            >
              ⎋
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors"
            title="Logout"
          >
            ⎋
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
