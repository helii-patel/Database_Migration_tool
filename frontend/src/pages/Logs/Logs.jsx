import React, { useState, useEffect } from 'react';
import { getLogs, exportLogs } from '../../api/logs';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ACTION_COLORS = {
  USER_LOGIN: 'text-emerald-500',
  USER_REGISTERED: 'text-blue-500',
  MIGRATION_CREATED: 'text-primary-500',
  CONNECTION_CREATED: 'text-cyan-500',
  CONNECTION_DELETED: 'text-rose-500',
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  const LIMIT = 20;

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getLogs({ page: p, limit: LIMIT, ...filters });
      setLogs(res.data.data.logs);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
      setPage(p);
    } catch {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportLogs(filters);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit_logs.csv';
      a.click();
      toast.success('Logs exported!');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const ACTIONS = [
    'USER_LOGIN',
    'USER_REGISTERED',
    'MIGRATION_CREATED',
    'CONNECTION_CREATED',
    'CONNECTION_DELETED',
    'CONNECTION_UPDATED',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Audit Logs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {total.toLocaleString()} entries
          </p>
        </div>
        <button
          id="export-logs-btn"
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary"
        >
          {exporting ? '⟳ Exporting...' : '⬇ Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <input
            className="input text-sm col-span-2 sm:col-span-1"
            placeholder="🔍 Search user or action..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select
            className="select text-sm"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          >
            <option value="">All Actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            className="select text-sm"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
          <input
            type="date"
            className="input text-sm"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <input
            type="date"
            className="input text-sm"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button type="submit" className="btn-primary text-sm" id="apply-filters-btn">
            Apply Filters
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => {
              setFilters({ search: '', action: '', status: '', startDate: '', endDate: '' });
              setTimeout(() => fetchLogs(1), 100);
            }}
          >
            Clear
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Status</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <td key={j}>
                        <div className="skeleton h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-slate-400 whitespace-nowrap">
                      {log.created_at ? format(new Date(log.created_at), 'MMM d, HH:mm:ss') : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-600/20 flex items-center justify-center">
                          <span className="text-primary-600 text-[10px] font-bold">
                            {log.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {log.username || '—'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`text-xs font-semibold ${ACTION_COLORS[log.action] || 'text-slate-500'}`}
                      >
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">
                      {log.resource_type ? `${log.resource_type}` : '—'}
                      {log.resource_id && (
                        <span className="font-mono ml-1 text-[10px]">
                          {log.resource_id.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="font-mono text-xs text-slate-400">{log.ip_address || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400">
            Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of{' '}
            {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1}
              className="btn-secondary text-xs py-1 px-3"
            >
              ← Prev
            </button>
            <span className="text-xs text-slate-500 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages}
              className="btn-secondary text-xs py-1 px-3"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
