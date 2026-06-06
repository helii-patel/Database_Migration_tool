import React from 'react';

const STATUS_MAP = {
  completed: { label: 'Completed', cls: 'badge-success' },
  running: { label: 'Running', cls: 'badge-info' },
  failed: { label: 'Failed', cls: 'badge-error' },
  pending: { label: 'Pending', cls: 'badge-neutral' },
  cancelled: { label: 'Cancelled', cls: 'badge-neutral' },
  connected: { label: 'Connected', cls: 'badge-success' },
  unknown: { label: 'Unknown', cls: 'badge-neutral' },
  passed: { label: 'Passed', cls: 'badge-success' },
  warning: { label: 'Warning', cls: 'badge-warning' },
  admin: { label: 'Admin', cls: 'badge-error' },
  engineer: { label: 'Engineer', cls: 'badge-info' },
  viewer: { label: 'Viewer', cls: 'badge-neutral' },
  success: { label: 'Success', cls: 'badge-success' },
  failure: { label: 'Failure', cls: 'badge-error' },
  mysql: { label: 'MySQL', cls: 'badge-info' },
  postgresql: { label: 'PostgreSQL', cls: 'badge-info' },
  full: { label: 'Full', cls: 'badge-neutral' },
  incremental: { label: 'Incremental', cls: 'badge-warning' },
};

const StatusBadge = ({ status, customLabel }) => {
  const map = STATUS_MAP[status?.toLowerCase()] || { label: status || 'Unknown', cls: 'badge-neutral' };

  const hasDot = ['connected', 'running', 'completed', 'failed', 'passed'].includes(status?.toLowerCase());
  const dotColor = {
    connected: 'bg-emerald-500',
    running: 'bg-blue-500 animate-pulse',
    completed: 'bg-emerald-500',
    failed: 'bg-rose-500',
    passed: 'bg-emerald-500',
  }[status?.toLowerCase()];

  return (
    <span className={map.cls}>
      {hasDot && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${dotColor}`} />}
      {customLabel || map.label}
    </span>
  );
};

export default StatusBadge;
