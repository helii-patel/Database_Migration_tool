import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getMigrations, createMigration, cancelMigration, retryMigration } from '../../api/migrations';
import { getConnections, getConnectionTables } from '../../api/connections';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/common/ProgressBar';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STEPS = ['Source', 'Destination', 'Tables', 'Options', 'Run'];

const Migration = () => {
  const [migrations, setMigrations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', source_connection_id: '', destination_connection_id: '', tables: [], migration_type: 'full', scheduled_at: '' });
  const [availableTables, setAvailableTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [creating, setCreating] = useState(false);
  const [liveLogs, setLiveLogs] = useState({});
  const [progress, setProgress] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchData();
    // Setup socket
    const socket = io('/', { path: '/socket.io' });
    socketRef.current = socket;
    socket.on('progress', ({ jobId, progress: p, tableName, migratedRecords, totalRecords }) => {
      setProgress((prev) => ({ ...prev, [jobId]: p }));
      setMigrations((prev) => prev.map((m) => m.id === jobId ? { ...m, progress: p, migrated_records: migratedRecords, total_records: totalRecords } : m));
      addLog(jobId, `[PROGRESS] ${tableName}: ${migratedRecords?.toLocaleString()}/${totalRecords?.toLocaleString()} (${p?.toFixed(1)}%)`);
    });
    socket.on('table_complete', ({ jobId, tableName, tableMigrated }) => {
      addLog(jobId, `[SUCCESS] Table "${tableName}" completed: ${tableMigrated?.toLocaleString()} records`);
    });
    socket.on('table_error', ({ jobId, tableName, error }) => {
      addLog(jobId, `[ERROR] Table "${tableName}": ${error}`);
    });
    socket.on('job_status', ({ jobId, status, migratedRecords, totalRecords }) => {
      setMigrations((prev) => prev.map((m) => m.id === jobId ? { ...m, status, migrated_records: migratedRecords || m.migrated_records } : m));
      addLog(jobId, `[STATUS] Job ${status.toUpperCase()}`);
    });
    return () => socket.disconnect();
  }, []);

  const addLog = (jobId, msg) => {
    setLiveLogs((prev) => ({
      ...prev,
      [jobId]: [...(prev[jobId] || []).slice(-100), `${new Date().toLocaleTimeString()} ${msg}`],
    }));
  };

  const fetchData = async () => {
    try {
      const [migRes, connRes] = await Promise.all([getMigrations(), getConnections()]);
      setMigrations(migRes.data.data);
      setConnections(connRes.data.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleNextStep = async () => {
    if (step === 1 && form.source_connection_id) {
      setLoadingTables(true);
      try {
        const res = await getConnectionTables(form.source_connection_id);
        setAvailableTables(res.data.data || []);
      } catch { toast.error('Failed to load tables'); }
      finally { setLoadingTables(false); }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await createMigration({ ...form, scheduled_at: form.scheduled_at || undefined });
      const newJob = res.data.data;
      setMigrations((prev) => [newJob, ...prev]);
      if (socketRef.current) socketRef.current.emit('join_job', newJob.id);
      toast.success('Migration job started!');
      setWizardOpen(false);
      setStep(0);
      setForm({ name: '', source_connection_id: '', destination_connection_id: '', tables: [], migration_type: 'full', scheduled_at: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create migration');
    } finally { setCreating(false); }
  };

  const handleCancel = async (id) => {
    try {
      await cancelMigration(id);
      toast.success('Migration cancelled');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  const handleRetry = async (id) => {
    try {
      const res = await retryMigration(id);
      const newJob = res.data.data;
      setMigrations((prev) => [newJob, ...prev]);
      if (socketRef.current) socketRef.current.emit('join_job', newJob.id);
      toast.success('Retry started');
    } catch { toast.error('Failed to retry'); }
  };

  const toggleTable = (t) => {
    setForm((f) => ({
      ...f,
      tables: f.tables.includes(t) ? f.tables.filter((x) => x !== t) : [...f.tables, t],
    }));
  };

  const connName = (id) => connections.find((c) => c.id === id)?.name || id;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Database Migrations</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{migrations.filter((m) => m.status === 'running').length} running</p>
        </div>
        <button id="new-migration-btn" onClick={() => { setWizardOpen(true); setStep(0); }} className="btn-primary">
          + New Migration
        </button>
      </div>

      {/* Migrations table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Job Name</th>
                <th>Source → Dest</th>
                <th>Tables</th>
                <th>Type</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Records</th>
                <th>Started</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3].map((i) => <tr key={i}>{[1,2,3,4,5,6,7,8,9].map((j) => <td key={j}><div className="skeleton h-4 rounded" /></td>)}</tr>)
              ) : migrations.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">No migrations yet. Start your first migration!</td></tr>
              ) : (
                migrations.map((m) => (
                  <tr key={m.id} className="cursor-pointer" onClick={() => setSelectedJob(m.id)}>
                    <td>
                      <p className="font-medium text-slate-800 dark:text-white">{m.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{m.id.slice(0, 8)}…</p>
                    </td>
                    <td className="text-xs">
                      <span className="text-slate-600 dark:text-slate-300">{m.sourceConnection?.name || '—'}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="text-slate-600 dark:text-slate-300">{m.destinationConnection?.name || '—'}</span>
                    </td>
                    <td><span className="badge-neutral">{m.tables?.length ?? 0}</span></td>
                    <td><StatusBadge status={m.migration_type} /></td>
                    <td><StatusBadge status={m.status} /></td>
                    <td className="min-w-[120px]">
                      <ProgressBar value={progress[m.id] ?? m.progress ?? 0} showPercent={false} height="h-1.5" />
                      <span className="text-xs text-slate-400">{(progress[m.id] ?? m.progress ?? 0).toFixed(1)}%</span>
                    </td>
                    <td className="text-xs text-slate-500">
                      {m.migrated_records?.toLocaleString() ?? 0}/{m.total_records?.toLocaleString() ?? 0}
                    </td>
                    <td className="text-xs text-slate-400">
                      {m.started_at ? format(new Date(m.started_at), 'MMM d HH:mm') : '—'}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {m.status === 'running' && (
                          <button onClick={() => handleCancel(m.id)} className="btn-ghost text-xs py-1 px-2 text-amber-500">⏹</button>
                        )}
                        {m.status === 'failed' && (
                          <button onClick={() => handleRetry(m.id)} className="btn-ghost text-xs py-1 px-2 text-primary-500">↺</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live log panel */}
      {selectedJob && liveLogs[selectedJob] && (
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Live Logs — {selectedJob.slice(0, 8)}…</p>
            <button onClick={() => setSelectedJob(null)} className="btn-ghost text-xs">✕ Close</button>
          </div>
          <div className="log-block">
            {liveLogs[selectedJob].map((l, i) => (
              <div key={i} className={`mb-0.5 ${l.includes('ERROR') ? 'text-rose-400' : l.includes('SUCCESS') ? 'text-emerald-400' : l.includes('PROGRESS') ? 'text-cyan-400' : 'text-slate-300'}`}>
                {l}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Migration Wizard Modal */}
      <Modal isOpen={wizardOpen} onClose={() => setWizardOpen(false)} title="New Migration" size="lg" id="migration-wizard">
        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all
                ${i === step ? 'bg-primary-600 text-white' : i < step ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-surface-700'}`}>
                {i < step ? '✓' : i + 1} {s}
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-600'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 0: Name */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="input-label">Migration Job Name</label>
              <input className="input" placeholder="e.g. Prod to Staging Migration" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
        )}

        {/* Step 1: Source */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 mb-2">Select the source database to migrate FROM</p>
            {connections.map((c) => (
              <div key={c.id}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${form.source_connection_id === c.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-primary-300'}`}
                onClick={() => setForm({ ...form, source_connection_id: c.id })}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.db_type === 'mysql' ? '🐬' : '🐘'}</span>
                  <div>
                    <p className="font-medium text-sm text-slate-800 dark:text-white">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.host}:{c.port}/{c.database_name}</p>
                  </div>
                  {form.source_connection_id === c.id && <span className="ml-auto text-primary-500">✓</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Destination */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 mb-2">Select the destination database to migrate TO</p>
            {connections.filter((c) => c.id !== form.source_connection_id).map((c) => (
              <div key={c.id}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${form.destination_connection_id === c.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-primary-300'}`}
                onClick={() => setForm({ ...form, destination_connection_id: c.id })}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.db_type === 'mysql' ? '🐬' : '🐘'}</span>
                  <div>
                    <p className="font-medium text-sm text-slate-800 dark:text-white">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.host}:{c.port}/{c.database_name}</p>
                  </div>
                  {form.destination_connection_id === c.id && <span className="ml-auto text-primary-500">✓</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Tables */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Select tables to migrate ({form.tables.length} selected)</p>
              <button className="text-xs text-primary-500 hover:underline" onClick={() =>
                setForm((f) => ({ ...f, tables: f.tables.length === availableTables.length ? [] : [...availableTables] }))
              }>
                {form.tables.length === availableTables.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            {loadingTables ? (
              <div className="text-center text-slate-400 py-6">Loading tables...</div>
            ) : availableTables.length === 0 ? (
              <div className="text-center text-slate-400 py-6">No tables found. Check your connection settings.</div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1">
                {availableTables.map((t) => (
                  <div key={t}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all
                      ${form.tables.includes(t) ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-surface-700'}`}
                    onClick={() => toggleTable(t)}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                      ${form.tables.includes(t) ? 'bg-primary-600 border-primary-600' : 'border-slate-300 dark:border-slate-500'}`}>
                      {form.tables.includes(t) && <span className="text-white text-[8px] font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Options */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <p className="input-label mb-2">Migration Type</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: 'full', label: '🔄 Full Migration', desc: 'Migrate all records' },
                  { val: 'incremental', label: '⚡ Incremental', desc: 'Migrate only new/changed records' },
                ].map((opt) => (
                  <div key={opt.val}
                    className={`p-3 rounded-xl border cursor-pointer transition-all text-center
                      ${form.migration_type === opt.val ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-primary-300'}`}
                    onClick={() => setForm({ ...form, migration_type: opt.val })}
                  >
                    <p className="font-medium text-sm text-slate-800 dark:text-white">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="input-label">Schedule (optional)</label>
              <input type="datetime-local" className="input" value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
              <p className="text-xs text-slate-400 mt-1">Leave empty to start immediately</p>
            </div>
            {/* Summary */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-700 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Summary</p>
              {[
                { label: 'Name', value: form.name },
                { label: 'Source', value: connName(form.source_connection_id) },
                { label: 'Destination', value: connName(form.destination_connection_id) },
                { label: 'Tables', value: `${form.tables.length} selected` },
                { label: 'Type', value: form.migration_type },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="btn-secondary">← Back</button>}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <button onClick={handleNextStep} className="btn-primary"
              disabled={
                (step === 0 && !form.name) ||
                (step === 1 && !form.source_connection_id) ||
                (step === 2 && !form.destination_connection_id) ||
                (step === 3 && form.tables.length === 0)
              }
            >Next →</button>
          ) : (
            <button onClick={handleCreate} className="btn-success" disabled={creating} id="start-migration-btn">
              {creating ? 'Starting...' : '🚀 Start Migration'}
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Migration;
