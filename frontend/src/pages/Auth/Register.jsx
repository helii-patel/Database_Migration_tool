import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'engineer' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-surface-950 bg-surface-50 p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
            <span className="text-white font-bold">DB</span>
          </div>
          <span className="font-bold text-xl text-slate-800 dark:text-white">DBMigrate Pro</span>
        </div>

        <div className="card p-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Create account</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
            Join your team's database platform
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Username</label>
              <input
                id="reg-username"
                type="text"
                className="input"
                placeholder="johndoe"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="input-label">Email address</label>
              <input
                id="reg-email"
                type="email"
                className="input"
                placeholder="john@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input
                id="reg-password"
                type="password"
                className="input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="input-label">Role</label>
              <select
                id="reg-role"
                className="select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="viewer">Viewer (read-only)</option>
                <option value="engineer">Database Engineer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              id="reg-submit"
              type="submit"
              className="btn-primary w-full justify-center py-3 mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create Account →'
              )}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
