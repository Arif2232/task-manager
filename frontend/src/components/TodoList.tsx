import React from 'react';
import { Todo, TodoFilter } from '../../../shared/types';
import { TodoItem } from './TodoItem';
import { EmptyState } from './EmptyState';
import { ChevronDown, Loader2 } from 'lucide-react';

interface TodoListProps {
  todos: Todo[];
  filter: TodoFilter;
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  totalCount?: number;
  onLoadMore?: () => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, newTitle: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  filter,
  isLoading,
  isLoadingMore = false,
  hasMore = false,
  totalCount,
  onLoadMore,
  onToggle,
  onUpdate,
  onDelete,
}) => {
  if (isLoading && todos.length === 0) {
    return (
      <div className="space-y-3 py-2 animate-pulse">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-16 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50"
          />
        ))}
      </div>
    );
  }

  if (todos.length === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <div className="space-y-2.5">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}

      {hasMore && onLoadMore && (
        <div className="pt-3 flex flex-col items-center space-y-2">
          {totalCount !== undefined && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Loaded <span className="font-semibold">{todos.length}</span> of{' '}
              <span className="font-semibold">{totalCount}</span> tasks
            </p>
          )}
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl flex items-center space-x-1.5 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Loading more tasks...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Load more</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
