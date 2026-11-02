import { useCallback, useEffect, useState } from 'react';
import { Todo, TodoFilter } from '../../../shared/types';
import { todoApi } from '../api/todoApi';

const PAGE_LIMIT = 10;

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [counts, setCounts] = useState<{ all: number; active: number; completed: number }>({
    all: 0,
    active: 0,
    completed: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async (activeFilter: TodoFilter = filter) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await todoApi.getTodos({ filter: activeFilter, limit: PAGE_LIMIT });
      setTodos(res.todos);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
      setTotalCount(res.total);
      if (res.counts) {
        setCounts(res.counts);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTodos(filter);
  }, [filter, fetchTodos]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;

    try {
      setIsLoadingMore(true);
      setError(null);
      const res = await todoApi.getTodos({
        filter,
        limit: PAGE_LIMIT,
        cursor: nextCursor,
      });

      setTodos((prev) => [...prev, ...res.todos]);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load more tasks';
      setError(msg);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleFilterChange = (newFilter: TodoFilter) => {
    if (newFilter === filter) return;
    setFilter(newFilter);
  };

  const clearError = () => setError(null);

  const addTodo = async (title: string): Promise<boolean> => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Todo title cannot be empty.');
      return false;
    }

    try {
      setError(null);
      const created = await todoApi.createTodo({ title: trimmed });
      if (filter !== 'completed') {
        setTodos((prev) => [created, ...prev]);
        setTotalCount((prev) => prev + 1);
      }
      setCounts((prev) => ({
        ...prev,
        all: prev.all + 1,
        active: prev.active + 1,
      }));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add task';
      setError(msg);
      return false;
    }
  };

  const toggleTodo = async (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    const willBeCompleted = !target.completed;
    const previousTodos = [...todos];

    // Optimistic update
    setTodos((prev) =>
      filter === 'all'
        ? prev.map((t) =>
            t.id === id ? { ...t, completed: willBeCompleted, updatedAt: new Date().toISOString() } : t
          )
        : prev.filter((t) => t.id !== id)
    );
    if (filter !== 'all') setTotalCount((prev) => Math.max(0, prev - 1));

    setCounts((prev) => ({
      ...prev,
      active: willBeCompleted ? prev.active - 1 : prev.active + 1,
      completed: willBeCompleted ? prev.completed + 1 : prev.completed - 1,
    }));

    try {
      const updated = await todoApi.toggleTodo(id);
      if (filter === 'all') {
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      } else {
        await fetchTodos(filter);
      }
    } catch (err: unknown) {
      // Rollback
      setTodos(previousTodos);
      if (filter !== 'all') setTotalCount((prev) => prev + 1);
      setCounts((prev) => ({
        ...prev,
        active: willBeCompleted ? prev.active + 1 : prev.active - 1,
        completed: willBeCompleted ? prev.completed - 1 : prev.completed + 1,
      }));
      const msg = err instanceof Error ? err.message : 'Failed to toggle task';
      setError(msg);
    }
  };

  const updateTodo = async (id: string, newTitle: string): Promise<boolean> => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setError('Title cannot be empty.');
      return false;
    }

    const previousTodos = [...todos];
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, title: trimmed, updatedAt: new Date().toISOString() } : t
      )
    );

    try {
      const updated = await todoApi.updateTodo(id, { title: trimmed });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return true;
    } catch (err: unknown) {
      setTodos(previousTodos);
      const msg = err instanceof Error ? err.message : 'Failed to update task';
      setError(msg);
      return false;
    }
  };

  const deleteTodo = async (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    const previousTodos = [...todos];
    setTodos((prev) => prev.filter((t) => t.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
    setCounts((prev) => ({
      ...prev,
      all: Math.max(0, prev.all - 1),
      active: target.completed ? prev.active : Math.max(0, prev.active - 1),
      completed: target.completed ? Math.max(0, prev.completed - 1) : prev.completed,
    }));

    try {
      await todoApi.deleteTodo(id);
    } catch (err: unknown) {
      setTodos(previousTodos);
      setTotalCount((prev) => prev + 1);
      setCounts((prev) => ({
        ...prev,
        all: prev.all + 1,
        active: target.completed ? prev.active : prev.active + 1,
        completed: target.completed ? prev.completed + 1 : prev.completed,
      }));
      const msg = err instanceof Error ? err.message : 'Failed to delete task';
      setError(msg);
    }
  };

  const clearCompleted = async () => {
    const previousTodos = [...todos];
    const completedCount = counts.completed;
    if (completedCount === 0) return;

    setTodos((prev) => prev.filter((t) => !t.completed));
    setCounts((prev) => ({
      ...prev,
      all: Math.max(0, prev.all - completedCount),
      completed: 0,
    }));

    try {
      await todoApi.clearCompleted();
      fetchTodos(filter);
    } catch (err: unknown) {
      setTodos(previousTodos);
      setCounts((prev) => ({
        ...prev,
        all: prev.all + completedCount,
        completed: completedCount,
      }));
      const msg = err instanceof Error ? err.message : 'Failed to clear completed tasks';
      setError(msg);
    }
  };

  return {
    todos,
    totalCount,
    allTodosCount: counts.all,
    activeCount: counts.active,
    completedCount: counts.completed,
    filter,
    setFilter: handleFilterChange,
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
    refresh: () => fetchTodos(filter),
  };
}
