import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getConnections } from '../../api/connections';
import { getMetrics, getMetricsHistory } from '../../api/monitoring';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/common/StatCard';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const MetricCard = ({ label, value, unit, color, icon, max }) => {
  const pct = max ? Math.min(100, (value / max) * 100) : null;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
            {typeof value === 'number' ? value.toFixed(1) : '—'}
            <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
          </p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
      {pct !== null && (
        <div className="progress-bar h-2">
          <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
        </div>
      )}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="card px-3 py-2 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong></p>
        ))}
      </div>
    );
  }
  return null;
};

const Monitoring = () => {
  const [connections, setConnections] = useState([]);
  const [selectedConn, setSelectedConn] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    getConnections().then((res) => {
      const conns = res.data.data;
      setConnections(conns);
      if (conns.length > 0) setSelectedConn(conns[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedConn) return;
    fetchMetrics();
    fetchHistory();

    // Real-time socket
    const socket = io('/', { path: '/socket.io' });
    socketRef.current = socket;
    socket.emit('monitor_connection', selectedConn);
    socket.on('metrics', (data) => {
      if (data.connectionId === selectedConn) {
        setMetrics(data);
        setHistory((prev) => [...prev.slice(-49), { ...data, time: format(new Date(), 'HH:mm:ss') }]);
      }
    });

    // Auto-refresh fallback
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchMetrics();
      }, 15000);
    }

    return () => {
      socket.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedConn, autoRefresh]);

  const fetchMetrics = async () => {
    if (!selectedConn) return;
    setLoadingMetrics(true);
    try {
      const res = await getMetrics(selectedConn);
      if (res.data.data) {
        const m = res.data.data;
        setMetrics(m);
        setHistory((prev) => [...prev.slice(-49), { ...m, time: format(new Date(), 'HH:mm:ss') }]);
      }
    } catch { } finally { setLoadingMetrics(false); }
  };

  const fetchHistory = async () => {
    if (!selectedConn) return;
    try {
      const res = await getMetricsHistory(selectedConn, 30);
      const h = res.data.data.map((s) => ({
        ...s,
        time: format(new Date(s.captured_at), 'HH:mm'),
      }));
      setHistory(h);
    } catch { }
  };

  const connName = connections.find((c) => c.id === selectedConn)?.name || 'Unknown';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Performance Monitoring</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time database metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            id="monitor-conn-select"
            className="select max-w-xs"
            value={selectedConn}
            onChange={(e) => setSelectedConn(e.target.value)}
          >
            {connections.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.db_type})</option>)}
          </select>
          <button onClick={fetchMetrics} disabled={loadingMetrics} className="btn-secondary">
            {loadingMetrics ? '⟳' : '🔄'} Refresh
          </button>
          <button
            onClick={() => setAutoRefresh((a) => !a)}
            className={`btn-secondary text-xs ${autoRefresh ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
          >
            {autoRefresh ? '⏸ Pause' : '▶ Live'}
          </button>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="text-4xl mb-3">🔌</p>
          <p className="font-medium">No connections configured</p>
          <p className="text-sm mt-1">Add a database connection to start monitoring</p>
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard label="CPU Usage" value={metrics?.cpu_usage} unit="%" color="#6172f5" icon="💻" max={100} />
            <MetricCard label="Memory" value={metrics?.memory_usage} unit="%" color="#06b6d4" icon="🧠" max={100} />
            <MetricCard label="Active Connections" value={metrics?.active_connections} unit="" color="#10b981" icon="🔗" max={metrics?.max_connections} />
            <MetricCard label="QPS" value={metrics?.queries_per_second} unit="q/s" color="#f59e0b" icon="⚡" />
            <MetricCard label="Slow Queries" value={metrics?.slow_queries} unit="" color="#f43f5e" icon="🐢" />
            <MetricCard label="Cache Hit" value={metrics?.buffer_hit_ratio} unit="%" color="#8b5cf6" icon="⚡" max={100} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU/Memory Chart */}
            <div className="card p-5">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">CPU & Memory Usage (%)</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCPU" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6172f5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6172f5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cpu_usage" name="CPU%" stroke="#6172f5" fill="url(#gradCPU)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="memory_usage" name="Memory%" stroke="#06b6d4" fill="url(#gradMem)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Connections + QPS Chart */}
            <div className="card p-5">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">Connections & QPS</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradConn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradQPS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="active_connections" name="Connections" stroke="#10b981" fill="url(#gradConn)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="queries_per_second" name="QPS" stroke="#f59e0b" fill="url(#gradQPS)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Details */}
          {metrics && (
            <div className="card p-5">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">Database Details — {connName}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Uptime', value: metrics.uptime_seconds ? `${Math.floor(metrics.uptime_seconds / 3600)}h` : 'N/A' },
                  { label: 'Max Connections', value: metrics.max_connections },
                  { label: 'Avg Query Time', value: `${metrics.avg_query_time_ms?.toFixed(1)} ms` },
                  { label: 'Cache Hit Ratio', value: `${metrics.buffer_hit_ratio?.toFixed(1)}%` },
                  { label: 'Disk Reads', value: metrics.disk_reads?.toLocaleString() },
                  { label: 'Cache Reads', value: metrics.cache_reads?.toLocaleString() },
                  { label: 'TPS', value: metrics.transactions_per_second?.toFixed(1) },
                  { label: 'Memory Used', value: `${metrics.memory_used_mb?.toFixed(0)} MB` },
                ].map((d) => (
                  <div key={d.label} className="bg-slate-50 dark:bg-surface-700 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">{d.label}</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{d.value ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Monitoring;
