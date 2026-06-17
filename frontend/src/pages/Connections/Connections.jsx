import React, { useState, useEffect } from 'react';
import {
  getConnections,
  createConnection,
  deleteConnection,
  testConnection,
} from '../../api/connections';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EMPTY_FORM = {
  name: '',
  db_type: 'mysql',
  host: 'localhost',
  port: 3306,
  database_name: '',
  username: '',
  password: '',
  ssl_enabled: false,
  description: '',
};

const dbTypeIcon = (t) => (t === 'mysql' ? '🐬' : '🐘');

const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({});
  const [search, setSearch] = useState('');

  const fetchConnections = async () => {
    try {
      const res = await getConnections();
      setConnections(res.data.data);
    } catch {
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleTypeChange = (type) => {
    setForm({
      ...form,
      db_type: type,
      port: type === 'mysql' ? 3306 : 5432,
      ssl_enabled: type === 'postgresql',
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createConnection({
        ...form,
        port: Number(form.port),
      });
      toast.success('Connection created successfully!');
      setModalOpen(false);
      setForm(EMPTY_FORM);
      fetchConnections();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create connection');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete connection "${name}"?`)) return;
    try {
      await deleteConnection(id);
      toast.success('Connection deleted');
      fetchConnections();
    } catch {
      toast.error('Failed to delete connection');
    }
  };

  const handleTest = async (id) => {
    setTesting((t) => ({ ...t, [id]: true }));
    try {
      const res = await testConnection(id);
      if (res.data.success) {
        toast.success(`✅ Connected! ${res.data.data?.table_count ?? 0} tables found.`);
      } else {
        toast.error(res.data.message);
      }
      fetchConnections();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Connection test failed');
    } finally {
      setTesting((t) => ({ ...t, [id]: false }));
    }
  };

  const filtered = connections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.host.toLowerCase().includes(search.toLowerCase()) ||
      c.db_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Database Connections
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {connections.length} connection{connections.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          id="add-connection-btn"
          onClick={() => {
            setForm(EMPTY_FORM);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          + Add Connection
        </button>
      </div>

      {/* Search */}
      <input
        id="connections-search"
        className="input max-w-xs"
        placeholder="🔍 Search connections..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-sm">
        {[
          { label: 'Total', value: connections.length, color: 'text-primary-500' },
          {
            label: 'Connected',
            value: connections.filter((c) => c.status === 'connected').length,
            color: 'text-emerald-500',
          },
          {
            label: 'Failed',
            value: connections.filter((c) => c.status === 'failed').length,
            color: 'text-rose-500',
          },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Connection</th>
                <th>Type</th>
                <th>Host</th>
                <th>Database</th>
                <th>Status</th>
                <th>Last Tested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j}>
                        <div className="skeleton h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    {search
                      ? 'No connections match your search'
                      : 'No connections yet. Click "Add Connection" to get started.'}
                  </td>
                </tr>
              ) : (
                filtered.map((conn) => (
                  <tr key={conn.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{dbTypeIcon(conn.db_type)}</span>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{conn.name}</p>
                          {conn.description && (
                            <p className="text-xs text-slate-400 truncate max-w-[150px]">
                              {conn.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={conn.db_type} />
                    </td>
                    <td className="font-mono text-xs">
                      {conn.host}:{conn.port}
                    </td>
                    <td className="font-mono text-xs">{conn.database_name}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`status-dot ${conn.status}`} />
                        <StatusBadge status={conn.status} />
                      </div>
                    </td>
                    <td className="text-xs text-slate-400">
                      {conn.last_tested_at
                        ? format(new Date(conn.last_tested_at), 'MMM d, HH:mm')
                        : 'Never'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTest(conn.id)}
                          className="btn-secondary text-xs py-1 px-3"
                          disabled={testing[conn.id]}
                        >
                          {testing[conn.id] ? '...' : '⚡ Test'}
                        </button>
                        <button
                          onClick={() => handleDelete(conn.id, conn.name)}
                          className="btn-ghost text-xs py-1 px-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Connection Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Database Connection"
        size="lg"
        id="add-connection-modal"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="input-label">Connection Name</label>
              <input
                className="input"
                placeholder="e.g. Production MySQL"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">Database Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['mysql', '🐬 MySQL'],
                  ['postgresql', '🐘 PostgreSQL'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all
                      ${form.db_type === val ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-primary-300'}`}
                    onClick={() => handleTypeChange(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="input-label">Port</label>
              <input
                className="input"
                type="number"
                value={form.port === '' || Number.isNaN(form.port) ? '' : form.port}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setForm({
                    ...form,
                    port: nextValue === '' ? '' : Number(nextValue),
                  });
                }}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="input-label">Host</label>
              <input
                className="input"
                placeholder="localhost or IP address"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">Database Name</label>
              <input
                className="input"
                placeholder="myDatabase"
                value={form.database_name}
                onChange={(e) => setForm({ ...form, database_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">Username</label>
              <input
                className="input"
                placeholder="root"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="input-label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="Database password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label">Description (optional)</label>
              <input
                className="input"
                placeholder="e.g. Production database"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="ssl-toggle"
                className="w-4 h-4 rounded text-primary-600"
                checked={form.ssl_enabled}
                onChange={(e) => setForm({ ...form, ssl_enabled: e.target.checked })}
              />
              <label
                htmlFor="ssl-toggle"
                className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Enable SSL
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={saving}
              id="save-connection-btn"
            >
              {saving ? 'Saving...' : '+ Add Connection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Connections;
