import React, { useState, useEffect } from 'react';
import { getMigrations, validateMigration } from '../../api/migrations';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Validation = () => {
  const [migrations, setMigrations] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    getMigrations().then((res) => {
      const completed = res.data.data.filter((m) => ['completed', 'running'].includes(m.status));
      setMigrations(completed);
      if (completed.length > 0) {
        setSelectedJob(completed[0].id);
        fetchReport(completed[0].id);
      }
    }).catch(() => {});
  }, []);

  const fetchReport = async (jobId) => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await api.get(`/migrations/${jobId}/validate`);
      // Wait a sec then get reports
      setTimeout(async () => {
        const rRes = await api.get(`/migrations/${jobId}/validate`);
      }, 500);
      const reportRes = await api.get(`/migrations/${jobId}/logs`);
      // Get actual validation reports
      try {
        const vrRes = await api.get(`/analytics/overview`);
      } catch (_) {}
      setReports([]);
    } catch { } finally { setLoading(false); }
  };

  const handleValidate = async () => {
    if (!selectedJob) return;
    setValidating(true);
    try {
      await validateMigration(selectedJob);
      toast.success('Validation started! Results will appear shortly.');
      setTimeout(() => loadValidationReports(selectedJob), 3000);
    } catch (err) {
      toast.error('Failed to start validation');
    } finally { setValidating(false); }
  };

  const loadValidationReports = async (jobId) => {
    try {
      const res = await api.get(`/migrations/${jobId}/logs`);
      // Parse validation from logs
      const logs = res.data.data || [];
      setReports(logs.filter((l) => l.event_type === 'success' || l.event_type === 'error').map((l) => ({
        table_name: l.table_name,
        status: l.event_type === 'success' ? 'passed' : 'failed',
        records_migrated: l.records_migrated,
        message: l.message,
        validated_at: l.created_at,
      })));
    } catch { }
  };

  useEffect(() => {
    if (selectedJob) loadValidationReports(selectedJob);
  }, [selectedJob]);

  const selectedMig = migrations.find((m) => m.id === selectedJob);
  const passed = reports.filter((r) => r.status === 'passed').length;
  const failed = reports.filter((r) => r.status === 'failed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Data Validation</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verify migration integrity</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select id="validation-job-select" className="select max-w-xs" value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}>
            {migrations.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            {migrations.length === 0 && <option value="">No completed migrations</option>}
          </select>
          <button id="run-validation-btn" onClick={handleValidate} disabled={validating || !selectedJob} className="btn-primary">
            {validating ? '⟳ Validating...' : '✅ Run Validation'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tables', value: reports.length || (selectedMig?.tables?.length ?? 0), color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/10' },
          { label: 'Passed', value: passed, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
          { label: 'Failed', value: failed, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/10' },
        ].map((s) => (
          <div key={s.label} className={`card p-5 ${s.bg}`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Migration details */}
      {selectedMig && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Migration Details</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Job Name', value: selectedMig.name },
              { label: 'Status', value: <StatusBadge status={selectedMig.status} /> },
              { label: 'Records Migrated', value: selectedMig.migrated_records?.toLocaleString() ?? '0' },
              { label: 'Tables', value: `${selectedMig.tables?.length ?? 0} tables` },
            ].map((d) => (
              <div key={d.label} className="bg-slate-50 dark:bg-surface-700 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">{d.label}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{d.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table-level results */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <p className="font-semibold text-slate-700 dark:text-slate-200">Table Validation Results</p>
          {reports.length > 0 && (
            <p className="text-xs text-slate-400">{passed}/{reports.length} passed</p>
          )}
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Table</th>
                <th>Status</th>
                <th>Records Migrated</th>
                <th>Message</th>
                <th>Validated At</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    {selectedJob ? 'Run validation to see results' : 'Select a migration to validate'}
                  </td>
                </tr>
              ) : (
                reports.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono text-sm">{r.table_name}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="tabular-nums">{r.records_migrated?.toLocaleString() ?? '—'}</td>
                    <td className="text-xs text-slate-500 max-w-xs truncate">{r.message}</td>
                    <td className="text-xs text-slate-400">
                      {r.validated_at ? format(new Date(r.validated_at), 'MMM d, HH:mm') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Validation;
