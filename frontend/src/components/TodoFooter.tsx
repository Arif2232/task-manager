import React from 'react';
import { Trash } from 'lucide-react';

interface TodoFooterProps {
  activeCount: number;
  completedCount: number;
  onClearCompleted: () => void;
}

export const TodoFooter: React.FC<TodoFooterProps> = ({
  activeCount,
  completedCount,
  onClearCompleted,
}) => {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
      <span>
        <strong className="font-semibold text-slate-800 dark:text-slate-200">
          {activeCount}
        </strong>{' '}
        {activeCount === 1 ? 'task' : 'tasks'} remaining
      </span>

      {completedCount > 0 && (
        <button
          type="button"
          onClick={onClearCompleted}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        >
          <Trash className="w-3.5 h-3.5" />
          <span>Clear completed ({completedCount})</span>
        </button>
      )}
    </div>
  );
};
