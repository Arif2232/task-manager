import React from 'react';
import { ClipboardList, CheckCircle2, ListFilter } from 'lucide-react';
import { TodoFilter } from '../../../shared/types';

interface EmptyStateProps {
  filter: TodoFilter;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ filter }) => {
  const getContext = () => {
    switch (filter) {
      case 'active':
        return {
          icon: <CheckCircle2 className="w-10 h-10 text-emerald-500/80 mb-2" />,
          title: 'No active tasks',
          desc: 'Great job! You have cleared all pending items.',
        };
      case 'completed':
        return {
          icon: <ListFilter className="w-10 h-10 text-slate-400 mb-2" />,
          title: 'No completed tasks yet',
          desc: 'Tasks you finish will appear here.',
        };
      case 'all':
      default:
        return {
          icon: <ClipboardList className="w-10 h-10 text-indigo-400 mb-2" />,
          title: 'No tasks yet',
          desc: 'Type your first task above and press Enter to get started.',
        };
    }
  };

  const { icon, title, desc } = getContext();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-800/30">
      {icon}
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-500 max-w-xs mt-1">{desc}</p>
    </div>
  );
};
