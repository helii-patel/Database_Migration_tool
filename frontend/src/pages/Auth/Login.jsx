import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex dark:bg-surface-950 bg-surface-50">
      {/* Left panel - brand */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-surface-900 via-primary-900/40 to-surface-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(97,114,245,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.1),transparent_70%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
              <span className="text-white font-bold">DB</span>
            </div>
            <span className="text-white font-bold text-xl">DBMigrate Pro</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Enterprise Database<br />
            <span className="text-gradient">Migration Platform</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Migrate, monitor, and manage your databases with confidence. Built for database engineers and cloud teams.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              { icon: '⚡', label: 'Real-time Monitoring', desc: 'Live metrics & alerts' },
              { icon: '🔄', label: 'Smart Migration', desc: 'Full & incremental modes' },
              { icon: '✅', label: 'Data Validation', desc: 'Integrity verification' },
              { icon: '📊', label: 'Analytics', desc: 'Insights & reporting' },
            ].map((f) => (
              <div key={f.label} className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-white font-medium text-sm">{f.label}</div>
                <div className="text-slate-400 text-xs">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-slate-500 text-xs">
          © 2024 DBMigrate Pro. Enterprise Edition.
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold">DB</span>
              </div>
              <span className="font-bold text-xl text-slate-800 dark:text-white">DBMigrate Pro</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Sign in</h1>
            <p className="text-slate-500 dark:text-slate-400">Access your database administration portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Email address</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="admin@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="Your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn-primary w-full justify-center py-3 text-base"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign in →'}
            </button>

            {/* Demo credentials hint */}
            <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30">
              <p className="text-xs text-primary-700 dark:text-primary-400 font-medium mb-1">Demo Credentials</p>
              <p className="text-xs text-primary-600 dark:text-primary-500 font-mono">admin@demo.com / Admin@123</p>
            </div>

            <p className="text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                Create account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
