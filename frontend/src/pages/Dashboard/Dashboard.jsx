import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { getAnalyticsOverview } from '../../api/analytics';
import { getMigrations } from '../../api/migrations';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const COLORS = ['#6172f5', '#f43f5e', '#10b981', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="card px-3 py-2 text-xs">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [recentMigrations, setRecentMigrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ovRes, migRes] = await Promise.all([getAnalyticsOverview(), getMigrations()]);
      setOverview(ovRes.data.data);
      setRecentMigrations(migRes.data.data.slice(0, 5));
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const kpis = overview?.kpis;
  const trends = overview?.trends || [];

  const pieData = kpis
    ? [
        { name: 'Completed', value: kpis.completedMigrations },
        { name: 'Failed', value: kpis.failedMigrations },
        { name: 'Running', value: kpis.runningMigrations },
        {
          name: 'Pending',
          value: Math.max(
            0,
            kpis.totalMigrations -
              kpis.completedMigrations -
              kpis.failedMigrations -
              kpis.runningMigrations
          ),
        },
      ].filter((d) => d.value > 0)
    : [];

  const healthScore = kpis?.healthScore ?? 0;
  const healthColor = healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            System health and migration statistics
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary text-xs" id="dashboard-refresh">
          🔄 Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="kpi-total"
          title="Total Migrations"
          value={kpis?.totalMigrations ?? '—'}
          icon="⇄"
          color="primary"
          subtitle={`${kpis?.runningMigrations ?? 0} currently running`}
          loading={loading}
        />
        <StatCard
          id="kpi-success"
          title="Success Rate"
          value={kpis?.successRate != null ? `${kpis.successRate}%` : '—'}
          icon="✅"
          color="emerald"
          subtitle={`${kpis?.completedMigrations ?? 0} completed`}
          loading={loading}
        />
        <StatCard
          id="kpi-connections"
          title="DB Connections"
          value={kpis?.totalConnections ?? '—'}
          icon="🔌"
          color="cyan"
          subtitle="Active connections"
          loading={loading}
        />
        <StatCard
          id="kpi-records"
          title="Records Migrated"
          value={
            kpis?.totalRecordsMigrated != null ? kpis.totalRecordsMigrated.toLocaleString() : '—'
          }
          icon="📦"
          color="purple"
          subtitle="All time"
          loading={loading}
        />
      </div>

      {/* Health + Trends row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score */}
        <div className="card p-6 flex flex-col items-center justify-center animate-fade-in">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
            System Health Score
          </p>
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-100 dark:text-surface-700"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                stroke={healthColor}
                strokeDasharray={`${(2 * Math.PI * 42 * healthScore) / 100} ${2 * Math.PI * 42 * (1 - healthScore / 100)}`}
                style={{ transition: 'stroke-dasharray 1s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-800 dark:text-white">
                {healthScore}
              </span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium" style={{ color: healthColor }}>
            {healthScore >= 80
              ? '🟢 Excellent'
              : healthScore >= 60
                ? '🟡 Good'
                : '🔴 Needs Attention'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Validation rate: {kpis?.validationRate ?? 0}%
          </p>
        </div>

        {/* Migration Trend - Area Chart */}
        <div className="card p-5 lg:col-span-2">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">
            Migration Trend (Last 7 Days)
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6172f5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6172f5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#6172f5"
                fill="url(#gradCompleted)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="failed"
                name="Failed"
                stroke="#f43f5e"
                fill="url(#gradFailed)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart + Recent Migrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">
            Migration Status Breakdown
          </p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {pieData.map((d, i) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              No migrations yet
            </div>
          )}
        </div>

        {/* Recent Migrations */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Recent Migrations
            </p>
            <Link to="/migrations" className="text-xs text-primary-500 hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              [1, 2, 3].map((i) => <div key={i} className="skeleton h-10 rounded-xl" />)
            ) : recentMigrations.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-8">
                No migrations yet.{' '}
                <Link to="/migrations" className="text-primary-500 hover:underline">
                  Start one →
                </Link>
              </div>
            ) : (
              recentMigrations.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-surface-700/50 hover:bg-slate-100 dark:hover:bg-surface-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/migrations`}
                      className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-primary-600 truncate block"
                    >
                      {m.name}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {m.tables?.length ?? 0} tables · {m.migrated_records?.toLocaleString() ?? 0}{' '}
                      records
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {m.created_at ? format(new Date(m.created_at), 'MMM d') : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
