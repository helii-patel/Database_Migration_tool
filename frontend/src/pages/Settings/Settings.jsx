import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ username: user?.username || '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      updateUser(res.data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/profile', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'security', label: '🔒 Security' },
    { id: 'appearance', label: '🎨 Appearance' },
    { id: 'system', label: '⚙️ System' },
  ];

  const ROLE_INFO = {
    admin: {
      label: 'Administrator',
      desc: 'Full access to all features including user management',
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-900/10',
    },
    engineer: {
      label: 'Database Engineer',
      desc: 'Can create connections, run migrations, and view monitoring',
      color: 'text-primary-500',
      bg: 'bg-primary-50 dark:bg-primary-900/10',
    },
    viewer: {
      label: 'Viewer',
      desc: 'Read-only access to dashboards and logs',
      color: 'text-slate-500',
      bg: 'bg-slate-50 dark:bg-surface-700',
    },
  };

  const roleInfo = ROLE_INFO[user?.role] || ROLE_INFO.viewer;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-surface-800 rounded-xl max-w-max">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`settings-tab-${t.id}`}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${activeTab === t.id ? 'bg-white dark:bg-surface-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile info card */}
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-glow-primary">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">{user?.username}</h3>
            <p className="text-sm text-slate-400 mb-4">{user?.email}</p>
            <div className={`px-4 py-2 rounded-xl ${roleInfo.bg} w-full`}>
              <p className={`text-sm font-semibold ${roleInfo.color}`}>{roleInfo.label}</p>
              <p className="text-xs text-slate-400 mt-1">{roleInfo.desc}</p>
            </div>
            {user?.last_login && (
              <p className="text-xs text-slate-400 mt-4">
                Last login: {new Date(user.last_login).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Edit form */}
          <div className="card p-6 lg:col-span-2">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Edit Profile</h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="input-label">Username</label>
                <input
                  className="input"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input
                  className="input"
                  value={user?.email}
                  disabled
                  className="input opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="input-label">Role</label>
                <div
                  className={`input ${roleInfo.bg} ${roleInfo.color} cursor-not-allowed capitalize`}
                >
                  {user?.role}
                </div>
                <p className="text-xs text-slate-400 mt-1">Contact an admin to change your role</p>
              </div>
              <button type="submit" id="save-profile-btn" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card p-6 max-w-md">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Change Password</h3>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="input-label">Current Password</label>
              <input
                type="password"
                className="input"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="input-label">New Password</label>
              <input
                type="password"
                className="input"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="input-label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              id="change-password-btn"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="card p-6 max-w-md">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Appearance</h3>
          <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</p>
              <p className="text-xs text-slate-400">Switch between light and dark theme</p>
            </div>
            <button
              id="appearance-theme-toggle"
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative
                ${theme === 'dark' ? 'bg-primary-600' : 'bg-slate-200'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300
                ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
              Color Theme
            </p>
            <div className="flex gap-3">
              {[
                { color: 'bg-primary-600', label: 'Indigo (Current)' },
                { color: 'bg-cyan-500', label: 'Cyan' },
                { color: 'bg-emerald-500', label: 'Emerald' },
                { color: 'bg-purple-500', label: 'Purple' },
              ].map((t) => (
                <div
                  key={t.label}
                  title={t.label}
                  className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform ${t.color} ${t.label.includes('Current') ? 'ring-2 ring-offset-2 ring-primary-500' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">System Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Application', value: 'DBMigrate Pro v1.0.0' },
              { label: 'Edition', value: 'Enterprise' },
              { label: 'Frontend', value: 'React 18 + Tailwind CSS v3' },
              { label: 'Backend', value: 'Node.js + Express.js' },
              { label: 'Database Support', value: 'MySQL 8+ / PostgreSQL 14+' },
              { label: 'Real-time', value: 'Socket.IO' },
              { label: 'Auth', value: 'JWT (RS256)' },
              { label: 'Encryption', value: 'AES-256' },
            ].map((info) => (
              <div key={info.label} className="bg-slate-50 dark:bg-surface-700 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">{info.label}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{info.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
