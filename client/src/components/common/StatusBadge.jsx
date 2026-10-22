import React from 'react';
import { Circle, Clock, CheckCircle2, AlertTriangle, Bookmark } from 'lucide-react';

const StatusBadge = ({ status, size = 'sm', showIcon = true }) => {
  const configs = {
    'Not Started': {
      label: 'Not Started',
      style: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/80 dark:text-gray-400 dark:border-gray-700',
      icon: Circle
    },
    'Attempted': {
      label: 'Attempted',
      style: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/60',
      icon: Clock
    },
    'Solved': {
      label: 'Solved',
      style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
      icon: CheckCircle2
    },
    'Needs Revision': {
      label: 'Needs Revision',
      style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
      icon: AlertTriangle
    },
    'Revisit Later': {
      label: 'Revisit Later',
      style: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60',
      icon: Bookmark
    }
  };

  const current = configs[status] || configs['Not Started'];
  const Icon = current.icon;

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs gap-1',
    sm: 'px-2 py-0.5 text-xs font-medium gap-1.5',
    md: 'px-2.5 py-1 text-sm font-medium gap-1.5'
  };

  return (
    <span className={`inline-flex items-center rounded-md border ${sizeClasses[size] || sizeClasses.sm} ${current.style}`}>
      {showIcon && <Icon className="w-3 h-3 stroke-[2.5]" />}
      <span>{current.label}</span>
    </span>
  );
};

export default StatusBadge;
