import React from 'react';
import { useTodos } from './hooks/useTodos';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { TodoInput } from './components/TodoInput';
import { TodoFilterTabs } from './components/TodoFilterTabs';
import { TodoList } from './components/TodoList';
import { TodoFooter } from './components/TodoFooter';
import { Toast } from './components/Toast';

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    todos,
    totalCount,
    allTodosCount,
    activeCount,
    completedCount,
    filter,
    setFilter,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    clearError,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    clearCompleted,
  } = useTodos();

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 flex flex-col items-center justify-start bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <Header theme={theme} onToggleTheme={toggleTheme} />

        {/* Global Error Banner */}
        <Toast message={error} onDismiss={clearError} />

        {/* Main Todo Card */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-700/60 p-6 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-5">
          {/* Input */}
          <TodoInput onAdd={addTodo} />

          {/* Filter Tabs */}
          {allTodosCount > 0 && (
            <TodoFilterTabs
              currentFilter={filter}
              onFilterChange={setFilter}
              counts={{
                all: allTodosCount,
                active: activeCount,
                completed: completedCount,
              }}
            />
          )}

          {/* List with pagination / load more */}
          <TodoList
            todos={todos}
            filter={filter}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            totalCount={totalCount}
            onLoadMore={loadMore}
            onToggle={toggleTodo}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
          />

          {/* Footer stats & clear button */}
          {allTodosCount > 0 && (
            <TodoFooter
              activeCount={activeCount}
              completedCount={completedCount}
              onClearCompleted={clearCompleted}
            />
          )}
        </div>

        {/* Quick Tips */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          💡 Tip: Double-click any task to edit inline • Press Enter to save • Escape to cancel
        </p>
      </div>
    </div>
  );
};

export default App;
